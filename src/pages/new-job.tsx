import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, MapPin, Camera, Save, X, Building, ClipboardList, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage } from "@/lib/storage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Job, Bridge, User, JobInsert } from "@/types";
import { useTranslation } from "@/lib/translations";
import { jobService } from "@/services/jobService";
import { broService } from "@/services/broService";
import { useToast } from "@/hooks/use-toast";
import { exportJobToProfessionalPDF } from "@/lib/professionalPdfExport";
import { getAddressFromCoordinates, formatAddress, Address } from "@/lib/geocoding";

// Add function to add EXIF metadata to image
function addMetadataToImage(
  imageDataUrl: string, 
  metadata: { lat: number; lng: number; timestamp: string }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      const fontSize = Math.max(12, Math.floor(img.width / 80));
      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      
      const padding = fontSize;
      const lineHeight = fontSize + 4;
      const lines = [
        `📍 ${metadata.lat.toFixed(6)}, ${metadata.lng.toFixed(6)}`,
        `📅 ${new Date(metadata.timestamp).toLocaleDateString('sv-SE')}`,
        `🕐 ${new Date(metadata.timestamp).toLocaleTimeString('sv-SE')}`
      ];
      
      const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      const bgHeight = (lines.length * lineHeight) + (padding * 2);
      
      ctx.fillRect(padding, img.height - bgHeight - padding, maxWidth + (padding * 2), bgHeight);
      
      ctx.fillStyle = 'white';
      lines.forEach((line, index) => {
        ctx.fillText(
          line, 
          padding * 2, 
          img.height - bgHeight - padding + (padding * 1.5) + (index * lineHeight)
        );
      });
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageDataUrl;
  });
}

