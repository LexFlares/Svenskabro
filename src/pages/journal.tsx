import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Calendar, MapPin, FileDown, Search, Trash2, Filter, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/translations";
import { storage } from "@/lib/storage";
import type { Job, User as CurrentUser } from "@/types";
import { jobService } from "@/services/jobService";
import { exportJobsToProfessionalPDF, exportJobToProfessionalPDF } from "@/lib/professionalPdfExport";
import { getAddressFromCoordinates, formatAddressShort } from "@/lib/geocoding";

export default function JournalPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [jobAddresses, setJobAddresses] = useState<Record<string, string>>({});

  useEffect(() => {
    const user = storage.getUser();
    if (user) {
      setCurrentUser(user);
    } else {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const allJobs = await jobService.getAllJobs();
        setJobs(allJobs);
        // ❌ REMOVED: storage.saveJobs(allJobs); - Causes QuotaExceededError
        // Journal page doesn't need to cache all jobs in localStorage
        
        // Fetch addresses for jobs with GPS coordinates
        const addresses: Record<string, string> = {};
        for (const job of allJobs) {
          // CRITICAL FIX: Validate GPS data exists and has correct structure
          if (job.gps && typeof job.gps === 'object') {
            const gpsCoords = job.gps as any;
            
            // CRITICAL FIX: Check multiple possible GPS coordinate formats
            let lat: number | undefined;
            let lng: number | undefined;
            
            // Format 1: { lat: number, lng: number }
            if (gpsCoords.lat !== undefined && gpsCoords.lng !== undefined) {
              lat = gpsCoords.lat;
              lng = gpsCoords.lng;
            }
            // Format 2: { latitude: number, longitude: number }
            else if (gpsCoords.latitude !== undefined && gpsCoords.longitude !== undefined) {
              lat = gpsCoords.latitude;
              lng = gpsCoords.longitude;
            }
            // Format 3: { lat: number, lon: number }
            else if (gpsCoords.lat !== undefined && gpsCoords.lon !== undefined) {
              lat = gpsCoords.lat;
              lng = gpsCoords.lon;
            }
            
            // CRITICAL FIX: Only call geocoding if coordinates are valid
            if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
              try {
                console.log(`📍 Fetching address for job ${job.id} at lat=${lat}, lng=${lng}`);
                const address = await getAddressFromCoordinates(lat, lng);
                if (address) {
                  addresses[job.id] = formatAddressShort(address);
                  console.log(`✅ Address found for job ${job.id}: ${addresses[job.id]}`);
                } else {
                  console.warn(`⚠️ No address found for job ${job.id}`);
                }
              } catch (error) {
                console.error(`❌ Failed to get address for job ${job.id}:`, error);
              }
            } else {
              console.warn(`⚠️ Invalid GPS coordinates for job ${job.id}:`, { lat, lng, gpsCoords });
            }
          } else {
            console.log(`ℹ️ No GPS data for job ${job.id}`);
          }
        }
        setJobAddresses(addresses);
      } catch (error) {
        console.error("Failed to fetch jobs from Supabase:", error);
        // ✅ FALLBACK: Load from localStorage if Supabase fails
        const localJobs = storage.getJobs();
        if (localJobs.length > 0) {
          setJobs(localJobs);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const deleteJob = async (id: string) => {
    if (window.confirm(language === "sv" ? "Är du säker på att du vill radera detta jobb?" : "Are you sure you want to delete this job?")) {
      try {
        await jobService.deleteJob(id);
        const updatedJobs = jobs.filter((job) => job.id !== id);
        setJobs(updatedJobs);
        // ❌ REMOVED: storage.saveJobs(updatedJobs); - Not needed anymore
      } catch (error) {
        console.error("Failed to delete job:", error);
      }
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (job.bro_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.anteckningar || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.bridge?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesDate = !filterDate || (job.start_tid && job.start_tid.startsWith(filterDate));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDeleteJob = (jobId: string) => {
    if (confirm(language === "sv" ? "Är du säker på att du vill radera detta jobb?" : "Are you sure you want to delete this job?")) {
      deleteJob(jobId);
    }
  };

  const exportFilteredJobs = () => {
    if (filteredJobs.length === 0) {
      alert(t("noJobs"));
      return;
    }
    const user = storage.getUser();
    const title = `${t("journalTitle")} - ${user?.full_name || user?.username}`;
    exportJobsToProfessionalPDF(filteredJobs, title);
  };

  const handleExportSingleJob = (job: Job) => {
    try {
      exportJobToProfessionalPDF(job);
    } catch (error) {
      console.error("PDF export error:", error);
      alert(language === "sv" ? "Kunde inte skapa PDF" : "Could not create PDF");
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-600/80 text-white border-green-500">{t("completed")}</Badge>;
      case "in-progress": return <Badge className="bg-blue-600/80 text-white border-blue-500">{t("inProgress")}</Badge>;
      case "reported": return <Badge className="bg-orange-600/80 text-white border-orange-500">{t("reported")}</Badge>;
      default: return <Badge variant="secondary">{t("inProgress")}</Badge>;
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-xl hover:bg-white/10"><ArrowLeft size={24} className="text-white" /></Button>
           <h1 className="text-xl font-semibold text-white">{t("journalTitle")}</h1>
           <LanguageSwitcher />
        </div>
      </div>

      <div className="min-h-screen gradient-bg pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <p className="text-sm text-[hsl(24,95%,53%)]">
                {filteredJobs.length} {language === "sv" ? "jobb" : "jobs"}
              </p>
            </div>
            <Button onClick={exportFilteredJobs} className="premium-button flex-shrink-0">
              <FileDown size={18} className="mr-2" />
              <span>{t("exportPDF")}</span>
            </Button>
          </div>

          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder={language === "sv" ? "Sök jobb..." : "Search jobs..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="frosted-glass border-gray-700 text-white pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="frosted-glass border-gray-700 text-white flex-1" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] frosted-glass border-gray-700 text-white">
                  <Filter size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  <SelectItem value="in-progress">{t("inProgress")}</SelectItem>
                  <SelectItem value="completed">{t("completed")}</SelectItem>
                  <SelectItem value="reported">{t("reported")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="premium-card card-hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-xl font-semibold text-white">{job.bridge?.name || job.bro_id}</h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-gray-400">{job.bro_id}</p>
                  </div>
                  <Button onClick={() => handleDeleteJob(job.id)} size="icon" variant="ghost" className="rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 size={18} />
                  </Button>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-[hsl(24,95%,53%)]" /><span className="text-gray-300">{new Date(job.start_tid).toLocaleDateString(language === "sv" ? "sv-SE" : "en-US")}</span></div>
                  {job.user?.full_name && <div className="flex items-center gap-2 text-sm"><User size={16} className="text-[hsl(24,95%,53%)]" /><span className="text-gray-300">{job.user?.full_name}</span></div>}
                  {job.tidsatgang && <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-[hsl(24,95%,53%)]" /><span className="text-gray-300">{job.tidsatgang} {language === "sv" ? "timmar" : "hours"}</span></div>}
                  {job.gps && jobAddresses[job.id] && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-[hsl(24,95%,53%)]" />
                      <span className="text-gray-300">{jobAddresses[job.id]}</span>
                    </div>
                  )}
                </div>
                {job.anteckningar && <p className="text-sm mb-4 p-3 rounded-lg frosted-glass border-gray-700">{job.anteckningar}</p>}
                {job.bilder && (job.bilder as string[]).length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(job.bilder as string[]).slice(0, 3).map((photo, index) => <img key={index} src={photo} alt={`${t("photo")} ${index + 1}`} className="w-full h-20 object-cover rounded-lg border border-white/10" />)}
                  </div>
                )}
                <Button 
                  onClick={() => handleExportSingleJob(job)} 
                  variant="outline" 
                  className="w-full frosted-glass border-[hsl(24,95%,53%)] text-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,53%)]/10"
                >
                  <FileDown size={16} className="mr-2" />
                  {language === "sv" ? "Exportera detta jobb" : "Export this job"}
                </Button>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg mb-2 text-gray-400">{t("noJobs")}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
