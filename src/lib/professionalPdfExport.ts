import jsPDF from "jspdf";
import "jspdf-autotable";
import type { Job } from "@/types";
import { translations } from "./translations";
import { getAddressFromCoordinates, formatAddress } from "./geocoding";

type Language = "sv" | "en";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// LexFlares Brand Colors
const COLORS = {
  primary: [249, 115, 22],      // Orange #F97316
  primaryDark: [234, 88, 12],   // Dark Orange #EA580C
  secondary: [59, 130, 246],    // Blue #3B82F6
  dark: [15, 23, 42],           // Dark #0F172A
  darkLight: [30, 41, 59],      // Dark Light #1E293B
  text: [255, 255, 255],        // White
  textMuted: [148, 163, 184],   // Gray #94A3B8
  success: [16, 185, 129],      // Green #10B981
  background: [248, 250, 252],  // Light Gray #F8FAFC
};

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

// LexFlares Logo as base64 SVG
const LEXFLARES_LOGO = `data:image/svg+xml;base64,${btoa(`
<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EA580C;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Icon -->
  <circle cx="20" cy="20" r="16" fill="url(#orangeGrad)"/>
  <path d="M 12 20 L 20 12 L 28 20 L 20 28 Z" fill="white" opacity="0.9"/>
  <circle cx="20" cy="20" r="4" fill="white"/>
  
  <!-- Text -->
  <text x="42" y="18" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0F172A">LexFlares</text>
  <text x="42" y="30" font-family="Arial, sans-serif" font-size="8" fill="#64748B">Bridge Solutions</text>
</svg>
`)}`;

const getLang = (): Language => {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("language") as Language) || "sv";
  }
  return "sv";
};

// Add professional header with logo and branding
const addProfessionalHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  // Background header bar
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');
  
  // Logo
  try {
    doc.addImage(LEXFLARES_LOGO, 'PNG', 14, 10, 40, 13);
  } catch (e) {
    console.error('Could not add logo:', e);
  }
  
  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, doc.internal.pageSize.width - 14, 22, { align: 'right' });
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(subtitle, doc.internal.pageSize.width - 14, 32, { align: 'right' });
  }
  
  // Date
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const dateStr = new Date().toLocaleDateString('sv-SE', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(dateStr, doc.internal.pageSize.width - 14, 42, { align: 'right' });
};

// Add professional footer
const addProfessionalFooter = (doc: jsPDF, pageNum: number, totalPages: number, lang: Language) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Footer line
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
  
  // Company info
  doc.setFontSize(8);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.setFont("helvetica", "normal");
  doc.text("LexFlares AB | Svenska Bro Solutions", 14, pageHeight - 12);
  doc.text("Kyiv, Ukraine | contact@lexflares.com", 14, pageHeight - 8);
  
  // Page number
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(
    `${lang === 'sv' ? 'Sida' : 'Page'} ${pageNum} ${lang === 'sv' ? 'av' : 'of'} ${totalPages}`,
    pageWidth - 14,
    pageHeight - 10,
    { align: 'right' }
  );
  
  // Copyright
  doc.setFontSize(7);
  doc.setTextColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
  doc.text(
    `© ${new Date().getFullYear()} LexFlares AB. All rights reserved.`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
};

// Add section header
const addSectionHeader = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(COLORS.primaryDark[0], COLORS.primaryDark[1], COLORS.primaryDark[2]);
  doc.roundedRect(14, y, doc.internal.pageSize.width - 28, 10, 2, 2, 'F');
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, 18, y + 7);
  
  return y + 15;
};

// Add info field with label and value
const addInfoField = (doc: jsPDF, label: string, value: string, x: number, y: number, width: number = 80): number => {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
  doc.text(label + ":", x, y);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(value, width);
  doc.text(lines, x, y + 5);
  
  return y + (lines.length * 5) + 8;
};

