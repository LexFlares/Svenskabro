import { useState, useEffect, useCallback } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { Users, Download, Upload, Plus, Edit, Trash2, AlertTriangle, ArrowLeft, Mail, Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/translations";
import { storage } from "@/lib/storage";
import { jobService } from "@/services/jobService";
import { broService } from "@/services/broService";
import type { Job, Bridge, Deviation, Document, User, Profile, BridgeInsert, WorkGroupMember, WorkGroupWithMembers, DbWorkGroup } from "@/types";
import { exportJobsToExcel } from "@/lib/pdfExport";
import { exportJobsToProfessionalPDF } from "@/lib/professionalPdfExport";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as Collapsible from "@radix-ui/react-collapsible";

const AdminPage: NextPage = () => {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroupWithMembers[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isImportingKML, setIsImportingKML] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isLoadingWorkGroups, setIsLoadingWorkGroups] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "employee">("employee");
  const [inviteSent, setInviteSent] = useState(false);

  const [editFullName, setEditFullName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "employee">("employee");

  // FIXED: Ultra-fast auth check - localStorage only, skip Supabase entirely if user exists
  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      console.log("🔐 [Admin] Checking authentication state...");
      
      // CRITICAL: Check localStorage FIRST and ONLY (instant access)
      const localUser = storage.getUser();
      if (localUser && localUser.id && localUser.email) {
        console.log("✅ [Admin] Valid user in localStorage - SKIPPING Supabase check:", localUser.id);
        setCurrentUser(localUser);
        setIsCheckingAuth(false);
        return; // Exit - NO Supabase check needed
      }
      
      console.log("⚠️ [Admin] No valid localStorage user - checking Supabase session...");
      setIsCheckingAuth(true);
      
      // Extended timeout for Supabase check (only runs if no localStorage)
      const timeoutId = setTimeout(() => {
        console.warn("⏰ [Admin] Auth check timeout (15s)");
        setIsCheckingAuth(false);
      }, 15000);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ [Admin] Supabase session error:", error);
          clearTimeout(timeoutId);
          setIsCheckingAuth(false);
          return;
        }
        
        if (session?.user) {
          console.log("✅ [Admin] Found Supabase session:", session.user.id);
          
          let profile = await authService.getProfile(session.user.id);

          if (!profile) {
            console.warn("⚠️ [Admin] Profile not found, creating...");
             profile = await authService.upsertProfile(
              session.user.id,
              session.user.email || "",
              session.user.user_metadata?.full_name as string | undefined,
              session.user.user_metadata
            );
          }
          
          if (profile) {
            console.log("✅ [Admin] Profile loaded/created:", profile.id);
            storage.saveUser(profile as Profile);
            setCurrentUser(profile as Profile);
          } else {
            console.error("❌ [Admin] Failed to load or create profile, logging out.");
            await authService.signOut();
            storage.clearUser();
          }
        } else {
          console.log("ℹ️ [Admin] No active session found.");
        }
      } catch (error) {
        console.error("💥 [Admin] Auth error:", error);
      } finally {
        clearTimeout(timeoutId);
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
    
    return () => setMounted(false);
  }, []);

  // FIXED: Load data when user is set and is admin
  useEffect(() => {
    if (!mounted || !currentUser || isCheckingAuth) return;

    // Only admins can access this page
    if (currentUser.role !== 'admin') {
      console.warn("⚠️ Non-admin user attempted to access admin panel:", currentUser.id);
      return;
    }

    // Load local data immediately
    setJobs(storage.getJobs());
    setDocuments(storage.getDocuments());
    setDeviations(storage.getDeviations());

    // Load remote data in parallel
    console.log("📊 Initializing admin panel data...");
    Promise.all([
      loadProfiles(),
      loadWorkGroups()
    ]).catch(err => {
      console.error("Failed to load admin data:", err);
    });
  }, [mounted, currentUser, isCheckingAuth]);

  const loadProfiles = useCallback(async () => {
    if (!mounted) return;
    
    setIsLoadingProfiles(true);
    console.log("👥 Loading profiles from Supabase...");
    
    try {
      const profilesResult = await authService.getAllProfiles();
      
      if (profilesResult.error) {
        console.error("❌ Error loading profiles:", profilesResult.error);
        if (mounted) {
          toast({
            title: t("error"),
            description: language === "sv" ? "Kunde inte ladda användare" : "Could not load users",
            variant: "destructive"
          });
          setProfiles([]);
        }
      } else {
        console.log(`✅ Loaded ${profilesResult.profiles.length} profiles`);
        if (mounted) {
          setProfiles(profilesResult.profiles);
        }
      }
    } catch (error) {
      console.error("💥 Unexpected error loading profiles:", error);
      if (mounted) {
        setProfiles([]);
        toast({
          title: t("error"),
          description: language === "sv" ? "Oväntat fel vid laddning av användare" : "Unexpected error loading users",
          variant: "destructive"
        });
      }
    } finally {
      if (mounted) {
        setIsLoadingProfiles(false);
      }
    }
  }, [mounted, toast, t, language]);

  const loadWorkGroups = useCallback(async () => {
    if (!mounted) return;
    
    setIsLoadingWorkGroups(true);
    console.log("👥 Loading work groups from Supabase...");
    
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from("work_groups")
        .select(`
          *,
          creator:created_by (
            *
          ),
          members:work_group_members (
            *,
            profile:user_id (
              *
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (groupsError) {
        console.error("❌ Error loading work groups:", groupsError);
        throw groupsError;
      }

      if (groupsData && groupsData.length > 0) {
        console.log(`✅ Loaded ${groupsData.length} work groups`);
        if (mounted) {
          setWorkGroups(groupsData as unknown as WorkGroupWithMembers[]);
        }
      } else {
        console.log("ℹ️ No work groups found");
        if (mounted) {
          setWorkGroups([]);
        }
      }
    } catch (error) {
      console.error("💥 Error loading work groups:", error);
      if (mounted) {
        toast({
          title: t("error"),
          description: language === "sv" ? "Kunde inte ladda arbetsgrupper" : "Could not load work groups",
          variant: "destructive"
        });
        setWorkGroups([]);
      }
    } finally {
      if (mounted) {
        setIsLoadingWorkGroups(false);
      }
    }
  }, [mounted, toast, t, language]);

  const handleExport = (format: "pdf" | "excel") => {
    const title = language === "sv" ? "Veckorapport" : "Weekly Report";
    if (format === "pdf") exportJobsToProfessionalPDF(jobs, title);
    else exportJobsToExcel(jobs, title);
  };

  const openUserModal = (user: Profile | null) => {
    setEditingUser(user);
    if (user) {
      setEditFullName(user.full_name || '');
      setEditRole(user.role === 'admin' ? 'admin' : 'employee');
    }
    setIsUserModalOpen(true);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast({
        title: language === "sv" ? "E-post krävs" : "Email required",
        description: language === "sv" ? "Ange en giltig e-postadress" : "Enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log("📧 Sending invite to:", inviteEmail);
    
    const { error } = await authService.inviteUserByEmail(
      inviteEmail,
      inviteFullName || inviteEmail.split('@')[0],
      inviteRole
    );
    setIsLoading(false);

    if (error) {
      console.error("❌ Invite failed:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive"
      });
    } else {
      console.log("✅ Invite sent successfully");
      setInviteSent(true);
      toast({
        title: language === "sv" ? "Inbjudan skickad!" : "Invitation sent!",
        description: `${language === "sv" ? "En inbjudan har skickats till" : "An invitation has been sent to"} ${inviteEmail}`,
      });
      setTimeout(() => {
        loadProfiles();
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInviteFullName("");
        setInviteRole("employee");
        setInviteSent(false);
      }, 2000);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    console.log("💾 Updating user:", editingUser.id, "to role:", editRole);
    
    const { error } = await authService.updateProfileRole(editingUser.id, editRole);
    setIsLoading(false);

    if (error) {
      console.error("❌ Update failed:", error);
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      console.log("✅ User updated successfully");
      toast({ title: language === "sv" ? "Uppdaterad!" : "Updated!", description: language === "sv" ? "Användaren har uppdaterats" : "User has been updated" });
      setIsUserModalOpen(false);
      loadProfiles();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm(language === "sv" ? "Är du säker på att du vill radera denna användare?" : "Are you sure you want to delete this user?")) {
      setIsLoading(true);
      console.log("🗑️ Deleting user:", userId);
      
      const { error } = await authService.deleteUser(userId);
      setIsLoading(false);

      if (error) {
        console.error("❌ Delete failed:", error);
        toast({ title: t("error"), description: error.message, variant: "destructive" });
      } else {
        console.log("✅ User deleted successfully");
        toast({ title: language === "sv" ? "Raderad!" : "Deleted!", description: language === "sv" ? "Användaren har raderats" : "User has been deleted" });
        loadProfiles();
      }
    }
  };

  const handleKMLUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImportingKML(true);
    console.log("📂 Importing KML file:", file.name);
    toast({ title: language === "sv" ? "Påbörjar import..." : "Starting import...", description: file.name });
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      
      const placemarks = xmlDoc.getElementsByTagName("Placemark");
      if (placemarks.length === 0) {
        toast({ title: language === "sv" ? "Inga data" : "No data", description: language === "sv" ? "Inga 'Placemark'-element hittades i filen." : "No 'Placemark' elements found in the file.", variant: "destructive" });
        setIsImportingKML(false);
        return;
      }
        
      const newBridges: BridgeInsert[] = [];
      
      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const name = placemark.getElementsByTagName("name")[0]?.textContent || `Bro ${i + 1}`;
        const description = placemark.getElementsByTagName("description")[0]?.textContent || "";
        const coordinates = placemark.getElementsByTagName("coordinates")[0]?.textContent?.trim();
        
        if (coordinates) {
          const [lon, lat] = coordinates.split(",").map(Number);
          if (!isNaN(lat) && !isNaN(lon)) {
            newBridges.push({ name, description, x: lon, y: lat, ta_plan_url: "" });
          }
        }
      }
      
      if (newBridges.length > 0) {
        console.log(`📊 Importing ${newBridges.length} bridges...`);
        const { error } = await broService.importBridges(newBridges);
        if (error) throw error;
        console.log("✅ Import successful");
        toast({ title: language === "sv" ? "Importerat!" : "Imported!", description: `${newBridges.length} ${language === "sv" ? "broar har importerats." : "bridges have been imported."}` });
      } else {
        toast({ title: language === "sv" ? "Inga broar hittades" : "No bridges found", description: language === "sv" ? "Inga giltiga broar hittades i filen" : "No valid bridges found in file", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("❌ KML import error:", error);
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } finally {
      setIsImportingKML(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleClearBridges = async () => {
    if (confirm(language === "sv" ? "Är du säker på att du vill radera alla broar?" : "Are you sure you want to delete all bridges?")) {
      console.log("🗑️ Clearing all bridges...");
      const { error } = await broService.clearAllBridges();
      if (error) {
        console.error("❌ Clear bridges failed:", error);
        toast({ title: t("error"), description: language === "sv" ? "Kunde inte radera broar." : "Could not delete bridges.", variant: "destructive" });
      } else {
        console.log("✅ All bridges cleared");
        toast({ title: language === "sv" ? "Raderat!" : "Deleted!", description: language === "sv" ? "Alla broar raderade från databasen" : "All bridges deleted from the database" });
      }
    }
  };

  const handleBack = () => {
    router.push('/').catch(() => {
      window.location.href = '/';
    });
  };

  const handleRetryAuth = () => {
    setIsCheckingAuth(true);
    window.location.reload();
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) return null;

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="premium-card max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {language === "sv" ? "Kontrollerar autentisering..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // If no user after check, show auth message with retry option
  if (!currentUser) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="premium-card max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            {language === "sv" ? "Autentisering krävs" : "Authentication Required"}
          </h2>
          <p className="text-gray-400 mb-6">
            {language === "sv" 
              ? "Du måste vara inloggad för att komma åt admin-panelen" 
              : "You must be logged in to access the admin panel"}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleRetryAuth} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {language === "sv" ? "Försök igen" : "Try Again"}
            </Button>
            <Button onClick={handleBack} className="w-full premium-button">
              {language === "sv" ? "Gå till Dashboard" : "Go to Dashboard"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not admin after mounted, show access denied
  if (currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="premium-card max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            {language === "sv" ? "Åtkomst nekad" : "Access Denied"}
          </h2>
          <p className="text-gray-400 mb-6">
            {language === "sv" 
              ? "Du måste vara admin för att komma åt denna sida" 
              : "You must be an admin to access this page"}
          </p>
          <Button onClick={handleBack} className="premium-button">
            {language === "sv" ? "Tillbaka till Dashboard" : "Back to Dashboard"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gradient-bg text-white min-h-screen">
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="outline" className="frosted-glass border-blue-500/50 text-blue-400">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
            <h1 className="text-2xl md:text-4xl font-bold">{t("adminTitle")}</h1>
          </div>
          <LanguageSwitcher />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="premium-card"><CardHeader><CardTitle>{t("jobsThisWeek")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{jobs.length}</p></CardContent></Card>
            <Card className="premium-card"><CardHeader><CardTitle>{t("avgTime")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">6.2h</p></CardContent></Card>
            <Card className="premium-card"><CardHeader><CardTitle>{t("totalDeviations")}</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{deviations.length}</p></CardContent></Card>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="premium-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("userManagement")}</CardTitle>
                <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                  <DialogTrigger asChild><Button className="premium-button"><Mail className="mr-2 h-4 w-4" />{language === "sv" ? "Bjud in" : "Invite"}</Button></DialogTrigger>
                  <DialogContent className="bg-gray-800 text-white border-gray-700">
                    <DialogHeader><DialogTitle>{language === "sv" ? "Bjud in ny användare" : "Invite New User"}</DialogTitle></DialogHeader>
                    {inviteSent ? (<div className="flex flex-col items-center justify-center py-8 space-y-4"><div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"><Check className="w-8 h-8 text-green-400" /></div><p className="text-lg font-semibold text-green-400">{language === "sv" ? "Inbjudan skickad!" : "Invitation sent!"}</p><p className="text-sm text-gray-400 text-center">{language === "sv" ? "Användaren har fått ett e-postmeddelande med instruktioner" : "The user has received an email with instructions"}</p></div>) : (<div className="space-y-4"><div><label className="block text-sm font-medium mb-2">{language === "sv" ? "E-postadress" : "Email Address"} *</label><Input type="email" placeholder="användarens@email.se" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-gray-700"/></div><div><label className="block text-sm font-medium mb-2">{language === "sv" ? "Namn (valfritt)" : "Name (optional)"}</label><Input placeholder={language === "sv" ? "Namn" : "Name"} value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} className="bg-gray-700"/></div><div><label className="block text-sm font-medium mb-2">{t("role")}</label><Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "admin" | "employee")}><SelectTrigger className="bg-gray-700"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="employee">{t("employee")}</SelectItem><SelectItem value="admin">{t("admin")}</SelectItem></SelectContent></Select></div><Button onClick={handleInviteUser} disabled={isLoading || !inviteEmail} className="w-full premium-button">{isLoading ? (language === "sv" ? "Skickar..." : "Sending...") : (language === "sv" ? "Skicka inbjudan" : "Send Invitation")}</Button></div>)}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoadingProfiles ? (
                  <div className="text-center py-8"><p className="text-gray-400">{language === "sv" ? "Laddar användare..." : "Loading users..."}</p></div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-8"><p className="text-gray-400">{language === "sv" ? "Inga användare hittades" : "No users found"}</p></div>
                ) : (
                  <Table><TableHeader><TableRow><TableHead>{t("name")}</TableHead><TableHead>{t("email")}</TableHead><TableHead>{t("role")}</TableHead><TableHead className="text-right">{t("actions")}</TableHead></TableRow></TableHeader><TableBody>{profiles.map((profile) => (<TableRow key={profile.id}><TableCell className="font-medium">{profile.full_name}</TableCell><TableCell className="text-sm text-gray-400">{profile.email}</TableCell><TableCell><Badge className={profile.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}>{profile.role}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => openUserModal(profile)} className="hover:bg-blue-500/20"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteUser(profile.id)} className="hover:bg-red-500/20"><Trash2 className="h-4 w-4 text-red-500" /></Button></div></TableCell></TableRow>))}</TableBody></Table>
                )}
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader><CardTitle>{language === "sv" ? "Arbetsgrupper" : "Work Groups"}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isLoadingWorkGroups ? (
                  <div className="text-center py-8"><p className="text-gray-400">{language === "sv" ? "Laddar arbetsgrupper..." : "Loading work groups..."}</p></div>
                ) : workGroups.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">{language === "sv" ? "Inga arbetsgrupper hittades." : "No work groups found."}</p>
                ) : (
                  workGroups.map(group => <WorkGroupCollapsible key={group.id} group={group} t={t} language={language} />)
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="premium-card">
              <CardHeader><CardTitle>{language === "sv" ? "Exportera rapporter" : "Export Reports"}</CardTitle></CardHeader>
              <CardContent className="flex flex-col space-y-2"><Button onClick={() => handleExport("pdf")} className="bg-blue-600 hover:bg-blue-700"><Download className="mr-2 h-4 w-4" />{language === "sv" ? "Exportera som PDF" : "Export as PDF"}</Button><Button onClick={() => handleExport("excel")} className="bg-green-600 hover:bg-green-700"><Download className="mr-2 h-4 w-4" />{language === "sv" ? "Exportera som Excel" : "Export as Excel"}</Button></CardContent>
            </Card>
            <Card className="premium-card">
              <CardHeader><CardTitle>{language === "sv" ? "Brodata" : "Bridge Data"}</CardTitle></CardHeader>
              <CardContent className="space-y-4"><div><label className="block text-sm font-medium text-gray-300 mb-2">{language === "sv" ? "Importera från KML" : "Import from KML"}</label><input type="file" accept=".kml" onChange={handleKMLUpload} disabled={isImportingKML} className="hidden" id="kml-upload"/><Button onClick={() => document.getElementById('kml-upload')?.click()} disabled={isImportingKML} className="w-full premium-button"><Upload size={18} className="mr-2" />{isImportingKML ? (language === "sv" ? "Importerar..." : "Importing...") : (language === "sv" ? "Ladda upp KML" : "Upload KML")}</Button></div><Button onClick={handleClearBridges} variant="outline" className="w-full frosted-glass border-red-500/50 text-red-400 hover:bg-red-500/10"><AlertTriangle size={18} className="mr-2" />{language === "sv" ? "Radera alla broar" : "Delete all bridges"}</Button></CardContent>
            </Card>
          </div>
        </div>
        
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader><DialogTitle>{language === "sv" ? "Redigera användare" : "Edit User"}</DialogTitle></DialogHeader>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-2">{t("name")}</label><Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="bg-gray-700" disabled/></div><div><label className="block text-sm font-medium mb-2">{t("role")}</label><Select value={editRole} onValueChange={(v) => setEditRole(v as "admin" | "employee")}><SelectTrigger className="bg-gray-700"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="employee">{t("employee")}</SelectItem><SelectItem value="admin">{t("admin")}</SelectItem></SelectContent></Select></div><Button onClick={handleUpdateUser} disabled={isLoading} className="w-full premium-button">{isLoading ? (language === "sv" ? "Sparar..." : "Saving...") : t("save")}</Button></div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

const WorkGroupCollapsible = ({ group, t, language }: { group: WorkGroupWithMembers, t: (key: string) => string, language: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible.Root className="w-full" open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-gray-700 rounded-lg">
        <Collapsible.Trigger asChild>
          <button className="flex justify-between items-center w-full p-4 hover:bg-gray-700/50 rounded-t-lg transition-colors">
            <div className="text-left">
              <p className="font-semibold text-white">{group.name}</p>
              <p className="text-xs text-gray-400">
                {language === "sv" ? "Skapad av" : "Created by"} {group.creator?.full_name || (language === "sv" ? "Okänd" : "Unknown")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={16} />
              <span>{Array.isArray(group.members) ? group.members.length : 0}</span>
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="border-t border-gray-700 p-4">
            <h4 className="font-semibold mb-2 text-gray-300">
              {language === "sv" ? "Medlemmar" : "Members"}
            </h4>
            <ul className="space-y-2">
              {Array.isArray(group.members) && group.members.map(member => (
                <li key={member.user_id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-white">{member.profile?.full_name || (language === "sv" ? "Okänd användare" : "Unknown user")}</p>
                    <p className="text-xs text-gray-500">{member.profile?.email || ""}</p>
                  </div>
                  <Badge className={member.profile?.role === 'admin' ? 'bg-purple-500/80' : 'bg-blue-500/80'}>
                    {member.profile?.role || "employee"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
};

export default AdminPage;
