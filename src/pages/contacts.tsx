import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowLeft, Phone, MessageSquare, Mail, Building2, Users, User, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useTranslation } from "@/lib/translations";
import { WorkGroupInvite } from "@/components/WorkGroupInvite";
import { storage } from "@/lib/storage";
import { contactService, Contact } from "@/services/contactService";
import { createWorkGroup } from "@/lib/workGroup";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, WorkGroupWithMembers } from "@/types";
import { authService } from "@/services/authService";

export default function ContactsPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeWorkGroup, setActiveWorkGroup] = useState<WorkGroupWithMembers | null>(null);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // FIXED: Ultra-fast auth check - localStorage only, skip Supabase entirely if user exists
  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      console.log("🔐 [Contacts] Checking authentication state...");
      
      // CRITICAL: Check localStorage FIRST and ONLY (instant access)
      const localUser = storage.getUser();
      if (localUser && localUser.id && localUser.email) {
        console.log("✅ [Contacts] Valid user in localStorage - SKIPPING Supabase check:", localUser.id);
        setCurrentUser(localUser);
        setIsCheckingAuth(false);
        return; // Exit - NO Supabase check needed
      }
      
      console.log("⚠️ [Contacts] No valid localStorage user - checking Supabase session...");
      setIsCheckingAuth(true);
      
      // Extended timeout for Supabase check (only runs if no localStorage)
      const timeoutId = setTimeout(() => {
        console.warn("⏰ [Contacts] Auth check timeout (15s)");
        setIsCheckingAuth(false);
      }, 15000);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ [Contacts] Supabase session error:", error);
          clearTimeout(timeoutId);
          setIsCheckingAuth(false);
          return;
        }
        
        if (session?.user) {
          console.log("✅ [Contacts] Found Supabase session:", session.user.id);
          
          let profile = await authService.getProfile(session.user.id);

          if (!profile) {
            console.warn("⚠️ [Contacts] Profile not found, creating...");
            profile = await authService.upsertProfile(
              session.user.id,
              session.user.email || "",
              session.user.user_metadata?.full_name as string | undefined,
              session.user.user_metadata
            );
          }
          
          if (profile) {
            console.log("✅ [Contacts] Profile loaded/created:", profile.id);
            storage.saveUser(profile as Profile);
            setCurrentUser(profile as Profile);
          } else {
            console.error("❌ [Contacts] Failed to load or create profile, logging out.");
            await authService.signOut();
            storage.clearUser();
          }

        } else {
            console.log("ℹ️ [Contacts] No active session found.");
        }
      } catch (error) {
        console.error("💥 [Contacts] Auth error:", error);
      } finally {
        clearTimeout(timeoutId);
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
    
    return () => setMounted(false);
  }, []);

  // Load data only when we have a user
  useEffect(() => {
    if (!mounted || !currentUser || isCheckingAuth) return;

    console.log("📊 Initializing contacts page data...");
    
    Promise.all([
      loadContactsData(),
      loadWorkGroupData(currentUser.id)
    ]).catch(err => {
      console.error("Failed to load data:", err);
    });
  }, [mounted, currentUser, isCheckingAuth]);

  const loadContactsData = useCallback(async () => {
    if (!mounted) return;
    
    setIsLoadingContacts(true);
    console.log("📋 Loading contacts from Supabase...");
    
    try {
      const { contacts: loadedContacts, error } = await contactService.getAllContacts();
      
      if (error) {
        console.error("❌ Error loading contacts:", error);
        if (mounted) {
          toast({
            title: t("error"),
            description: language === "sv" ? "Kunde inte ladda kontakter" : "Could not load contacts",
            variant: "destructive"
          });
          setContacts([]);
        }
      } else {
        console.log(`✅ Loaded ${loadedContacts.length} contacts`);
        if (mounted) {
          setContacts(loadedContacts);
        }
      }
    } catch (error) {
      console.error("💥 Unexpected error loading contacts:", error);
      if (mounted) {
        setContacts([]);
      }
    } finally {
      if (mounted) {
        setIsLoadingContacts(false);
      }
    }
  }, [mounted, toast, t, language]);

  const loadWorkGroupData = useCallback(async (userId: string) => {
    if (!mounted) return;
    
    setIsLoadingGroup(true);
    console.log("👥 Loading work group for user:", userId);
    
    try {
      const { data, error } = await supabase
        .from("work_group_members")
        .select(`
          work_groups!inner (
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
          )
        `)
        .eq("user_id", userId)
        .limit(1)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          console.log("ℹ️ No active work group found for user");
        } else {
          console.error("❌ Error loading work group:", error);
        }
        if (mounted) {
          setActiveWorkGroup(null);
        }
      } else if (data?.work_groups) {
        console.log("✅ Loaded work group:", data.work_groups);
        if (mounted) {
          setActiveWorkGroup(data.work_groups as unknown as WorkGroupWithMembers);
        }
      } else {
        console.log("ℹ️ No work group data returned");
        if (mounted) {
          setActiveWorkGroup(null);
        }
      }
    } catch (error) {
      console.error("💥 Unexpected error loading work group:", error);
      if (mounted) {
        setActiveWorkGroup(null);
      }
    } finally {
      if (mounted) {
        setIsLoadingGroup(false);
      }
    }
  }, [mounted]);

  const handleCreateWorkGroup = async () => {
    if (!currentUser) {
      console.error("❌ Cannot create work group: No current user");
      toast({
        title: t("error"),
        description: language === "sv" ? "Ingen användare inloggad" : "No user logged in",
        variant: "destructive"
      });
      return;
    }

    if (isCreatingGroup) {
      console.log("⏳ Already creating work group, ignoring duplicate request");
      return;
    }

    setIsCreatingGroup(true);
    console.log("🔨 Creating work group for user:", currentUser.id);

    try {
      const groupName = `${currentUser.full_name}${language === "sv" ? "s Arbetsgrupp" : "'s Work Group"}`;
      const { group, error } = await createWorkGroup(currentUser, groupName);

      if (error) {
        console.error("❌ Error creating work group:", error);
        throw error;
      }
      
      if (!group) {
        throw new Error("Work group was not created");
      }

      console.log("✅ Work group created successfully:", group);
      
      await loadWorkGroupData(currentUser.id);
      
      toast({
        title: language === "sv" ? "Grupp skapad!" : "Group created!",
        description: language === "sv" ? "Bjud in deltagare via länk eller QR-kod" : "Invite participants via link or QR code",
      });
    } catch (error) {
      console.error("💥 Failed to create work group:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: t("error"),
        description: language === "sv" ? `Kunde inte skapa arbetsgrupp: ${errorMsg}` : `Could not create work group: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const makeCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const sendEmail = (email?: string) => {
    if (email) window.location.href = `mailto:${email}`;
  };

  const handleChatRedirect = (contactId: string) => {
    router.push(`/chat?chatId=${contactId}&isGroup=false`);
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

  const getContactColor = (role: string) => {
    if (role === "admin") return "hsl(270, 70%, 60%)";
    return "hsl(24, 95%, 53%)";
  };

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div className="premium-card card-hover-lift">
      <div className="flex items-center gap-4 mb-4">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center" 
          style={{ 
            background: `linear-gradient(135deg, ${getContactColor(contact.role || "employee")} 0%, ${getContactColor(contact.role || "employee")}dd 100%)` 
          }}
        >
          <User size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{contact.full_name}</h3>
          <p className="text-sm text-gray-400">
            {contact.role === "admin" ? t("admin") : t("employee")}
          </p>
        </div>
      </div>
      
      {contact.company && (
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={16} style={{ color: getContactColor(contact.role || "employee") }} />
          <span className="text-sm text-white">{contact.company}</span>
        </div>
      )}
      
      {contact.phone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone size={16} style={{ color: getContactColor(contact.role || "employee") }} />
          <span className="text-sm text-white">{contact.phone}</span>
        </div>
      )}
      
      {contact.email && (
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} style={{ color: getContactColor(contact.role || "employee") }} />
          <span className="text-sm text-white">{contact.email}</span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-2 mt-4">
        {contact.phone && (
          <Button 
            onClick={() => makeCall(contact.phone!)} 
            className="premium-button text-xs px-2"
          >
            <Phone size={16} className="mr-1" />
            {t("call")}
          </Button>
        )}
        
        {contact.email && (
          <>
            <Button 
              onClick={() => sendEmail(contact.email)} 
              variant="outline" 
              className="text-xs px-2"
            >
              <Mail size={16} className="mr-1" />
              {t("message")}
            </Button>
            <Button 
              onClick={() => handleChatRedirect(contact.id)} 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-xs px-2"
            >
              <MessageSquare size={16} className="mr-1" />
              {t("chat")}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const admins = contacts.filter(c => c.role === "admin");
  const employees = contacts.filter(c => c.role === "employee" || !c.role);

  const emergencyContacts = [
    { id: "emergency-112", full_name: "SOS Alarm", role: "Nödsituation", phone: "112", email: null, company: "Nödnummer", status: "active" as const },
    { id: "emergency-trafikverket", full_name: "Trafikverket", role: "Myndighet", phone: "0771-921921", email: null, company: "Trafikverket", status: "active" as const }
  ];

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
              ? "Du måste vara inloggad för att se kontakter" 
              : "You must be logged in to view contacts"}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleRetryAuth} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {language === "sv" ? "Försök igen" : "Try Again"}
            </Button>
            <Button onClick={() => router.push('/')} className="w-full premium-button">
              {language === "sv" ? "Gå till inloggning" : "Go to Login"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button onClick={handleBack} variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <Logo />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="min-h-screen gradient-bg p-4 pt-24 pb-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-6">{t("contactsTitle")}</h1>
          
          <div className="mb-6 premium-card bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border-l-4 border-green-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <Image src="/60F1A044-97CA-4F0C-AC2E-5D8EFF8223BE.png" alt="LexChat" width={96} height={24} className="h-6 w-auto" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                <Lock size={12} className="inline-block mr-1 text-green-400" />
                {language === "sv" 
                  ? "Alla meddelanden och samtal i LexChat är fullständigt krypterade. Endast du och mottagaren kan läsa eller lyssna på dem." 
                  : "All messages and calls in LexChat are fully encrypted. Only you and the recipient can read or listen to them."}
              </p>
            </div>
          </div>
          
          {isLoadingGroup ? (
             <div className="text-center py-8"><p className="text-gray-400">{t("loading")}...</p></div>
          ) : !activeWorkGroup ? (
            <div className="mb-6">
              <Button 
                onClick={handleCreateWorkGroup} 
                disabled={isCreatingGroup}
                className="w-full premium-button py-6 text-base"
              >
                {isCreatingGroup ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {language === "sv" ? "Skapar arbetsgrupp..." : "Creating work group..."}
                  </>
                ) : (
                  <>
                    <Users className="mr-2" /> 
                    {t("workGroups")}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="mb-6">
              <WorkGroupInvite 
                inviteCode={activeWorkGroup.invite_code}
                hostName={currentUser?.full_name || ""}
                groupName={activeWorkGroup.name}
              />
            </div>
          )}

          {isLoadingContacts ? (
            <div className="text-center py-8">
              <p className="text-gray-400">{language === "sv" ? "Laddar kontakter..." : "Loading contacts..."}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {admins.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 px-2 text-purple-400">{t("admins")}</h2>
                  <div className="space-y-4">
                    {admins.map((contact) => (<ContactCard key={contact.id} contact={contact} />))}
                  </div>
                </div>
              )}

              {employees.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 px-2 text-[hsl(24,95%,53%)]">{t("staff")}</h2>
                  <div className="space-y-4">
                    {employees.map((contact) => (<ContactCard key={contact.id} contact={contact} />))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold mb-4 px-2 text-red-400">⚠️ {t("emergency")}</h2>
                <div className="space-y-4">
                  {emergencyContacts.map((contact) => (<ContactCard key={contact.id} contact={contact as any} />))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
