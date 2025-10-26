import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Bell, BellOff, Volume2, VolumeX, MapPin, Map as MapIcon, Navigation, AlertTriangle, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/translations";
import {
  getNotificationSettings,
  saveNotificationSettings,
  startTrafficPolling,
  stopTrafficPolling,
  SWEDISH_COUNTIES,
  EVENT_TYPES,
  SEVERITY_LEVELS,
  type TrafficNotificationSettings
} from "@/services/trafikverketService";
import type { TrafikverketSituation } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { pushNotifications } from "@/lib/pushNotifications";
import { authService } from "@/services/authService";

// Swedish Counties with proper structure (matching the JavaScript code shared by user)
const SWEDISH_COUNTIES_MAP: Record<string, string> = {
  '01': 'Stockholm',
  '03': 'Uppsala',
  '04': 'Södermanland',
  '05': 'Östergötland',
  '06': 'Jönköping',
  '07': 'Kronoberg',
  '08': 'Kalmar',
  '09': 'Gotland',
  '10': 'Blekinge',
  '12': 'Skåne',
  '13': 'Halland',
  '14': 'Västra Götaland',
  '17': 'Värmland',
  '18': 'Örebro',
  '19': 'Västmanland',
  '20': 'Dalarna',
  '21': 'Gävleborg',
  '22': 'Västernorrland',
  '23': 'Jämtland',
  '24': 'Västerbotten',
  '25': 'Norrbotten'
};

function getCountyName(code: string): string {
  return SWEDISH_COUNTIES_MAP[code] || code;
}

