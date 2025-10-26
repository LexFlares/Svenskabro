import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Wrench,
  Users,
  FileText,
  BrainCircuit,
  ShieldCheck,
  User,
  Cloud,
  CloudOff,
  RefreshCw,
  TrafficCone
} from "lucide-react";
import { authService, type AuthUser } from "@/services/authService";
import type { Profile } from "@/types";
import { useTranslation } from "@/lib/translations";
import { jobService } from "@/services/jobService";
import { offlineSync } from "@/lib/offlineSync"; // Corrected import
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyJobsCount, setDailyJobsCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'unsynced'>('synced');
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await authService.getProfile(currentUser.id);
        setProfile(userProfile);
        
        // Fetch user-specific data
        const jobs = await jobService.getJobsForUser(currentUser.id);
        const today = new Date().toISOString().split('T')[0];
        const todayJobs = jobs.filter(job => job.start_tid?.startsWith(today));
        setDailyJobsCount(todayJobs.length);
        if(jobs.length > 0){
          setLastActivity(new Date(jobs[0].created_at));
        }
      }
    };
    checkUser();

    // Check network status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Check initial sync status
    updateSyncStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);
  
  const updateSyncStatus = async () => {
    const count = await offlineSync.getUnsyncedCount();
    setUnsyncedCount(count);
    setSyncStatus(count > 0 ? 'unsynced' : 'synced');
  };

  const handleSync = async () => {
    if (!isOnline) {
      toast({ title: "Offline", description: "Kan inte synka, du är offline.", variant: "destructive" });
      return;
    }
    setSyncStatus('syncing');
    try {
      const { syncedJobs, syncedDeviations } = await offlineSync.syncOfflineData();
      await updateSyncStatus();
      toast({ title: "Synkronisering slutförd", description: `${syncedJobs} jobb och ${syncedDeviations} avvikelser synkade.` });
    } catch (error) {
      setSyncStatus('unsynced');
      toast({ title: "Synkronisering misslyckades", description: (error as Error).message, variant: "destructive" });
    }
  };


  const handleSendReport = () => {
    const emailBody = `
      ${t('greeting')},
      
      ${t('attachedReport')}
      ${t('numberOfJobs')}: ${dailyJobsCount}.
      
      ${t('bestRegards')},
      ${profile?.full_name || 'Användare'}
    `;
    window.location.href = `mailto:?subject=${t('dailyReport')}&body=${encodeURIComponent(emailBody)}`;
  };

  const menuItems = [
    { href: "/bridges", icon: Building, label: t('bridgeRegister') },
    { href: "/new-job", icon: Wrench, label: t('startNewJob') },
    { href: "/traffic-alerts", icon: TrafficCone, label: t('traffic_alerts') },
    { href: "/contacts", icon: Users, label: t('contactsTitle') },
    { href: "/documents", icon: FileText, label: t('kmaDocuments') },
    { href: "/ai-assistant", icon: BrainCircuit, label: t('ai_assistant') },
  ];
  
  const adminMenuItems = [
    { href: "/admin", icon: ShieldCheck, label: t('adminPanel') },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t('welcomeBack')}, {profile?.full_name?.split(' ')[0] || user?.email}
          </h1>
          <p className="text-gray-400 text-sm">
            {isOnline ? "Online" : "Offline"} | {new Date().toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <User className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sync Status Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {syncStatus === 'syncing' ? <RefreshCw className="animate-spin" /> : unsyncedCount > 0 ? <CloudOff className="text-yellow-400"/> : <Cloud className="text-green-400" />}
                {t('sync_status')}
              </div>
              <Badge variant={unsyncedCount > 0 ? 'destructive' : 'default'}>
                {unsyncedCount} {t('unsynced_changes')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              {unsyncedCount > 0 
                ? "Du har ändringar som inte är sparade på servern. Klicka på 'Synka nu' för att ladda upp."
                : "All din data är synkroniserad med servern."
              }
            </p>
            <Button onClick={handleSync} disabled={syncStatus === 'syncing' || unsyncedCount === 0} className="w-full">
              {syncStatus === 'syncing' ? t('syncing') : t('sync_now')}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>{t('dashboard')}</CardTitle>
            <CardDescription>{t('lastActivity')}: {lastActivity ? lastActivity.toLocaleDateString() : t('never')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Card className="bg-gray-700 hover:bg-gray-600 transition-colors text-center p-4 flex flex-col items-center justify-center h-full">
                    <item.icon className="h-8 w-8 mb-2 text-orange-400" />
                    <p className="font-semibold text-sm">{item.label}</p>
                  </Card>
                </Link>
              ))}
              {profile?.role === 'admin' && adminMenuItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Card className="bg-gray-700 hover:bg-gray-600 transition-colors text-center p-4 flex flex-col items-center justify-center h-full">
                    <item.icon className="h-8 w-8 mb-2 text-red-500" />
                    <p className="font-semibold text-sm">{item.label}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>{t('dailyReport')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">{t('jobs')} idag</p>
              <p className="text-2xl font-bold">{dailyJobsCount}</p>
            </div>
            <Button onClick={handleSendReport} className="w-full">{t('send_report')}</Button>
          </CardContent>
        </Card>

        <Alert className="md:col-span-3 bg-red-900/50 border-red-500/50 text-red-200">
          <ShieldCheck className="h-4 w-4 !text-red-400" />
          <AlertTitle>{t('safetyFirst')}</AlertTitle>
          <AlertDescription>
            {t('safetyMessage')}
          </AlertDescription>
        </Alert>

      </main>
    </div>
  );
}