// Export single job to professional PDF
export const exportJobToProfessionalPDF = async (job: Job) => {
  const lang = getLang();
  const t = translations[lang];
  const doc = new jsPDF();
  
  const bridgeName = job.bridge?.name || job.bro_id || 'Unknown Bridge';
  const reportTitle = lang === 'sv' ? 'Arbetsrapport' : 'Work Report';
  const dateStr = job.start_tid ? new Date(job.start_tid).toLocaleDateString('sv-SE') : 'N/A';
  
  // Header
  addProfessionalHeader(doc, reportTitle, bridgeName);
  
  let y = 60;
  
  // Bridge Information Section
  y = addSectionHeader(doc, lang === 'sv' ? '🌉 Broinformation' : '🌉 Bridge Information', y);
  
  y = addInfoField(doc, t.bridgeId || 'Bridge ID', job.bro_id || 'N/A', 20, y);
  if (job.bridge?.name) {
    y = addInfoField(doc, t.bridgeName || 'Bridge Name', job.bridge.name, 20, y);
  }
  
  y += 5;
  
  // Work Details Section
  y = addSectionHeader(doc, lang === 'sv' ? '🔧 Arbetsdetaljer' : '🔧 Work Details', y);
  
  y = addInfoField(doc, t.date || 'Date', dateStr, 20, y);
  
  if (job.user?.full_name) {
    y = addInfoField(doc, t.responsibleUser || 'Responsible', job.user.full_name, 20, y);
  }
  
  y = addInfoField(
    doc, 
    t.timeSpent || 'Time Spent', 
    `${job.tidsatgang || 0} ${t.hours || 'hours'}`, 
    20, 
    y
  );
  
  if (job.material) {
    y = addInfoField(doc, t.materials || 'Materials', job.material, 20, y, 160);
  }
  
  y += 5;
  
  // Notes Section
  if (job.anteckningar) {
    y = addSectionHeader(doc, lang === 'sv' ? '📝 Anteckningar' : '📝 Notes', y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const notesLines = doc.splitTextToSize(job.anteckningar, 170);
    doc.text(notesLines, 20, y);
    y += notesLines.length * 6 + 10;
  }
  
  // GPS Location Section
  const gps = job.gps as { lat: number, lng: number } | null;
  if (gps) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    
    y = addSectionHeader(doc, lang === 'sv' ? '📍 GPS Position' : '📍 GPS Location', y);
    
    y = addInfoField(
      doc,
      lang === 'sv' ? 'Koordinater' : 'Coordinates',
      `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`,
      20,
      y
    );
    
    // Try to fetch and display address
    try {
      const address = await getAddressFromCoordinates(gps.lat, gps.lng);
      if (address) {
        const addressText = formatAddress(address, true);
        y = addInfoField(doc, lang === 'sv' ? 'Adress' : 'Address', addressText, 20, y, 160);
      }
    } catch (e) {
      console.error('Could not fetch address:', e);
    }
    
    // Try to add map
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      try {
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${gps.lat},${gps.lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7Clabel:J%7C${gps.lat},${gps.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
        const mapImage = await fetchAsDataURL(mapUrl);
        
        if (y > 180) {
          doc.addPage();
          y = 20;
        }
        
        doc.addImage(mapImage, 'JPEG', 20, y, 170, 85);
        y += 95;
      } catch (e) {
        console.error('Could not add map:', e);
      }
    }
  }
  
  // Photos Section
  const images = job.bilder as string[] | undefined;
  if (images && images.length > 0) {
    doc.addPage();
    y = 20;
    
    y = addSectionHeader(doc, lang === 'sv' ? '📷 Foton' : '📷 Photos', y);
    
    for (let i = 0; i < images.length; i++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          
          img.onload = () => {
            try {
              const maxWidth = 170;
              const imgWidth = maxWidth;
              const imgHeight = (img.height * imgWidth) / img.width;
              
              if (y + imgHeight > doc.internal.pageSize.height - 30) {
                doc.addPage();
                y = 20;
              }
              
              // Add photo number
              doc.setFontSize(9);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
              doc.text(`${lang === 'sv' ? 'Foto' : 'Photo'} ${i + 1}`, 20, y);
              y += 6;
              
              // Add image with border
              doc.setDrawColor(COLORS.textMuted[0], COLORS.textMuted[1], COLORS.textMuted[2]);
              doc.setLineWidth(0.5);
              doc.rect(20, y, imgWidth, imgHeight);
              doc.addImage(images[i], "JPEG", 20, y, imgWidth, imgHeight);
              y += imgHeight + 15;
              
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => reject(new Error("Image load failed"));
          img.src = images[i];
        });
      } catch (error) {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `[${lang === 'sv' ? 'Foto' : 'Photo'} ${i + 1}: ${lang === 'sv' ? 'Kunde inte laddas' : 'Could not load'}]`,
          20,
          y
        );
        y += 10;
      }
    }
  }
  
  // Add footer to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addProfessionalFooter(doc, i, totalPages, lang);
  }
  
  // Generate filename
  const safeBridgeName = (job.bridge?.name || job.bro_id || 'job')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);
  const filename = `Svenska_Bro_${safeBridgeName}_${dateStr}.pdf`;
  
  doc.save(filename);
};

// Export multiple jobs to professional PDF
export const exportJobsToProfessionalPDF = (jobs: Job[], title: string) => {
  const lang = getLang();
  const t = translations[lang];
  const doc = new jsPDF();
  
  // Header
  addProfessionalHeader(doc, title, `${jobs.length} ${lang === 'sv' ? 'arbeten' : 'jobs'}`);
  
  // Create table data
  const tableData = jobs.map(job => [
    job.bro_id || 'N/A',
    job.bridge?.name || 'N/A',
    job.start_tid ? new Date(job.start_tid).toLocaleDateString('sv-SE') : 'N/A',
    `${job.tidsatgang || 0}h`,
    job.material || '-',
    job.user?.full_name || '-',
  ]);
  
  doc.autoTable({
    head: [[
      t.bridgeId || 'ID',
      t.bridgeName || 'Bridge',
      t.date || 'Date',
      t.timeSpent || 'Time',
      t.materials || 'Materials',
      t.responsibleUser || 'Responsible',
    ]],
    body: tableData,
    startY: 60,
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });
  
  // Add footer to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addProfessionalFooter(doc, i, totalPages, lang);
  }
  
  // Generate filename
  const safeTitle = title.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
  const dateStr = new Date().toLocaleDateString('sv-SE');
  const filename = `Svenska_Bro_${safeTitle}_${dateStr}.pdf`;
  
  doc.save(filename);
};