export default function NewJobPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const { bridgeId: queryBridgeId } = router.query;
  
  const [selectedBridgeId, setSelectedBridgeId] = useState<string>("");
  const [otherJobDescription, setOtherJobDescription] = useState("");
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [materials, setMaterials] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [notes, setNotes] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [gpsAddress, setGpsAddress] = useState<Address | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    const user = storage.getUser();
    setCurrentUser(user);

    const fetchBridges = async () => {
        try {
            const allBridges = await broService.getAllBridges();
            setBridges(allBridges);
        } catch (error) {
            console.error("Failed to fetch bridges:", error);
            toast({ title: "Fel", description: "Kunde inte hämta broar."});
        }
    }
    fetchBridges();

    if (typeof queryBridgeId === "string") {
      setSelectedBridgeId(queryBridgeId);
    }
  }, [queryBridgeId, toast]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setGpsPosition(coords);
          
          // Fetch address from coordinates
          setIsLoadingAddress(true);
          try {
            const address = await getAddressFromCoordinates(coords.lat, coords.lng);
            setGpsAddress(address);
          } catch (error) {
            console.error("Failed to get address:", error);
          } finally {
            setIsLoadingAddress(false);
          }
        },
        (error) => console.error("GPS error:", error)
      );
    }
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || photos.length >= 10) return;
    const file = files[0];
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result && gpsPosition) {
        const originalImage = event.target.result as string;
        
        const imageWithMetadata = await addMetadataToImage(originalImage, {
          lat: gpsPosition.lat,
          lng: gpsPosition.lng,
          timestamp: new Date().toISOString()
        });
        
        setPhotos([...photos, imageWithMetadata]);
      } else if (event.target?.result) {
        setPhotos([...photos, event.target.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCameraLoading(false);
      }, 100);
    } catch (error) {
      console.error('Camera error:', error);
      setCameraLoading(false);
      
      // Better error messages based on error type
      let errorMessage = language === 'sv' ? 'Kunde inte starta kameran' : 'Could not start camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = language === 'sv' 
            ? 'Kameratillgång nekad. Ge webbläsaren tillgång till kameran.' 
            : 'Camera access denied. Please grant camera permission.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = language === 'sv' 
            ? 'Ingen kamera hittades på enheten.' 
            : 'No camera found on device.';
        }
      }
      
      toast({
        title: language === 'sv' ? 'Kamerafel' : 'Camera Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    setShowCamera(false);
    setCameraLoading(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !stream) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    if (gpsPosition) {
      const imageWithMetadata = await addMetadataToImage(imageDataUrl, {
        lat: gpsPosition.lat,
        lng: gpsPosition.lng,
        timestamp: new Date().toISOString()
      });
      setPhotos([...photos, imageWithMetadata]);
    } else {
      setPhotos([...photos, imageDataUrl]);
    }
    
    stopCamera();
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSaveJob = async () => {
    if (!currentUser || !currentUser.id) {
      toast({ title: t("mustBeLoggedIn"), variant: "destructive" });
      router.push("/");
      return;
    }
    
    if (!selectedBridgeId && !otherJobDescription.trim()) {
        toast({ title: language === "sv" ? "Val saknas" : "Selection missing", description: language === "sv" ? "Välj en bro eller beskriv det övriga jobbet." : "Select a bridge or describe the other job.", variant: "destructive"});
        return;
    }

    const jobData: Omit<JobInsert, 'id' | 'created_at' | 'updated_at' | 'synced'> = {
      bro_id: selectedBridgeId !== "other" ? selectedBridgeId : null,
      start_tid: new Date().toISOString(),
      anteckningar: notes || (selectedBridgeId === "other" ? otherJobDescription : ""),
      material: materials,
      ansvarig_anvandare: currentUser.id,
      gps: gpsPosition ? { lat: gpsPosition.lat, lng: gpsPosition.lng } : null,
      bilder: photos,
      tidsatgang: parseFloat(timeSpent) || null,
      slut_tid: new Date().toISOString(),
      weather_data: null,
      status: 'pågående'
    };

    try {
        const newJob = await jobService.createJob(jobData);
        if (!newJob) throw new Error("Failed to create job");
        
        const selectedBridge = bridges.find(b => b.id === newJob.bro_id);
        storage.setLastActivity({ bridgeId: newJob.bro_id!, bridgeName: selectedBridge?.name || 'Okänt jobb', date: newJob.start_tid as string });
        
        toast({ title: t("jobSaved"), description: language === "sv" ? "Jobbet har synkroniserats med molnet." : "The job has been synced to the cloud." });
        router.push("/journal");

    } catch (error) {
        console.error("Failed to save job:", error);
        toast({ title: language === "sv" ? "Spara misslyckades" : "Save failed", description: (error as Error).message || (language === "sv" ? "Kunde inte spara. Försöker spara lokalt." : "Could not save. Trying to save locally."), variant: "destructive"});
    }
  };

  const handleExportPDF = async () => {
    if (!selectedBridgeId && !otherJobDescription.trim()) {
      toast({ 
        title: language === "sv" ? "Val saknas" : "Selection missing", 
        description: language === "sv" ? "Välj en bro eller beskriv jobbet först." : "Select a bridge or describe the job first.", 
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    const selectedBridge = bridges.find(b => b.id === selectedBridgeId);
    
    const tempJob: Job = {
      id: `temp-${Date.now()}`,
      bro_id: selectedBridgeId !== "other" ? selectedBridgeId : "",
      start_tid: new Date().toISOString(),
      slut_tid: null,
      status: "slutfört",
      anteckningar: notes,
      material: materials,
      ansvarig_anvandare: currentUser?.id || "",
      gps: gpsPosition ? { lat: gpsPosition.lat, lng: gpsPosition.lng } : null,
      bilder: photos,
      tidsatgang: parseFloat(timeSpent) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      weather_data: null,
      synced: false,
      bridge: selectedBridge ? { id: selectedBridge.id, name: selectedBridge.name } : { id: "", name: otherJobDescription || "Övrigt jobb"},
      user: { full_name: currentUser?.full_name || currentUser?.email || "Okänd" },
    };

    try {
      await exportJobToProfessionalPDF(tempJob);
      toast({ 
        title: language === "sv" ? "PDF skapad!" : "PDF created!", 
        description: language === "sv" ? "Jobbrapporten har exporterats." : "The job report has been exported." 
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({ 
        title: t("error"), 
        description: language === "sv" ? "Kunde inte skapa PDF. Försök igen." : "Could not create PDF. Try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-xl hover:bg-white/10"><ArrowLeft size={24} className="text-white" /></Button>
           <h1 className="text-xl font-semibold text-white">{t("newJob")}</h1>
           <LanguageSwitcher />
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex-1 relative">
            {cameraLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-[hsl(24,95%,53%)] mx-auto mb-4" />
                  <p className="text-white">{language === 'sv' ? 'Startar kamera...' : 'Starting camera...'}</p>
                </div>
              </div>
            ) : (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <Button onClick={stopCamera} variant="ghost" className="bg-black/50 hover:bg-black/70 text-white"><X size={24} /></Button>
              {gpsPosition && (<div className="bg-black/50 px-3 py-1 rounded-lg text-white text-sm">📍 {gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)}</div>)}
            </div>
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              <Button 
                onClick={capturePhoto} 
                disabled={photos.length >= 10 || cameraLoading} 
                className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 disabled:opacity-50"
              >
                <Camera size={32} className="text-black" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen gradient-bg pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="premium-card">
            <h3 className="text-lg font-semibold mb-3 text-white">{language === "sv" ? "Information" : "Information"}</h3>
            <div className="space-y-4">
              <Select value={selectedBridgeId} onValueChange={setSelectedBridgeId}>
                  <SelectTrigger className="frosted-glass border-gray-700 text-white">
                      <Building size={16} className="mr-2" />
                      <SelectValue placeholder={t("selectBridgePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="other">{language === "sv" ? "Övrigt jobb (ej bro-specifikt)" : "Other job (not bridge-specific)"}</SelectItem>
                      {bridges.map(bridge => (
                          <SelectItem key={bridge.id} value={bridge.id}>{bridge.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              {selectedBridgeId === 'other' && (
                <Textarea
                  value={otherJobDescription}
                  onChange={(e) => setOtherJobDescription(e.target.value)}
                  placeholder={language === 'sv' ? 'Beskriv platsen eller arbetet...' : 'Describe the location or work...'}
                  className="frosted-glass border-gray-700 text-white"
                />
              )}
              <Input type="text" value={new Date().toLocaleDateString(language === "sv" ? "sv-SE" : "en-US")} disabled className="frosted-glass border-gray-700 text-white" />
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-[hsl(24,95%,53%)] flex-shrink-0 mt-1" />
                <div className="flex-1">
                  {isLoadingAddress ? (
                    <span className="text-sm text-gray-400">{language === "sv" ? "Hämtar adress..." : "Fetching address..."}</span>
                  ) : gpsAddress ? (
                    <div className="text-sm">
                      <p className="text-white font-medium">{formatAddress(gpsAddress)}</p>
                      {gpsPosition && (
                        <p className="text-xs text-gray-500 mt-1">
                          {gpsPosition.lat.toFixed(6)}, {gpsPosition.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  ) : gpsPosition ? (
                    <span className="text-sm text-white">
                      {gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">{t("fetchingGPS")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="premium-card">
            <h3 className="text-lg font-semibold mb-3 text-white">{t("photos")} ({photos.length}/10)</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button onClick={startCamera} className="premium-button py-4" disabled={photos.length >= 10}>
                <Camera size={18} className="mr-2"/>
                {language === "sv" ? "Ta foto" : "Take Photo"}
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={photos.length >= 10}/>
                <div className="frosted-glass border border-gray-700 text-white hover:bg-white/5 py-4 rounded-lg flex items-center justify-center">
                  <ClipboardList size={18} className="mr-2"/>
                  {language === "sv" ? "Från galleri" : "From Gallery"}
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <Button onClick={() => removePhoto(index)} size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50"><X size={14} /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card"><h3 className="text-lg font-semibold mb-3 text-white">{t("materials")}</h3><Textarea value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="..." className="frosted-glass border-gray-700 text-white min-h-[100px]" /></div>
          <div className="premium-card"><h3 className="text-lg font-semibold mb-3 text-white">{t("timeSpent")}</h3><Input type="number" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)} placeholder={language === "sv" ? "t.ex. 4 timmar" : "e.g. 4 hours"} className="frosted-glass border-gray-700 text-white" /></div>
          <div className="premium-card"><h3 className="text-lg font-semibold mb-3 text-white">{t("notes")}</h3><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="..." className="frosted-glass border-gray-700 text-white min-h-[120px]" /></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={handleSaveJob} className="w-full premium-button py-6 text-base"><Save size={20} className="mr-2" />{t("saveJob")}</Button>
            <Button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              variant="outline" 
              className="w-full frosted-glass border-[hsl(24,95%,53%)] text-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,53%)]/10 py-6 text-base"
            >
              {isExporting ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  {language === 'sv' ? 'Skapar PDF...' : 'Creating PDF...'}
                </>
              ) : (
                <>
                  <FileDown size={20} className="mr-2" />
                  {t("exportPDF")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
