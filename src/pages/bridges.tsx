import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Search, MapPin, Play, Filter, Cloud, CloudRain, Sun, TrafficCone, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Bridge, TrafikverketSituation } from "@/types";
import { storage } from "@/lib/storage";
import { broService } from "@/services/broService";
import { useTranslation } from "@/lib/translations";
import { fetchTrafficInfo as fetchTrafficInfoFromAPI } from "@/services/trafikverketService";
import { useToast } from "@/hooks/use-toast";
import { getAddressFromCoordinates, formatAddressShort, Address } from "@/lib/geocoding";

interface WeatherData {
  temperature: number;
  condition: string;
  precipitation: number;
}

// Add delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add traffic cache configuration
const TRAFFIC_CACHE_KEY_PREFIX = "bridge_traffic_cache_";
const TRAFFIC_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedTrafficData {
  situations: TrafikverketSituation[];
  timestamp: number;
}

// OPTIMIZATION: Add pagination constants
const BRIDGES_PER_PAGE = 20;

export default function BridgesPage() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [trafficInfo, setTrafficInfo] = useState<TrafikverketSituation[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false);
  const [isLoadingBridges, setIsLoadingBridges] = useState(true);
  const [selectedBridgeForTraffic, setSelectedBridgeForTraffic] = useState<string | null>(null);
  const [bridgeAddresses, setBridgeAddresses] = useState<Record<string, Address>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getBridges = async () => {
      try {
        setIsLoadingBridges(true);
        const data = await broService.getAllBridges();
        setBridges(data);
        // Fetch weather and addresses for first page
        if (data && data.length > 0) {
          fetchWeatherDataForBridges(data);
          fetchAddressesForBridges(data);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Error loading bridges:', err);
      } finally {
        setIsLoadingBridges(false);
      }
    };
    getBridges();
  }, []);

  const loadBridgesFromSupabase = async () => {
    setIsLoadingBridges(true);
    try {
      const supabaseBridges = await broService.getAllBridges();

      if (supabaseBridges && supabaseBridges.length > 0) {
        const mappedBridges: Bridge[] = supabaseBridges.map(sb => ({
          ...sb,
          description: sb.description || "",
          ta_plan_url: sb.ta_plan_url || undefined
        }));
        setBridges(mappedBridges);
        // FIXED: Queue weather requests with delays to avoid rate limiting
        fetchWeatherDataForBridges(mappedBridges);
        fetchAddressesForBridges(mappedBridges);
      } else {
        const localBridges = storage.getBridges();
        if (localBridges.length > 0) {
          toast({
            title: language === "sv" ? "Migrerar broar..." : "Migrating bridges...",
            description: language === "sv" ? "Synkroniserar lokala broar till molnet" : "Syncing local bridges to cloud"
          });
          
          for (const bridge of localBridges) {
            try {
              await broService.createBridge({
                id: bridge.id,
                created_at: bridge.created_at,
                name: bridge.name,
                x: bridge.x,
                y: bridge.y,
                description: bridge.description,
                ta_plan_url: bridge.ta_plan_url
              });
            } catch (error) {
              console.error("Failed to migrate bridge:", bridge.id, error);
            }
          }
          
          const migratedBridges = await broService.getAllBridges();
          const mappedBridges: Bridge[] = migratedBridges.map(sb => ({
            ...sb,
            description: sb.description || "",
            ta_plan_url: sb.ta_plan_url || undefined
          }));
          setBridges(mappedBridges);
          fetchWeatherDataForBridges(mappedBridges);
          fetchAddressesForBridges(mappedBridges);
          
          toast({
            title: language === "sv" ? "Synkronisering klar!" : "Sync complete!",
            description: language === "sv" ? `${mappedBridges.length} broar synkroniserade` : `${mappedBridges.length} bridges synced`
          });
        } else {
          setBridges([]);
        }
      }
    } catch (error) {
      console.error("Failed to load bridges from Supabase:", error);
      const localBridges = storage.getBridges();
      setBridges(localBridges);
      if (localBridges.length > 0) {
        fetchWeatherDataForBridges(localBridges);
        fetchAddressesForBridges(localBridges);
      }
      toast({
        title: language === "sv" ? "Offline-läge" : "Offline mode",
        description: language === "sv" ? "Visar lokalt sparade broar" : "Showing locally saved bridges",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBridges(false);
    }
  };

  // OPTIMIZED: Only fetch weather for visible bridges
  const fetchWeatherDataForBridges = async (bridgesToFetch: Bridge[]) => {
    const cachedWeather = localStorage.getItem('weather_cache');
    const cache: Record<string, { data: WeatherData; timestamp: number }> = cachedWeather ? JSON.parse(cachedWeather) : {};
    const now = Date.now();
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

    // OPTIMIZATION: Only fetch for first page on initial load
    const visibleBridges = bridgesToFetch.slice(0, BRIDGES_PER_PAGE);

    for (let i = 0; i < visibleBridges.length; i++) {
      const bridge = visibleBridges[i];
      
      if (cache[bridge.id] && (now - cache[bridge.id].timestamp) < CACHE_DURATION) {
        setWeatherData(prev => ({
          ...prev,
          [bridge.id]: cache[bridge.id].data
        }));
        continue;
      }

      if (i > 0) {
        await delay(2000);
      }

      try {
        await fetchWeatherData(bridge.id, bridge.y, bridge.x);
      } catch (error) {
        console.warn(`Skipping weather for bridge ${bridge.id} due to rate limit`);
      }
    }
  };

  const fetchWeatherData = async (bridgeId: string, lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded");
        }
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.current_weather) {
        const weatherInfo = {
          temperature: Math.round(data.current_weather.temperature),
          condition: getWeatherCondition(data.current_weather.weathercode),
          precipitation: data.current_weather.precipitation || 0
        };

        setWeatherData(prev => ({
          ...prev,
          [bridgeId]: weatherInfo
        }));

        // Cache the result
        const cachedWeather = localStorage.getItem('weather_cache');
        const cache: Record<string, { data: WeatherData; timestamp: number }> = cachedWeather ? JSON.parse(cachedWeather) : {};
        cache[bridgeId] = {
          data: weatherInfo,
          timestamp: Date.now()
        };
        localStorage.setItem('weather_cache', JSON.stringify(cache));
      }
    } catch (error) {
      console.error(`Could not fetch weather for bridge ${bridgeId}:`, error);
      throw error; // Re-throw to handle in queue
    }
  };

  const fetchAddressesForBridges = async (bridgesToFetch: Bridge[]) => {
    const cachedAddresses = localStorage.getItem('bridge_addresses_cache');
    const cache: Record<string, { address: Address; timestamp: number }> = cachedAddresses ? JSON.parse(cachedAddresses) : {};
    const now = Date.now();
    const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    // OPTIMIZATION: Only fetch for first page on initial load
    const visibleBridges = bridgesToFetch.slice(0, BRIDGES_PER_PAGE);

    for (let i = 0; i < visibleBridges.length; i++) {
      const bridge = visibleBridges[i];
      
      if (cache[bridge.id] && (now - cache[bridge.id].timestamp) < CACHE_DURATION) {
        setBridgeAddresses(prev => ({
          ...prev,
          [bridge.id]: cache[bridge.id].address
        }));
        continue;
      }

      if (i > 0) {
        await delay(1000);
      }

      try {
        const address = await getAddressFromCoordinates(bridge.y, bridge.x);
        if (address) {
          setBridgeAddresses(prev => ({
            ...prev,
            [bridge.id]: address
          }));
          
          cache[bridge.id] = {
            address,
            timestamp: now
          };
          localStorage.setItem('bridge_addresses_cache', JSON.stringify(cache));
        }
      } catch (error) {
        console.warn(`Failed to get address for bridge ${bridge.id}:`, error);
      }
    }
  };

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return language === "sv" ? "Klart" : "Clear";
    if (code <= 3) return language === "sv" ? "Molnigt" : "Cloudy";
    if (code <= 67) return language === "sv" ? "Regn" : "Rain";
    if (code <= 77) return language === "sv" ? "Snö" : "Snow";
    return language === "sv" ? "Varierat" : "Variable";
  };

  const getWeatherIcon = (condition: string) => {
    if (condition.includes("Clear") || condition.includes("Klart")) return <Sun size={16} className="text-[hsl(24,95%,53%)]" />;
    if (condition.includes("Rain") || condition.includes("Regn")) return <CloudRain size={16} className="text-[hsl(24,95%,53%)]" />;
    return <Cloud size={16} className="text-[hsl(24,95%,53%)]" />;
  };

  const filteredBridges = bridges
    .filter((bridge) => {
      const searchLower = searchTerm.toLowerCase().trim();
      
      if (!searchLower) return true;
      
      const matchesName = bridge.name.toLowerCase().includes(searchLower);
      const matchesDescription = (bridge.description && bridge.description.toLowerCase().includes(searchLower));
      const bridgeIdClean = bridge.id.split('-').filter(part => !/^[a-f0-9]{4,}$/i.test(part)).join('-');
      const matchesId = bridge.id.toLowerCase().includes(searchLower) || 
                        bridgeIdClean.toLowerCase().includes(searchLower);
      
      const address = bridgeAddresses[bridge.id];
      if (address) {
        const matchesCity = address.city?.toLowerCase().includes(searchLower);
        const matchesTown = address.town?.toLowerCase().includes(searchLower);
        const matchesVillage = address.village?.toLowerCase().includes(searchLower);
        const matchesCounty = address.county?.toLowerCase().includes(searchLower);
        const matchesRoad = address.road?.toLowerCase().includes(searchLower);
        const matchesSuburb = address.suburb?.toLowerCase().includes(searchLower);
        
        if (matchesCity || matchesTown || matchesVillage || matchesCounty || matchesRoad || matchesSuburb) {
          return true;
        }
      }
      
      return matchesName || matchesDescription || matchesId;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "id") {
        return a.id.localeCompare(b.id);
      }
      return 0;
    });

  // OPTIMIZATION: Paginate results
  const totalPages = Math.ceil(filteredBridges.length / BRIDGES_PER_PAGE);
  const paginatedBridges = filteredBridges.slice(0, currentPage * BRIDGES_PER_PAGE);

  // OPTIMIZATION: Load more bridges when user scrolls near bottom
  const loadMoreBridges = async () => {
    if (currentPage >= totalPages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const start = currentPage * BRIDGES_PER_PAGE;
    const end = start + BRIDGES_PER_PAGE;
    const nextBatch = filteredBridges.slice(start, end);
    
    // Fetch weather and addresses for next batch
    for (const bridge of nextBatch) {
      if (!weatherData[bridge.id]) {
        await delay(2000);
        try {
          await fetchWeatherData(bridge.id, bridge.y, bridge.x);
        } catch (error) {
          console.warn(`Failed to fetch weather for ${bridge.id}`);
        }
      }
      
      if (!bridgeAddresses[bridge.id]) {
        await delay(1000);
        try {
          const address = await getAddressFromCoordinates(bridge.y, bridge.x);
          if (address) {
            setBridgeAddresses(prev => ({ ...prev, [bridge.id]: address }));
          }
        } catch (error) {
          console.warn(`Failed to fetch address for ${bridge.id}`);
        }
      }
    }
    
    setCurrentPage(nextPage);
    setIsLoadingMore(false);
  };

  // OPTIMIZATION: Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const openInMaps = (x: number, y: number) => {
    window.open(`https://www.google.com/maps?q=${y},${x}`, "_blank");
  };

  const startJob = (bridgeId: string, bridgeName: string) => {
    router.push(`/new-job?bridgeId=${bridgeId}&bridgeName=${encodeURIComponent(bridgeName)}`);
  };

  const fetchTrafficInfo = async (bridge: Bridge) => {
    if (selectedBridgeForTraffic === bridge.id) {
      setSelectedBridgeForTraffic(null);
      return;
    }
    setSelectedBridgeForTraffic(bridge.id);
    
    const cacheKey = `${TRAFFIC_CACHE_KEY_PREFIX}${bridge.id}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsed: CachedTrafficData = JSON.parse(cachedData);
        const age = Date.now() - parsed.timestamp;
        
        if (age < TRAFFIC_CACHE_DURATION) {
          setTrafficInfo(parsed.situations);
          
          const ageMinutes = Math.floor(age / 60000);
          toast({
            title: language === "sv" ? "Cachad data" : "Cached data",
            description: language === "sv" 
              ? `Visar trafikdata från ${ageMinutes} minut${ageMinutes !== 1 ? "er" : ""} sedan`
              : `Showing traffic data from ${ageMinutes} minute${ageMinutes !== 1 ? "s" : ""} ago`
          });
          return;
        }
      } catch (error) {
        console.warn("Failed to parse cached traffic data:", error);
      }
    }
    
    setIsLoadingTraffic(true);
    try {
      // CRITICAL FIX: Validate coordinates exist first
      if (bridge.y === null || bridge.y === undefined || bridge.x === null || bridge.x === undefined) {
        throw new Error(
          language === "sv" 
            ? `Koordinater saknas för ${bridge.name}. Denna bro har inte konfigurerats korrekt.`
            : `Coordinates missing for ${bridge.name}. This bridge has not been configured correctly.`
        );
      }

      // CRITICAL FIX: Validate coordinates are valid numbers
      if (isNaN(bridge.y) || isNaN(bridge.x)) {
        throw new Error(
          language === "sv" 
            ? `Ogiltiga koordinater för ${bridge.name}. Latitude: ${bridge.y}, Longitude: ${bridge.x}`
            : `Invalid coordinates for ${bridge.name}. Latitude: ${bridge.y}, Longitude: ${bridge.x}`
        );
      }

      // CRITICAL FIX: Validate coordinate ranges for Sweden
      if (bridge.y < 55 || bridge.y > 70) {
        throw new Error(
          language === "sv"
            ? `Koordinater utanför Sverige för ${bridge.name}. Latitude: ${bridge.y} (förväntat: 55-70)`
            : `Coordinates outside Sweden for ${bridge.name}. Latitude: ${bridge.y} (expected: 55-70)`
        );
      }

      if (bridge.x < 10 || bridge.x > 25) {
        throw new Error(
          language === "sv"
            ? `Koordinater utanför Sverige för ${bridge.name}. Longitude: ${bridge.x} (förväntat: 10-25)`
            : `Coordinates outside Sweden for ${bridge.name}. Longitude: ${bridge.x} (expected: 10-25)`
        );
      }

      console.log(`🔍 Fetching traffic for ${bridge.name} at lat=${bridge.y}, lon=${bridge.x}`);
      
      const situations = await fetchTrafficInfoFromAPI(
        bridge.y,
        bridge.x,
        10
      );
      setTrafficInfo(situations);
      
      const cacheData: CachedTrafficData = {
        situations,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      if (situations.length === 0) {
        toast({
          title: language === "sv" ? "Ingen trafikinformation" : "No traffic info",
          description: language === "sv" 
            ? "Det finns inga aktiva trafikstörningar inom 10 km." 
            : "There are no active traffic disruptions within 10 km."
        });
      } else {
        toast({
          title: language === "sv" ? "Trafikdata hämtad" : "Traffic data fetched",
          description: language === "sv"
            ? `Hittade ${situations.length} trafikhändelse${situations.length !== 1 ? "r" : ""}`
            : `Found ${situations.length} traffic incident${situations.length !== 1 ? "s" : ""}`
        });
      }
    } catch (error) {
      console.error("Failed to fetch traffic info:", error);
      
      let errorMessage = (error as Error).message;
      
      // IMPROVED: Better error message for connection issues
      if (!errorMessage || errorMessage === "Failed to fetch") {
        errorMessage = language === "sv"
          ? "Kunde inte ansluta till Trafikverket. Kontrollera din internetanslutning."
          : "Could not connect to Trafikverket. Check your internet connection.";
      }
      
      toast({
        title: language === "sv" ? "Trafikinfo misslyckades" : "Traffic info failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      setSelectedBridgeForTraffic(null);
    } finally {
      setIsLoadingTraffic(false);
    }
  };

  const SituationInfo = ({ situation }: { situation: TrafikverketSituation }) => {
    if (!situation || !situation.Deviation || situation.Deviation.length === 0) {
      return null;
    }
    const deviation = situation.Deviation[0];
    return (
      <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <p className="text-sm font-semibold text-yellow-400">
          <AlertTriangle size={16} className="inline mr-2" />
          Trafikinformation: {deviation.Header}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(deviation.CreationTime).toLocaleString("sv-SE")}
        </p>
        <p className="text-xs text-gray-300 mt-2">{deviation.Message}</p>
      </div>
    );
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 frosted-glass border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/10"
            >
              <ArrowLeft size={24} className="text-white" />
            </Button>
            <h1 className="text-xl font-semibold text-white" suppressHydrationWarning>
                {mounted ? t("bridgeRegister") : "Broregister"}
            </h1>
           <LanguageSwitcher />
        </div>
      </div>

      <div className="min-h-screen gradient-bg pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={20} color="rgba(245, 245, 245, 0.5)" />
              <Input
                type="text"
                placeholder={t("searchBridges")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="frosted-glass border-gray-700 text-white placeholder:text-gray-500 focus:border-[hsl(24,95%,53%)] transition-colors pl-12"
              />
            </div>

            <div className="flex gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="frosted-glass border-gray-700 text-white flex-1">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder={t("filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{language === "sv" ? "Namn" : "Name"}</SelectItem>
                  <SelectItem value="id">{language === "sv" ? "Bro-ID" : "Bridge ID"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingBridges ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={48} className="animate-spin text-[hsl(24,95%,53%)]" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedBridges.map((bridge) => {
                  // FIXED: Create clean bridge ID display (remove hex UUID parts)
                  const cleanBridgeId = bridge.id
                    .split('-')
                    .filter((part, index) => {
                      // Keep the first part (the actual bridge number)
                      if (index === 0) return true;
                      // Remove hex UUID parts (4+ hex characters)
                      return !/^[a-f0-9]{4,}$/i.test(part);
                    })
                    .join('-');
                  
                  return (
                  <div key={bridge.id} className="premium-card card-hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1 text-white">
                          {bridge.name}
                        </h3>
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {cleanBridgeId}
                          </Badge>
                          {bridgeAddresses[bridge.id] && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                              <MapPin size={14} className="text-[hsl(24,95%,53%)]" />
                              <span>{formatAddressShort(bridgeAddresses[bridge.id])}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {weatherData[bridge.id] && (
                        <div className="flex items-center gap-2 p-2 rounded-lg frosted-glass">
                          {getWeatherIcon(weatherData[bridge.id].condition)}
                          <span className="text-sm font-semibold text-white">
                            {weatherData[bridge.id].temperature}°C
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm mb-4 text-gray-300">
                      {bridge.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <button
                        onClick={() => openInMaps(bridge.x, bridge.y)}
                        className="premium-button py-3 text-sm"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <MapPin size={18} />
                          <span>{t("showOnMap")}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => startJob(bridge.id, bridge.name)}
                        className="premium-button py-3 text-sm"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Play size={18} />
                          <span>{t("startJob")}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => fetchTrafficInfo(bridge)}
                        className="premium-button py-3 text-sm lg:col-span-1"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <TrafficCone size={18} />
                          <span>{t("fetchTrafficInfo")}</span>
                        </div>
                      </button>
                    </div>
                    {selectedBridgeForTraffic === bridge.id && (
                      <div className="mt-4 p-4 rounded-lg frosted-glass border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-3">{t("trafficInfo")}</h4>
                        {isLoadingTraffic ? (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Loader2 size={16} className="animate-spin" />
                            <span>{t("loadingTrafficInfo")}</span>
                          </div>
                        ) : trafficInfo.length > 0 ? (
                          <ul className="space-y-3">
                            {trafficInfo.map((situation, index) => {
                              const deviation = situation.Deviation[0];
                              if (!deviation) return null;
                              return (
                                <li key={index} className="text-sm text-gray-300 border-l-2 border-[hsl(24,95%,53%)] pl-3">
                                  <p className="font-semibold text-white">{deviation.Header}</p>
                                  <p className="text-xs text-gray-400 mb-1">
                                    {new Date(deviation.CreationTime).toLocaleString(language === "sv" ? "sv-SE" : "en-US")}
                                  </p>
                                  <p>{deviation.Message}</p>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400">{t("noTrafficInfo")}</p>
                        )}
                      </div>
                    )}
                  </div>
                )})}
              </div>

              {paginatedBridges.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-lg mb-2 text-gray-400">
                    {searchTerm ? (language === "sv" ? "Inga broar matchar sökningen" : "No bridges match the search") : t("noBridges")}
                  </p>
                </div>
              )}

              {/* OPTIMIZATION: Load More button */}
              {currentPage < totalPages && paginatedBridges.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={loadMoreBridges}
                    disabled={isLoadingMore}
                    className="premium-button"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {language === "sv" ? "Laddar fler..." : "Loading more..."}
                      </>
                    ) : (
                      <>
                        {language === "sv" ? `Ladda fler (${filteredBridges.length - paginatedBridges.length} kvar)` : `Load more (${filteredBridges.length - paginatedBridges.length} remaining)`}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
