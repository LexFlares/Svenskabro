import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Bell, BellOff, Wifi, WifiOff, MapPin, Filter, RefreshCw, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/translations";
import {
  getNotificationSettings,
  saveNotificationSettings,
  startTrafficPolling,
  stopTrafficPolling,
  getStreamingStatus,
  filterTrafficSituations,
  fetchAllTrafficSituations,
  testTrafikverketConnection,
  type TrafficNotificationSettings
} from "@/services/trafikverketService";
import type { TrafikverketSituation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { pushNotifications } from "@/lib/pushNotifications";
import dynamic from "next/dynamic";
import { trafficStreamClient } from "@/lib/trafficStreamClient";
import { authService } from "@/services/authService";
import { notificationManager } from "@/lib/notificationManager";

const TrafficMap = dynamic(() => import("@/components/TrafficMapFixed"), { ssr: false });

export default function TrafficAlertsHybridPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<TrafficNotificationSettings>(getNotificationSettings());
  const [mounted, setMounted] = useState(false);
  const [pushStatus, setPushStatus] = useState<"supported" | "unsupported" | "enabled" | "disabled">("disabled");
  const [streamingStatus, setStreamingStatus] = useState({ 
    isConnected: false, 
    connectionState: "DISCONNECTED",
    isUsingFallback: false,
    connectionError: null as string | null
  });
  const [allSituations, setAllSituations] = useState<TrafikverketSituation[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseError, setSseError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Get authenticated user ID
    const initAuth = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        console.log("✅ Current user ID:", user.id);
      } else {
        console.warn("⚠️ No authenticated user found");
      }
    };
    
    initAuth();
    
    if (pushNotifications.isSupported()) {
      const permission = pushNotifications.getPermissionStatus();
      if (permission === "granted") {
        setPushStatus("enabled");
      } else if (permission === "denied") {
        setPushStatus("disabled");
      } else {
        setPushStatus("supported");
      }
    } else {
      setPushStatus("unsupported");
    }

    // Always load situations for the map on mount
    loadInitialMapData();
  }, []);

  const loadInitialMapData = async () => {
    try {
      setIsLoadingMap(true);
      console.log("🗺️ Loading initial map data...");
      console.log("🔍 Current page URL:", window.location.href);
      
      const situations = await fetchAllTrafficSituations();
      
      console.log(`✅ Loaded ${situations.length} situations for map display`);
      
      if (situations.length === 0) {
        console.warn("⚠️ WARNING: No situations returned from API!");
        toast({
          title: language === "sv" ? "⚠️ Inga händelser hittades" : "⚠️ No events found",
          description: language === "sv" ? "Trafikverket API returnerade inga data. Kontrollera API-nyckeln." : "Trafikverket API returned no data. Check API key.",
          variant: "destructive",
          duration: 8000
        });
      } else {
        // Log sample data
        console.log("📊 First situation sample:", JSON.stringify(situations[0], null, 2));
        
        // Verify situations have required geometry
        const withGeometry = situations.filter(s => s.Deviation?.[0]?.Geometry?.WGS84);
        console.log(`📍 Situations with valid geometry: ${withGeometry.length}/${situations.length}`);
        
        if (withGeometry.length === 0) {
          console.error("❌ CRITICAL: No situations have valid WGS84 geometry!");
          toast({
            title: language === "sv" ? "❌ Kartfel" : "❌ Map Error",
            description: language === "sv" ? "Inga platser att visa på kartan" : "No locations to display on map",
            variant: "destructive"
          });
        }
      }
      
      setAllSituations(situations);
    } catch (error) {
      console.error("💥 Failed to load initial map data:", error);
      console.error("📋 Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      
      toast({
        title: language === "sv" ? "❌ Kunde inte ladda kartdata" : "❌ Failed to load map data",
        description: (error as Error).message || "Unknown error",
        variant: "destructive",
        duration: 10000
      });
    } finally {
      setIsLoadingMap(false);
    }
  };

  useEffect(() => {
    if (settings.enabled) {
      startPolling();
    } else {
      stopTrafficPolling();
    }

    return () => {
      stopTrafficPolling();
    };
  }, [settings]);

  useEffect(() => {
    if (!settings.enabled) return;

    const interval = setInterval(() => {
      const status = getStreamingStatus();
      setStreamingStatus(status);
      
      if (!status.isConnected && !status.isUsingFallback) {
        setConnectionAttempts(prev => prev + 1);
      } else {
        setConnectionAttempts(0);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [settings.enabled]);

  useEffect(() => {
    if (settings.enabled && currentUserId) {
      // Start SSE stream for real-time notifications
      startSSEStream();
    } else {
      // Stop SSE stream when disabled or no user
      trafficStreamClient.stop();
      setSseConnected(false);
      setSseError(null);
    }

    return () => {
      trafficStreamClient.stop();
    };
  }, [settings.enabled, currentUserId]);

  const startPolling = () => {
    startTrafficPolling(
      settings,
      handleNewSituation,
      handleAllSituations
    );
  };

  const startSSEStream = () => {
    if (!currentUserId) {
      console.error("❌ Cannot start SSE stream: No user ID");
      setSseError("No authenticated user");
      toast({
        title: language === "sv" ? "❌ Autentiseringsfel" : "❌ Authentication error",
        description: language === "sv" 
          ? "Du måste vara inloggad för att använda realtidsnotiser" 
          : "You must be logged in to use real-time notifications",
        variant: "destructive"
      });
      return;
    }
    
    console.log("🚀 Starting SSE stream for user:", currentUserId);
    
    trafficStreamClient.start({
      userId: currentUserId,
      onConnect: () => {
        console.log("✅ SSE connected successfully");
        setSseConnected(true);
        setSseError(null);
        toast({
          title: language === "sv" ? "🚀 Realtidsstreaming aktiv" : "🚀 Real-time streaming active",
          description: language === "sv" 
            ? "Ansluten till Trafikverket - får notiser direkt" 
            : "Connected to Trafikverket - receiving notifications instantly"
        });
      },
      onDisconnect: () => {
        console.log("🔌 SSE disconnected");
        setSseConnected(false);
      },
      onError: (error) => {
        console.error("❌ SSE error:", error.message);
        setSseError(error.message);
        setSseConnected(false);
      },
      onNewSituation: (situation) => {
        console.log("🚨 NEW SITUATION via SSE:", situation);
        handleNewSituation(situation);
      }
    });
  };

  const handleAllSituations = (situations: TrafikverketSituation[]) => {
    // Update map with all situations (no notifications)
    setAllSituations(prev => {
      const existingIds = new Set(prev.map(s => {
        const deviation = s.Deviation[0];
        return deviation.Id || deviation.CreationTime;
      }));

      const newSituations = situations.filter(s => {
        const deviation = s.Deviation[0];
        const id = deviation.Id || deviation.CreationTime;
        return !existingIds.has(id);
      });

      if (newSituations.length > 0) {
        console.log(`🗺️ Adding ${newSituations.length} situations to map`);
        return [...newSituations, ...prev];
      }

      return prev;
    });
  };

  const handleNewSituation = (situation: TrafikverketSituation) => {
    // This is called ONLY for new situations that should trigger notifications
    setAllSituations(prev => {
      const situationId = situation.Deviation[0]?.Id || situation.Deviation[0]?.CreationTime;
      const exists = prev.some(s => {
        const existingId = s.Deviation[0]?.Id || s.Deviation[0]?.CreationTime;
        return existingId === situationId;
      });
      
      if (exists) return prev;
      return [situation, ...prev];
    });

    setLastUpdateTime(new Date());
    setNotificationCount(prev => prev + 1);
    const deviation = situation.Deviation[0];
    
    // Use NotificationManager for enhanced notifications
    notificationManager.show({
      Id: deviation.Id || deviation.CreationTime,
      Header: deviation.Header,
      Message: deviation.Message,
      IconId: deviation.IconId,
      Severity: deviation.Severity,
      CreationTime: deviation.CreationTime
    });

    if (settings.soundEnabled) {
      notificationManager.playNotificationSound();
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (enabled) {
      const isSupported = pushNotifications.isSupported();
      
      if (!isSupported) {
        toast({
          title: language === "sv" ? "Push-notiser stöds ej" : "Push notifications not supported",
          description: language === "sv" ? "Din webbläsare stöder inte push-notiser" : "Your browser doesn't support push notifications",
          variant: "destructive"
        });
        return;
      }

      const permission = pushNotifications.getPermissionStatus();
      
      if (permission === "default") {
        const initialized = await pushNotifications.initialize();
        if (!initialized) {
          toast({
            title: language === "sv" ? "Notifikationer nekade" : "Notifications denied",
            description: language === "sv" ? "Aktivera notifikationer i webbläsarens inställningar" : "Enable notifications in browser settings",
            variant: "destructive"
          });
          return;
        }
        setPushStatus("enabled");
      } else if (permission === "denied") {
        toast({
          title: language === "sv" ? "Notifikationer blockerade" : "Notifications blocked",
          description: language === "sv" ? "Aktivera notifikationer i webbläsarens inställningar" : "Enable notifications in browser settings",
          variant: "destructive"
        });
        return;
      }

      await pushNotifications.getSubscription();
      setNotificationCount(0); // Reset notification counter
    }

    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);

    // Start or stop streaming based on enabled state
    if (enabled && currentUserId) {
      startSSEStream();
      startPolling();
    } else {
      trafficStreamClient.stop();
      stopTrafficPolling();
      setSseConnected(false);
      setSseError(null);
    }

    toast({
      title: enabled 
        ? (language === "sv" ? "🔔 Notiser aktiverade" : "🔔 Notifications enabled")
        : (language === "sv" ? "🔕 Notiser avaktiverade" : "🔕 Notifications disabled"),
      description: enabled
        ? (language === "sv" ? "Du får notiser för NYA händelser från och med nu" : "You will receive notifications for NEW events from now on")
        : (language === "sv" ? "Inga fler notifikationer" : "No more notifications")
    });
  };

  const handleToggleSound = (soundEnabled: boolean) => {
    const newSettings = { ...settings, soundEnabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleToggleEventType = (eventType: string) => {
    const newEventTypes = settings.eventTypes.includes(eventType)
      ? settings.eventTypes.filter(e => e !== eventType)
      : [...settings.eventTypes, eventType];
    
    const newSettings = { ...settings, eventTypes: newEventTypes };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const handleRefresh = async () => {
    setNotificationCount(0);
    setLastUpdateTime(null);
    setConnectionAttempts(0);
    
    // Reload map data
    await loadInitialMapData();
    
    stopTrafficPolling();
    if (settings.enabled) {
      setTimeout(() => {
        startPolling();
        toast({
          title: language === "sv" ? "Återansluter..." : "Reconnecting...",
          description: language === "sv" ? "Försöker ansluta till Trafikverket" : "Attempting to connect to Trafikverket"
        });
      }, 500);
    } else {
      toast({
        title: language === "sv" ? "✅ Uppdaterat" : "✅ Refreshed",
        description: language === "sv" ? `Visar ${allSituations.length} händelser` : `Showing ${allSituations.length} events`
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    toast({
      title: language === "sv" ? "Testar anslutning..." : "Testing connection...",
      description: language === "sv" ? "Kontrollerar Trafikverket API" : "Checking Trafikverket API"
    });

    try {
      const result = await testTrafikverketConnection();
      
      if (result.success) {
        toast({
          title: language === "sv" ? "✅ Anslutning OK!" : "✅ Connection OK!",
          description: result.message,
          duration: 5000
        });
      } else {
        toast({
          title: language === "sv" ? "❌ Anslutningsproblem" : "❌ Connection Problem",
          description: result.message,
          variant: "destructive",
          duration: 8000
        });
      }
    } catch (error) {
      toast({
        title: language === "sv" ? "❌ Test misslyckades" : "❌ Test Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const filteredSituations = filterTrafficSituations(allSituations, settings);

  const getConnectionStatusColor = () => {
    if (streamingStatus.isUsingFallback) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (!streamingStatus.isConnected) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (connectionAttempts > 0) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-green-500/10 text-green-400 border-green-500/20";
  };

  const getConnectionStatusText = () => {
    if (streamingStatus.isUsingFallback) {
      return language === "sv" ? "REST API-läge" : "REST API mode";
    }
    if (!streamingStatus.isConnected) {
      if (connectionAttempts > 5) {
        return language === "sv" ? "Anslutningsproblem" : "Connection issues";
      }
      return language === "sv" ? "Ansluter..." : "Connecting...";
    }
    return language === "sv" ? "WebSocket Ansluten" : "WebSocket Connected";
  };

  const getConnectionDescription = () => {
    if (streamingStatus.isUsingFallback) {
      return language === "sv" 
        ? "WebSocket misslyckades, använder REST API-polling var 30:e sekund" 
        : "WebSocket failed, using REST API polling every 30 seconds";
    }
    if (streamingStatus.isConnected) {
      return language === "sv" 
        ? "Ansluten via WebSocket - omedelbar notis" 
        : "Connected via WebSocket - immediate notifications";
    }
    return language === "sv" 
      ? "Försöker ansluta till Trafikverket..." 
      : "Attempting to connect to Trafikverket...";
  };

  if (!mounted) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-white">
            {language === "sv" ? "Trafikläget" : "Traffic Situation"}
          </h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
              <RefreshCw size={20} className="text-white" />
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="min-h-screen gradient-bg pt-20">
        <div className="max-w-7xl mx-auto p-4">
          {pushStatus === "enabled" && settings.enabled && (
            <div className={`mb-4 premium-card border-l-4 ${
              sseConnected 
                ? "bg-gradient-to-r from-green-900/20 to-green-800/20 border-green-500" 
                : sseError
                ? "bg-gradient-to-r from-red-900/20 to-red-800/20 border-red-500"
                : "bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-500"
            }`}>
              <div className="flex items-center gap-3 p-4">
                {sseConnected ? (
                  <Wifi size={24} className="text-green-400" />
                ) : sseError ? (
                  <WifiOff size={24} className="text-red-400 animate-pulse" />
                ) : (
                  <Wifi size={24} className="text-yellow-400 animate-pulse" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    sseConnected 
                      ? "text-green-300" 
                      : sseError 
                      ? "text-red-300"
                      : "text-yellow-300"
                  }`}>
                    {sseConnected 
                      ? (language === "sv" ? "🚀 SSE Realtidsstreaming aktiv" : "🚀 SSE Real-time streaming active")
                      : sseError
                      ? (language === "sv" ? "❌ Anslutningsfel" : "❌ Connection error")
                      : (language === "sv" ? "⏳ Ansluter till SSE..." : "⏳ Connecting to SSE...")}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3">
                      {notificationCount > 0 && (
                        <p className={`text-xs ${
                          sseConnected ? "text-green-400/80" : "text-yellow-400/80"
                        }`}>
                          {language === "sv" ? "Notiser: " : "Alerts: "}{notificationCount}
                        </p>
                      )}
                      {lastUpdateTime && sseConnected && (
                        <p className="text-xs text-green-400/60">
                          {language === "sv" ? "Senast: " : "Last: "}
                          {lastUpdateTime.toLocaleTimeString(language === "sv" ? "sv-SE" : "en-US", {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {sseError && (
                    <p className="text-xs text-red-400 mt-2">
                      🔍 {sseError}
                    </p>
                  )}
                </div>
              </div>
              {!sseConnected && sseError && (
                <div className="px-4 pb-4 space-y-2">
                  <Button 
                    onClick={() => startSSEStream()} 
                    size="sm" 
                    className="w-full bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)]"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    {language === "sv" ? "Försök ansluta igen" : "Try reconnecting"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <Card className="premium-card mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.enabled ? <Bell size={20} className="text-[hsl(24,95%,53%)]" /> : <BellOff size={20} className="text-gray-500" />}
                {language === "sv" ? "Realtidsnotiser (WebSocket)" : "Real-time Notifications (WebSocket)"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Data streamas direkt från Trafikverket - omedelbar notis om nya olyckor och hinder" 
                  : "Data streamed directly from Trafikverket - immediate notification about new accidents and obstacles"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled" className="text-base">
                  {settings.enabled 
                    ? (language === "sv" ? "Aktiverad" : "Enabled")
                    : (language === "sv" ? "Avaktiverad" : "Disabled")}
                </Label>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>

              {settings.enabled && (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm font-medium mb-3 text-gray-300">
                      {language === "sv" ? "Notifiera mig om:" : "Notify me about:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        onClick={() => handleToggleEventType("accident")}
                        className={`cursor-pointer transition-all ${
                          settings.eventTypes.includes("accident")
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        🚨 {language === "sv" ? "Olyckor" : "Accidents"}
                      </Badge>
                      <Badge
                        onClick={() => handleToggleEventType("roadwork")}
                        className={`cursor-pointer transition-all ${
                          settings.eventTypes.includes("roadwork")
                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        🚧 {language === "sv" ? "Hinder" : "Obstacles"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="sound" className="text-sm flex items-center gap-2 text-gray-300">
                      {language === "sv" ? "Ljud" : "Sound"}
                    </Label>
                    <Switch
                      id="sound"
                      checked={settings.soundEnabled}
                      onCheckedChange={handleToggleSound}
                    />
                  </div>

                  <Button
                    onClick={() => router.push("/settings/traffic-notifications")}
                    variant="outline"
                    className="w-full mt-4"
                    size="sm"
                  >
                    <SettingsIcon size={16} className="mr-2" />
                    {language === "sv" ? "Avancerade filter" : "Advanced Filters"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card overflow-hidden">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-[hsl(24,95%,53%)]" />
                  <CardTitle>
                    {language === "sv" ? "Interaktiv Trafikkarta" : "Interactive Traffic Map"}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {allSituations.length} {language === "sv" ? "händelser" : "events"}
                  </Badge>
                  {streamingStatus.isConnected && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${getConnectionStatusColor()}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                      <span className="text-xs font-medium">{getConnectionStatusText()}</span>
                    </div>
                  )}
                </div>
              </div>
              <CardDescription>
                {language === "sv" 
                  ? `Klicka på markörer för mer information. Visar alla ${allSituations.length} aktuella händelser.` 
                  : `Click markers for more information. Showing all ${allSituations.length} current events.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] w-full relative">
                {isLoadingMap && (
                  <div className="absolute inset-0 z-10 bg-gray-900/50 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[hsl(24,95%,53%)] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <TrafficMap 
                  situations={(() => {
                    console.log("📤 TRAFFIC-ALERTS: Passing to TrafficMap:", {
                      count: allSituations.length,
                      sample: allSituations[0] ? JSON.stringify(allSituations[0], null, 2) : 'none'
                    });
                    return allSituations;
                  })()}
                  language={language}
                  isStreaming={streamingStatus.isConnected}
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 premium-card bg-gray-900/30">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                {language === "sv" ? "Förklaring" : "Legend"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs">🚨</div>
                  <span className="text-xs text-gray-300">{language === "sv" ? "Olycka" : "Accident"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs">🚧</div>
                  <span className="text-xs text-gray-300">{language === "sv" ? "Hinder" : "Obstacle"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">🚗</div>
                  <span className="text-xs text-gray-300">{language === "sv" ? "Stockning" : "Congestion"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs">ℹ️</div>
                  <span className="text-xs text-gray-300">{language === "sv" ? "Övrigt" : "Other"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 premium-card bg-blue-900/10 border-l-4 border-blue-500">
            <div className="p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-blue-400">
                  {language === "sv" ? "💡 Tips:" : "💡 Tip:"}
                </strong>{" "}
                {language === "sv" 
                  ? "Aktivera realtidsnotiser för att få omedelbar varning via WebSocket streaming. Kartan uppdateras automatiskt när nya händelser inträffar!" 
                  : "Enable real-time notifications to receive immediate alerts via WebSocket streaming. Map updates automatically when new events occur!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