export default function TrafficNotificationsPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<TrafficNotificationSettings>(getNotificationSettings());
  const [customCity, setCustomCity] = useState("");
  const [customRoadNumber, setCustomRoadNumber] = useState("");
  const [pushStatus, setPushStatus] = useState<"supported" | "unsupported" | "enabled" | "disabled">("disabled");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
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
  }, []);

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

  const startPolling = () => {
    startTrafficPolling(settings, handleNewSituation);
  };

  const handleNewSituation = (situation: TrafikverketSituation) => {
    const deviation = situation.Deviation[0];
    
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    toast({
      title: deviation.Header,
      description: deviation.Message,
      duration: 10000,
    });
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(error => console.error("Could not play sound:", error));
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
    }

    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);

    toast({
      title: enabled 
        ? (language === "sv" ? "🔔 Trafikbevakningar aktiverade" : "🔔 Traffic monitoring enabled")
        : (language === "sv" ? "🔕 Trafikbevakningar avaktiverade" : "🔕 Traffic monitoring disabled"),
      description: enabled
        ? (language === "sv" ? "Du får nu notiser för nya händelser i realtid" : "You will now receive notifications for new events in real-time")
        : (language === "sv" ? "Inga fler notifikationer" : "No more notifications")
    });
  };

  const handleToggleSound = (soundEnabled: boolean) => {
    const newSettings = { ...settings, soundEnabled };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  // Save to localStorage AND Supabase when settings change
  const saveSettingsToBackend = async (newSettings: TrafficNotificationSettings) => {
    setIsSaving(true);
    
    // Save locally first
    saveNotificationSettings(newSettings);
    
    // Try to save to Supabase if user is authenticated
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const response = await fetch('/api/trafikverket/filters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            filters: {
              counties: newSettings.counties,
              municipalities: newSettings.cities,
              roadNumbers: newSettings.roadNumbers,
              eventTypes: newSettings.eventTypes,
              severityFilter: newSettings.severityFilter || [],
              notifications: {
                enabled: newSettings.enabled,
                soundAlerts: newSettings.soundEnabled,
                highPriorityOnly: false
              }
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save to backend');
        }
        
        console.log("✅ Settings saved to Supabase successfully");
      }
    } catch (error) {
      console.error("❌ Failed to save settings to backend:", error);
      toast({
        title: language === "sv" ? "⚠️ Varning" : "⚠️ Warning",
        description: language === "sv" 
          ? "Inställningarna sparades lokalt men kunde inte synkas till servern" 
          : "Settings saved locally but could not sync to server",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCounty = async (countyCode: string) => {
    const newCounties = settings.counties.includes(countyCode)
      ? settings.counties.filter(c => c !== countyCode)
      : [...settings.counties, countyCode];
    
    const newSettings = { ...settings, counties: newCounties };
    setSettings(newSettings);
    await saveSettingsToBackend(newSettings);
    
    toast({
      title: language === "sv" ? "✅ Län uppdaterat" : "✅ County updated",
      description: getCountyName(countyCode),
      duration: 2000
    });
  };

  const handleAddCity = async () => {
    if (customCity.trim() && !settings.cities.includes(customCity.trim())) {
      const newSettings = { ...settings, cities: [...settings.cities, customCity.trim()] };
      setSettings(newSettings);
      await saveSettingsToBackend(newSettings);
      setCustomCity("");
      
      toast({
        title: language === "sv" ? "✅ Kommun/Ort tillagd" : "✅ Municipality added",
        description: customCity.trim(),
        duration: 2000
      });
    }
  };

  const handleRemoveCity = async (city: string) => {
    const newSettings = { ...settings, cities: settings.cities.filter(c => c !== city) };
    setSettings(newSettings);
    await saveSettingsToBackend(newSettings);
    
    toast({
      title: language === "sv" ? "✅ Kommun/Ort borttagen" : "✅ Municipality removed",
      description: city,
      duration: 2000
    });
  };

  const handleAddRoadNumber = async () => {
    if (customRoadNumber.trim() && !settings.roadNumbers.includes(customRoadNumber.trim().toUpperCase())) {
      const roadNum = customRoadNumber.trim().toUpperCase();
      const newSettings = { ...settings, roadNumbers: [...settings.roadNumbers, roadNum] };
      setSettings(newSettings);
      await saveSettingsToBackend(newSettings);
      setCustomRoadNumber("");
      
      toast({
        title: language === "sv" ? "✅ Vägnummer tillagt" : "✅ Road number added",
        description: roadNum,
        duration: 2000
      });
    }
  };

  const handleRemoveRoadNumber = async (roadNumber: string) => {
    const newSettings = { ...settings, roadNumbers: settings.roadNumbers.filter(r => r !== roadNumber) };
    setSettings(newSettings);
    await saveSettingsToBackend(newSettings);
    
    toast({
      title: language === "sv" ? "✅ Vägnummer borttaget" : "✅ Road number removed",
      description: roadNumber,
      duration: 2000
    });
  };

  const handleToggleEventType = async (eventType: string) => {
    const newEventTypes = settings.eventTypes.includes(eventType)
      ? settings.eventTypes.filter(e => e !== eventType)
      : [...settings.eventTypes, eventType];
    
    const newSettings = { ...settings, eventTypes: newEventTypes };
    setSettings(newSettings);
    await saveSettingsToBackend(newSettings);
  };

  const handleToggleSeverity = async (severityId: string) => {
    const newSeverityFilter = settings.severityFilter?.includes(severityId)
      ? settings.severityFilter.filter(s => s !== severityId)
      : [...(settings.severityFilter || []), severityId];
    
    const newSettings = { ...settings, severityFilter: newSeverityFilter };
    setSettings(newSettings);
    await saveSettingsToBackend(newSettings);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (settings.counties.length > 0) count += settings.counties.length;
    if (settings.cities.length > 0) count += settings.cities.length;
    if (settings.roadNumbers.length > 0) count += settings.roadNumbers.length;
    if (settings.eventTypes.length < EVENT_TYPES.length) count += settings.eventTypes.length;
    if (settings.severityFilter && settings.severityFilter.length > 0) count += settings.severityFilter.length;
    return count;
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="rounded-xl hover:bg-white/10">
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-semibold text-white">
            {language === "sv" ? "Trafikbevakningar" : "Traffic Monitoring"}
          </h1>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="min-h-screen gradient-bg pt-24 pb-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">
          
          {/* Status Banner */}
          {pushStatus === "enabled" && settings.enabled && (
            <div className="premium-card bg-gradient-to-r from-green-900/20 to-green-800/20 border-l-4 border-green-500">
              <div className="flex items-center gap-3 p-4">
                <Bell size={24} className="text-green-400 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-300">
                    {language === "sv" ? "🚀 Trafikbevakning aktiv!" : "🚀 Traffic monitoring active!"}
                  </p>
                  <p className="text-xs text-green-400/80 mt-1">
                    {language === "sv" 
                      ? `Du bevakar ${getActiveFiltersCount()} filter och får realtidsnotiser` 
                      : `You are monitoring ${getActiveFiltersCount()} filters with real-time notifications`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Toggle Card */}
          <Card className="premium-card border-[hsl(24,95%,53%)]/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    {settings.enabled ? (
                      <Bell size={28} className="text-[hsl(24,95%,53%)] animate-pulse" />
                    ) : (
                      <BellOff size={28} className="text-gray-500" />
                    )}
                    {language === "sv" ? "Trafikbevakningar" : "Traffic Monitoring"}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {language === "sv" 
                      ? "Välj vad du vill bevaka och få notiser om" 
                      : "Choose what you want to monitor and receive notifications about"}
                  </CardDescription>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={handleToggleEnabled}
                  className="scale-125"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Counties Filter */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapIcon size={22} className="text-[hsl(24,95%,53%)]" />
                {language === "sv" ? "📍 Län" : "📍 Counties"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Välj län du vill bevaka. Lämna tomt för att bevaka hela Sverige." 
                  : "Select counties to monitor. Leave empty to monitor all of Sweden."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {SWEDISH_COUNTIES.map(county => (
                  <button
                    key={county.code}
                    onClick={() => handleToggleCounty(county.code)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      settings.counties.includes(county.code)
                        ? "bg-[hsl(24,95%,53%)] text-white shadow-lg scale-105"
                        : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    {county.name}
                  </button>
                ))}
              </div>
              {settings.counties.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  {language === "sv" 
                    ? `${settings.counties.length} län valda` 
                    : `${settings.counties.length} counties selected`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cities/Municipalities */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={22} className="text-[hsl(24,95%,53%)]" />
                {language === "sv" ? "🏘️ Kommuner/Orter" : "🏘️ Municipalities/Cities"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Sök och lägg till specifika kommuner eller orter du vill bevaka" 
                  : "Search and add specific municipalities or cities you want to monitor"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={language === "sv" ? "Sök kommun eller ort..." : "Search municipality or city..."}
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCity()}
                  className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[hsl(24,95%,53%)]"
                />
                <Button 
                  onClick={handleAddCity} 
                  disabled={!customCity.trim()}
                  className="bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)]"
                >
                  <Plus size={18} className="mr-1" />
                  {language === "sv" ? "Lägg till" : "Add"}
                </Button>
              </div>
              
              {settings.cities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    {language === "sv" ? "Valda orter:" : "Selected cities:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {settings.cities.map(city => (
                      <Badge
                        key={city}
                        className="px-3 py-1.5 bg-[hsl(24,95%,53%)] text-white hover:bg-[hsl(24,95%,45%)] cursor-pointer group"
                        onClick={() => handleRemoveCity(city)}
                      >
                        <span className="mr-2">{city}</span>
                        <X size={14} className="group-hover:text-red-300" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Road Numbers */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation size={22} className="text-[hsl(24,95%,53%)]" />
                {language === "sv" ? "🛣️ Vägnummer" : "🛣️ Road Numbers"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Lägg till specifika vägnummer som E4, E20, 73, 222..." 
                  : "Add specific road numbers like E4, E20, 73, 222..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={language === "sv" ? "T.ex. E4, E20, 73, 222..." : "E.g. E4, E20, 73, 222..."}
                  value={customRoadNumber}
                  onChange={(e) => setCustomRoadNumber(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && handleAddRoadNumber()}
                  className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-[hsl(24,95%,53%)]"
                />
                <Button 
                  onClick={handleAddRoadNumber} 
                  disabled={!customRoadNumber.trim()}
                  className="bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)]"
                >
                  <Plus size={18} className="mr-1" />
                  {language === "sv" ? "Lägg till" : "Add"}
                </Button>
              </div>
              
              {settings.roadNumbers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">
                    {language === "sv" ? "Valda vägar:" : "Selected roads:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {settings.roadNumbers.map(roadNumber => (
                      <Badge
                        key={roadNumber}
                        className="px-3 py-1.5 bg-[hsl(24,95%,53%)] text-white hover:bg-[hsl(24,95%,45%)] cursor-pointer group font-mono"
                        onClick={() => handleRemoveRoadNumber(roadNumber)}
                      >
                        <span className="mr-2">{roadNumber}</span>
                        <X size={14} className="group-hover:text-red-300" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Types */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={22} className="text-[hsl(24,95%,53%)]" />
                {language === "sv" ? "⚠️ Händelsetyper" : "⚠️ Event Types"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Välj vilka typer av händelser du vill få notiser om" 
                  : "Select which types of events you want to be notified about"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {EVENT_TYPES.map(eventType => (
                  <div
                    key={eventType.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                  >
                    <Checkbox
                      id={eventType.id}
                      checked={settings.eventTypes.includes(eventType.id)}
                      onCheckedChange={() => handleToggleEventType(eventType.id)}
                      className="border-gray-600"
                    />
                    <Label
                      htmlFor={eventType.id}
                      className="flex items-center gap-2 text-base cursor-pointer flex-1"
                    >
                      <span className="text-2xl">{eventType.icon}</span>
                      <span>{eventType.name[language]}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Severity Filter */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={22} className="text-[hsl(24,95%,53%)]" />
                {language === "sv" ? "🔴 Allvarlighetsgrad" : "🔴 Severity Level"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Filtrera händelser baserat på allvarlighetsgrad. Lämna tomt för alla nivåer." 
                  : "Filter events by severity level. Leave empty for all levels."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SEVERITY_LEVELS.map(severity => (
                  <div
                    key={severity.id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                  >
                    <Checkbox
                      id={severity.id}
                      checked={settings.severityFilter?.includes(severity.id) || false}
                      onCheckedChange={() => handleToggleSeverity(severity.id)}
                      className="border-gray-600"
                    />
                    <Label
                      htmlFor={severity.id}
                      className="flex items-center gap-3 text-base cursor-pointer flex-1"
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        severity.id === "VeryHigh" ? "bg-red-500" :
                        severity.id === "High" ? "bg-orange-500" :
                        severity.id === "Medium" ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}></div>
                      <span>{severity.name[language]}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={22} className="text-[hsl(24,95%,53%)]" />
                {language === "sv" ? "🔔 Notifieringsinställningar" : "🔔 Notification Settings"}
              </CardTitle>
              <CardDescription>
                {language === "sv" 
                  ? "Anpassa hur du vill ta emot notiser" 
                  : "Customize how you want to receive notifications"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                <Label htmlFor="notifications" className="flex items-center gap-2 text-base cursor-pointer">
                  <Bell size={18} />
                  {language === "sv" ? "Aktivera notiser" : "Enable notifications"}
                </Label>
                <Switch
                  id="notifications"
                  checked={settings.enabled}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                <Label htmlFor="sound" className="flex items-center gap-2 text-base cursor-pointer">
                  {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  {language === "sv" ? "Ljud vid nya händelser" : "Sound for new events"}
                </Label>
                <Switch
                  id="sound"
                  checked={settings.soundEnabled}
                  onCheckedChange={handleToggleSound}
                  disabled={!settings.enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={() => {
              toast({
                title: language === "sv" ? "✅ Bevakningar sparade!" : "✅ Monitoring saved!",
                description: language === "sv" 
                  ? `Du bevakar nu ${getActiveFiltersCount()} filter` 
                  : `You are now monitoring ${getActiveFiltersCount()} filters`
              });
              router.push("/traffic-alerts");
            }}
            className="w-full premium-button py-6 text-lg"
            disabled={!settings.enabled}
          >
            {language === "sv" ? "Spara bevakningar" : "Save monitoring"}
          </Button>

          {/* Help Text */}
          <div className="premium-card bg-blue-900/10 border-l-4 border-blue-500">
            <div className="p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                <strong className="text-blue-400">
                  {language === "sv" ? "💡 Tips:" : "💡 Tip:"}
                </strong>{" "}
                {language === "sv" 
                  ? "Ju fler filter du väljer, desto mer specifika notiser får du. Lämna alla filter tomma för att bevaka hela Sverige." 
                  : "The more filters you select, the more specific notifications you'll receive. Leave all filters empty to monitor all of Sweden."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
