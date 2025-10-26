import jsPDF from "jspdf";
import "jspdf-autotable";
import type { Job } from "@/types";
import { translations } from "./translations";
import * as XLSX from "xlsx";
import { getAddressFromCoordinates, formatAddress } from "./geocoding";

type Language = "sv" | "en";

// Helper function to fetch an image and convert it to a data URL
async function fetchAsDataURL(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const addHeaderFooter = (doc: jsPDF, title: string, lang: Language) => {
  const pageCount = doc.internal.pages.length - 1; // Correct way to get page count
  const t = translations[lang];

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text("Svenska Bro Aktiebolag - " + title, 14, 22);

    doc.setFontSize(10);
    doc.text(
      `${t.page || "Page"} ${i} / ${pageCount}`,
      doc.internal.pageSize.width - 20,
      doc.internal.pageSize.height - 10
    );
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      t.madeByLexHub || "Made by LexHub",
      14,
      doc.internal.pageSize.height - 10
    );
    doc.text(
      `© ${new Date().getFullYear()} Svenska Bro Aktiebolag`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }
};

const getLang = (): Language => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("language") as Language) || "sv";
  }
  return "sv";
};

export const exportJobsToPDF = (jobs: Job[], title: string) => {
  const lang = getLang();
  const t = translations[lang];
  const doc = new jsPDF();

  const head = [
    [
      t.bridgeId || "Bridge ID",
      t.date || "Date",
      t.timeSpent || "Time (h)",
      t.materials || "Materials",
      t.notes || "Notes",
    ],
  ];

  const body = jobs.map((job) => [
    job.bro_id,
    job.start_tid ? new Date(job.start_tid).toLocaleDateString() : "",
    job.tidsatgang?.toString() || "0",
    job.material,
    job.anteckningar,
  ]);

  doc.autoTable({
    head: head,
    body: body,
    startY: 30,
    theme: "striped",
    headStyles: { fillColor: [29, 53, 87] },
    styles: { font: "helvetica", fontSize: 10 },
  });

  addHeaderFooter(doc, title, lang);

  doc.save(`${title.replace(/ /g, "_")}.pdf`);
};

