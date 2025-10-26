import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/translations";
import { storage } from "@/lib/storage";
import { WorkGroup, getWorkGroupByInviteCode, joinWorkGroup } from "@/lib/workGroup";
import type { User, Profile } from "@/types";
import { Logo } from "@/components/Logo";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { authService } from "@/services/authService";

interface EnrichedWorkGroup extends WorkGroup {
  profiles: {
    full_name: string;
  };
}

export default function JoinWorkGroupPage() {
  const router = useRouter();
  const { code } = router.query;
  const { t, language } = useTranslation();

  const [group, setGroup] = useState<EnrichedWorkGroup | null>(null);
  const [currentUser, setCurrentUser] = useState<User | Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    const user = storage.getUser();
    setCurrentUser(user);

    if (!code) {
      setIsLoading(false);
      setError(language === 'sv' ? "Ingen inbjudningskod angiven." : "No invite code provided.");
      return;
    }

    const fetchGroup = async () => {
      setIsLoading(true);
      const { group: fetchedGroup, error: fetchError } = await getWorkGroupByInviteCode(code as string);

      if (fetchError) {
        setError(language === 'sv' ? "Ogiltig eller utgången inbjudan." : "Invalid or expired invitation.");
      } else {
        setGroup(fetchedGroup as EnrichedWorkGroup);
      }
      setIsLoading(false);
    };

    fetchGroup();
  }, [code, language]);

  const handleJoinGroup = async () => {
    if (!group || !currentUser) return;

    setIsJoining(true);
    const { success, error: joinError } = await joinWorkGroup(group.id, currentUser as User);
    
    if (joinError) {
      setError(language === 'sv' ? "Kunde inte gå med i gruppen." : "Could not join the group.");
      setJoinStatus("error");
    } else {
      setJoinStatus("success");
      // Optional: Update local user state or refetch if needed
      setTimeout(() => {
        router.push("/contacts");
      }, 2000);
    }
    setIsJoining(false);
  };
  
  const handleLoginRedirect = () => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    router.push('/');
  };

  const hostName = group?.profiles?.full_name || (language === 'sv' ? 'Värden' : 'The host');
  const groupName = group?.name || (language === 'sv' ? 'gruppen' : 'the group');


  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
          <Button onClick={() => router.back()} variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('back')}
          </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Logo />
        </div>

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>{t('joinWorkGroup')}</CardTitle>
            <CardDescription>
              {group ? 
                `${hostName} ${language === 'sv' ? 'har bjudit in dig till' : 'has invited you to'} ${groupName}` :
                t('loadingInvite')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p>{t('loading')}...</p>}

            {error && !joinStatus && (
              <div className="text-center text-red-400 p-4 rounded-lg bg-red-500/10">
                <p>{error}</p>
              </div>
            )}
            
            {joinStatus === "success" && (
                <div className="text-center space-y-3 p-4">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="font-semibold text-lg">{t('welcomeToTheGroup')}</p>
                    <p className="text-sm text-gray-400">
                      {language === 'sv' ? 'Du omdirigeras...' : 'Redirecting...'}
                    </p>
                </div>
            )}

            {joinStatus === "error" && (
                <div className="text-center space-y-3 p-4">
                    <XCircle className="mx-auto h-12 w-12 text-red-500" />
                    <p className="font-semibold text-lg">{t('error')}</p>
                    <p className="text-sm text-gray-400">{error}</p>
                </div>
            )}

            {!currentUser && !isLoading && !error && (
              <div className="text-center space-y-4">
                <p>{t('mustBeLoggedIn')}</p>
                <Button onClick={handleLoginRedirect} className="w-full premium-button">
                  {t('login')}
                </Button>
              </div>
            )}

            {currentUser && group && !joinStatus && (
              <div className="space-y-4">
                <p className="text-center">
                  {language === 'sv' ? 'Du är inloggad som' : 'You are logged in as'} <span className="font-bold">{currentUser.full_name || currentUser.email}</span>.
                </p>
                <Button onClick={handleJoinGroup} disabled={isJoining} className="w-full premium-button">
                  {isJoining ? t('joining') : t('joinGroup')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       <footer className="absolute bottom-4 text-center text-xs text-gray-500 w-full">
            LexHub - {t('developedBy')} LexFlares {t('for')} Svenska Bro Aktiebolag
        </footer>
    </div>
  );
}