export const exportJobToPDF = async (job: Job) => {
  const lang = getLang();
  const t = translations[lang];
  const doc = new jsPDF();
  const title = `${t.jobReport || "Job Report"} - ${job.bridge?.name || job.bro_id}`;

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);

  let y = 40;

  const addField = (label: string, value: string | undefined | null) => {
    if (value) {
      doc.setFontSize(12).setFont("helvetica", "bold").text(`${label}:`, 14, y);
      doc.setFontSize(11).setFont("helvetica", "normal").text(value, 50, y);
      y += 8;
    }
  };

  addField(t.bridgeId || "Bridge ID", job.bro_id || "");
  addField(t.date || "Date", job.start_tid ? new Date(job.start_tid).toLocaleDateString() : "");
  if (job.user?.full_name) {
    addField(t.responsibleUser || "Responsible", job.user.full_name);
  }
  const gps = job.gps as { lat: number, lng: number } | null;
  if (gps) {
    addField(
      t.gpsPosition || "GPS",
      `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`
    );
  }
  addField(t.timeSpent || "Time Spent", `${job.tidsatgang || 0} ${t.hours || "hours"}`);
  addField(t.materials || "Materials", job.material || "");

  y += 5;
  doc.setFontSize(12).setFont("helvetica", "bold").text(`${t.notes}:`, 14, y);
  y += 8;
  doc.setFontSize(11).setFont("helvetica", "normal");
  const notesLines = doc.splitTextToSize(job.anteckningar || "", 180);
  doc.text(notesLines, 14, y);
  y += notesLines.length * 5 + 10;

  const images = job.bilder as string[] | undefined;
  if (images && images.length > 0) {
    doc.addPage();
    y = 20;
    doc.setFontSize(14).text(t.photos || "Photos", 14, y);
    y += 10;

    const x = 14;
    
    for (let i = 0; i < images.length; i++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          
          img.onload = () => {
            try {
              const imgWidth = 80;
              const imgHeight = (img.height * imgWidth) / img.width;

              if (y + imgHeight > doc.internal.pageSize.height - 20) {
                doc.addPage();
                y = 20;
              }

              doc.addImage(images[i], "JPEG", x, y, imgWidth, imgHeight);
              y += imgHeight + 10;
              
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => reject(new Error("Image load failed"));
          img.src = images[i];
        });
      } catch (error) {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`[${t.photos || "Photo"} ${i + 1}: ${lang === "sv" ? "Kunde inte laddas" : "Could not load"}]`, x, y);
        y += 15;
      }
    }
  }

  if (job.gps) {
    const gpsCoords = job.gps as { lat: number; lng: number };
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${gpsCoords.lat},${gpsCoords.lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7Clabel:J%7C${gpsCoords.lat},${gpsCoords.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    
    try {
      // Fetch address
      const address = await getAddressFromCoordinates(gpsCoords.lat, gpsCoords.lng);
      const addressText = address ? formatAddress(address, true) : null;
      
      const mapImage = await fetchAsDataURL(mapUrl);
      doc.addImage(mapImage, 'JPEG', 15, y, 180, 90);
      y += 100;
      
      // Display address if available
      if (addressText) {
        doc.setFontSize(11).setFont("helvetica", "bold");
        doc.text("📍 " + (lang === "sv" ? "Plats:" : "Location:"), 14, y);
        doc.setFontSize(10).setFont("helvetica", "normal");
        const addressLines = doc.splitTextToSize(addressText, 180);
        doc.text(addressLines, 14, y + 6);
        y += (addressLines.length * 5) + 8;
      }
      
      doc.setFontSize(9).setTextColor(100);
      doc.textWithLink(
        `${lang === "sv" ? "Koordinater:" : "Coordinates:"} ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}`, 
        14, 
        y, 
        { url: `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}` }
      );
      y += 8;
    } catch (error) {
      console.error("Could not fetch map image for PDF:", error);
      doc.text('Karta kunde inte laddas.', doc.internal.pageSize.width / 2, y + 45, { align: 'center' });
      y += 100;
      
      doc.setFontSize(10).textWithLink(`GPS: ${gpsCoords.lat.toFixed(6)}, ${gpsCoords.lng.toFixed(6)}`, 14, y, {
        url: `https://www.google.com/maps?q=${gpsCoords.lat},${gpsCoords.lng}`
      });
      y += 10;
    }
  }

  addHeaderFooter(doc, title, lang);
  doc.save(`${(job.bridge?.name || job.bro_id || 'job').replace(/ /g, "_")}_${new Date(job.start_tid).toISOString().split('T')[0]}.pdf`);
};


export const exportJobsToExcel = (jobs: Job[], title: string) => {
  const lang = getLang();
  const t = translations[lang];

  const worksheetData = jobs.map(job => ({
    [t.bridgeId || "Bridge ID"]: job.bro_id,
    [t.bridgeName || "Bridge Name"]: job.bridge?.name || "",
    [t.date || "Date"]: job.start_tid ? new Date(job.start_tid).toLocaleDateString() : "",
    [t.timeSpent || "Time (h)"]: job.tidsatgang,
    [t.materials || "Materials"]: job.material,
    [t.notes || "Notes"]: job.anteckningar,
    [t.responsibleUser || "Responsible"]: job.user?.full_name || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");

  XLSX.writeFile(workbook, `${title.replace(/ /g, "_")}.xlsx`);
};

declare module "./translations" {
  interface TranslationKeys {
    page?: string;
    jobReport?: string;
    responsibleUser?: string;
    hours?: string;
    bridgeName?: string;
    gpsPosition?: string;
  }
}
