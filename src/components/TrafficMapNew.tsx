"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Circle } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TrafikverketSituation } from "@/types";
import { AlertTriangle, Clock, MapPin, Navigation, Target, Ruler, Pencil, Maximize2, Minimize2, BarChart3, Layers, Route, Flame, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Fix default marker icons (only on client)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const SWEDISH_COUNTIES = [
  { code: "01", name: "Stockholm" },
  { code: "03", name: "Uppsala" },
  { code: "04", name: "Södermanland" },
  { code: "05", name: "Östergötland" },
  { code: "06", name: "Jönköping" },
  { code: "07", name: "Kronoberg" },
  { code: "08", name: "Kalmar" },
  { code: "09", name: "Gotland" },
  { code: "10", name: "Blekinge" },
  { code: "12", name: "Skåne" },
  { code: "13", name: "Halland" },
  { code: "14", name: "Västra Götaland" },
  { code: "17", name: "Värmland" },
  { code: "18", name: "Örebro" },
  { code: "19", name: "Västmanland" },
  { code: "20", name: "Dalarna" },
  { code: "21", name: "Gävleborg" },
  { code: "22", name: "Västernorrland" },
  { code: "23", name: "Jämtland" },
  { code: "24", name: "Västerbotten" },
  { code: "25", name: "Norrbotten" }
];

interface TrafficMapProps {
  situations: TrafikverketSituation[];
  language: "sv" | "en";
  isStreaming: boolean;
}

// Create custom marker icons
const createCustomIcon = (type: "accident" | "roadwork" | "congestion" | "other", emoji: string) => {
  const colors = {
    accident: "#ef4444",
    roadwork: "#eab308",
    congestion: "#3b82f6",
    other: "#6b7280"
  };

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background: ${colors[type]};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        border: 3px solid white;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), 0 0 0 4px ${colors[type]}33;
        animation: markerPulse 2s ease-in-out infinite;
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
        ${emoji}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -42]
  });
};

const accidentIcon = createCustomIcon("accident", "🚨");
const roadworkIcon = createCustomIcon("roadwork", "🚧");
const congestionIcon = createCustomIcon("congestion", "🚗");
const otherIcon = createCustomIcon("other", "ℹ️");

const createUserLocationIcon = () => {
  return L.divIcon({
    className: "user-location-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
        animation: locationPulse 2s ease-in-out infinite;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const userLocationIcon = createUserLocationIcon();

// Geolocation control component
function GeolocationControl({ language }: { language: "sv" | "en" }) {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    map.locate({ setView: true, maxZoom: 13 });
  };

  useEffect(() => {
    map.on('locationfound', (e) => {
      setUserLocation([e.latlng.lat, e.latlng.lng]);
      setIsLocating(false);
    });

    map.on('locationerror', () => {
      setIsLocating(false);
      alert(language === "sv" ? "Kunde inte hitta din plats" : "Could not find your location");
    });

    return () => {
      map.off('locationfound');
      map.off('locationerror');
    };
  }, [map, language]);

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ marginTop: "80px", marginRight: "10px" }}>
        <div className="leaflet-control">
          <Button
            onClick={handleLocate}
            disabled={isLocating}
            size="icon"
            className="w-10 h-10 bg-white hover:bg-gray-100 text-gray-900 rounded shadow-lg"
            title={language === "sv" ? "Hitta min plats" : "Find my location"}
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Target size={20} />
            )}
          </Button>
        </div>
      </div>
      
      {userLocation && (
        <Marker position={userLocation} icon={userLocationIcon}>
          <Popup>
            <div className="text-center text-sm">
              <p className="font-semibold">{language === "sv" ? "Din plats" : "Your location"}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

// Statistics panel
function StatisticsPanel({ situations, language }: { situations: any[]; language: "sv" | "en" }) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = useMemo(() => {
    const accidents = situations.filter(s => s.type === 'accident').length;
    const roadworks = situations.filter(s => s.type === 'roadwork').length;
    const congestions = situations.filter(s => s.type === 'congestion').length;
    const others = situations.filter(s => s.type === 'other').length;

    return { total: situations.length, accidents, roadworks, congestions, others };
  }, [situations]);

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "80px", marginLeft: "10px", zIndex: 999, pointerEvents: "none" }}>
      <Card className="bg-gray-900/95 border-white/10 text-white shadow-xl" style={{ minWidth: "280px", pointerEvents: "auto" }}>
        <CardHeader className="p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={18} />
              {language === "sv" ? "Statistik" : "Statistics"}
            </CardTitle>
            <Badge variant="secondary" className="text-sm font-bold">
              {stats.total}
            </Badge>
          </div>
        </CardHeader>
        
        {isOpen && (
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                {language === "sv" ? "Olyckor" : "Accidents"}
              </span>
              <Badge variant="destructive">{stats.accidents}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">🚧</span>
                {language === "sv" ? "Vägarbeten" : "Roadworks"}
              </span>
              <Badge className="bg-yellow-600">{stats.roadworks}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">🚗</span>
                {language === "sv" ? "Köer" : "Congestions"}
              </span>
              <Badge className="bg-blue-600">{stats.congestions}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="text-lg">ℹ️</span>
                {language === "sv" ? "Övrigt" : "Others"}
              </span>
              <Badge variant="secondary">{stats.others}</Badge>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Event search panel by county
function EventSearchPanel({ 
  situations, 
  language,
  onEventClick 
}: { 
  situations: any[];
  language: "sv" | "en";
  onEventClick: (lat: number, lon: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  const countyEvents = useMemo(() => {
    if (!selectedCounty) return [];
    
    return situations.filter(s => {
      const county = s.deviation.CountyNo;
      if (Array.isArray(county)) {
        return county.some(c => String(c).padStart(2, '0') === selectedCounty);
      }
      return String(county).padStart(2, '0') === selectedCounty;
    });
  }, [situations, selectedCounty]);

  const eventCountByCounty = useMemo(() => {
    const counts: Record<string, number> = {};
    SWEDISH_COUNTIES.forEach(county => {
      counts[county.code] = situations.filter(s => {
        const countyNo = s.deviation.CountyNo;
        if (Array.isArray(countyNo)) {
          return countyNo.some(c => String(c).padStart(2, '0') === county.code);
        }
        return String(countyNo).padStart(2, '0') === county.code;
      }).length;
    });
    return counts;
  }, [situations]);

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "160px", marginLeft: "10px", zIndex: 999, pointerEvents: "none" }}>
      <Card className="bg-gray-900/95 border-white/10 text-white shadow-xl" style={{ minWidth: "320px", maxWidth: "400px", pointerEvents: "auto" }}>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Search size={18} />
              {language === "sv" ? "Sök händelser" : "Search events"}
            </CardTitle>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isOpen ? <X size={18} /> : <Search size={18} />}
            </Button>
          </div>
        </CardHeader>
        
        {isOpen && (
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">
                {language === "sv" ? "Välj län" : "Select county"}
              </label>
              <Select value={selectedCounty || ""} onValueChange={setSelectedCounty}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-sm">
                  <SelectValue placeholder={language === "sv" ? "Välj ett län..." : "Select a county..."} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
                  {SWEDISH_COUNTIES.map(county => (
                    <SelectItem 
                      key={county.code} 
                      value={county.code}
                      className="hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <span className="flex items-center justify-between w-full">
                        <span>{county.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {eventCountByCounty[county.code] || 0}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCounty && (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {countyEvents.length > 0 ? (
                  <div className="space-y-2">
                    {countyEvents.map((event, idx) => {
                      const { deviation, lat, lon, type } = event;
                      return (
                        <button
                          key={idx}
                          onClick={() => onEventClick(lat, lon)}
                          className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-white/5"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xl flex-shrink-0">
                              {type === 'accident' ? '🚨' : type === 'roadwork' ? '🚧' : type === 'congestion' ? '🚗' : 'ℹ️'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm line-clamp-2 mb-1">
                                {deviation.Header}
                              </p>
                              {deviation.LocationDescriptor && (
                                <p className="text-xs text-gray-400 line-clamp-1">
                                  📍 {deviation.LocationDescriptor}
                                </p>
                              )}
                              {deviation.Severity && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{
                                      background: deviation.Severity === "VeryHigh" ? "#dc2626" :
                                                 deviation.Severity === "High" ? "#ea580c" :
                                                 deviation.Severity === "Medium" ? "#eab308" : "#84cc16"
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">
                                    {deviation.Severity}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {language === "sv" ? "Inga händelser i detta län" : "No events in this county"}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function TrafficMap({ situations, language, isStreaming }: TrafficMapProps) {
  const [mounted, setMounted] = useState(false);
  const [currentTileLayer, setCurrentTileLayer] = useState<"default" | "dark" | "satellite">("dark");
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEventSearchClick = (lat: number, lon: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 14, {
        duration: 2.0,
        easeLinearity: 0.25
      });
    }
  };

  const classifyDeviation = (deviation: any): "accident" | "roadwork" | "congestion" | "other" => {
    const iconId = deviation.IconId?.toLowerCase() || "";
    const header = deviation.Header?.toLowerCase() || "";
    const message = deviation.Message?.toLowerCase() || "";

    if (iconId.includes("accident") || header.includes("olycka") || header.includes("accident")) {
      return "accident";
    }
    
    if (iconId.includes("roadwork") || header.includes("vägarbete") || 
        header.includes("hinder") || header.includes("obstacle") ||
        message.includes("avstängd") || message.includes("closed")) {
      return "roadwork";
    }
    
    if (iconId.includes("congestion") || header.includes("kö") || 
        header.includes("stockning") || header.includes("congestion")) {
      return "congestion";
    }

    return "other";
  };

  const getMarkerIcon = (deviation: any) => {
    const type = classifyDeviation(deviation);
    switch (type) {
      case "accident": return accidentIcon;
      case "roadwork": return roadworkIcon;
      case "congestion": return congestionIcon;
      default: return otherIcon;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "VeryHigh": return "#dc2626";
      case "High": return "#ea580c";
      case "Medium": return "#eab308";
      case "Low": return "#84cc16";
      default: return "#6b7280";
    }
  };

  const parsedSituations = useMemo(() => {
    console.log("\n" + "=".repeat(80));
    console.log("🗺️ TRAFFICMAP: PARSING SITUATIONS");
    console.log("=".repeat(80));
    console.log(`📊 Total situations received: ${situations.length}`);
    
    if (situations.length === 0) {
      return [];
    }
    
    const results = situations
      .map((situation, index) => {
        const deviation = situation.Deviation[0];
        
        // WGS84 format is "lon lat" (longitude first, latitude second)
        const coords = deviation.Geometry!.WGS84!.split(" ");
        const lon = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);

        const result = {
          id: `${deviation.Id || deviation.CreationTime}-${index}`,
          lat,
          lon,
          deviation,
          type: classifyDeviation(deviation),
          icon: getMarkerIcon(deviation)
        };
        
        return result;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    
    console.log(`✅ Parsed ${results.length} situations with valid coordinates`);
    console.log("=".repeat(80) + "\n");
    
    return results;
  }, [situations]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[hsl(24,95%,53%)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const defaultCenter: [number, number] = [62.0, 15.0];
  const defaultZoom = 5;

  const tileLayerUrls = {
    default: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        @keyframes markerPulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), 0 0 0 4px currentColor;
          }
          50% {
            opacity: 0.85;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), 0 0 0 8px transparent;
          }
        }

        @keyframes locationPulse {
          0%, 100% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
          }
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(17, 24, 39, 0.98);
          color: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .leaflet-popup-content {
          margin: 16px;
          min-width: 280px;
          max-width: 400px;
        }
        
        .leaflet-popup-tip {
          background: rgba(17, 24, 39, 0.98);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .leaflet-container {
          background: #1a1a1a;
          font-family: inherit;
        }

        .custom-marker {
          background: transparent !important;
          border: none !important;
        }

        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-white rounded shadow-lg p-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setCurrentTileLayer("default")}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                currentTileLayer === "default" 
                  ? "bg-[hsl(24,95%,53%)] text-white" 
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {language === "sv" ? "Standard" : "Standard"}
            </button>
            <button
              onClick={() => setCurrentTileLayer("dark")}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                currentTileLayer === "dark" 
                  ? "bg-[hsl(24,95%,53%)] text-white" 
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {language === "sv" ? "Mörk" : "Dark"}
            </button>
            <button
              onClick={() => setCurrentTileLayer("satellite")}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                currentTileLayer === "satellite" 
                  ? "bg-[hsl(24,95%,53%)] text-white" 
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {language === "sv" ? "Satellit" : "Satellite"}
            </button>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={true}
        zoomControl={true}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={tileLayerUrls[currentTileLayer]}
        />

        <GeolocationControl language={language} />
        <StatisticsPanel situations={parsedSituations} language={language} />
        <EventSearchPanel 
          situations={parsedSituations} 
          language={language}
          onEventClick={handleEventSearchClick}
        />

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          maxClusterRadius={60}
        >
          {parsedSituations.map((parsed) => {
            const { id, lat, lon, deviation, type, icon } = parsed;
            return (
              <Marker
                key={id}
                position={[lat, lon]}
                icon={icon}
              >
                <Popup maxWidth={400} minWidth={280}>
                  <div className="text-white">
                    <div className="flex items-start gap-3 mb-3 pb-3 border-b border-white/10">
                      <div className="text-2xl">
                        {type === 'accident' ? '🚨' : type === 'roadwork' ? '🚧' : type === 'congestion' ? '🚗' : 'ℹ️'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 leading-tight">{deviation.Header}</h3>
                        {deviation.Severity && (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ background: getSeverityColor(deviation.Severity) }}
                            ></div>
                            <span className="text-xs text-gray-400">
                              {language === "sv" ? "Allvarlighetsgrad:" : "Severity:"} {deviation.Severity}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">{deviation.Message}</p>
                    <div className="space-y-2 text-xs">
                      {deviation.RoadNumber && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <span><strong className="text-white">{language === "sv" ? "Väg:" : "Road:"}</strong> {deviation.RoadNumber}</span>
                        </div>
                      )}
                      {deviation.LocationDescriptor && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <span><strong className="text-white">{language === "sv" ? "Plats:" : "Location:"}</strong> {deviation.LocationDescriptor}</span>
                        </div>
                      )}
                    </div>
                    {isStreaming && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-green-400 font-medium">{language === "sv" ? "Live-streaming" : "Live streaming"}</span>
                        </div>
                      </div>
                    )}
                    <a 
                      href={`https://www.google.com/maps?q=${lat},${lon}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-4 block text-center px-4 py-2 rounded-lg bg-[hsl(24,95%,53%)] text-white text-sm font-medium hover:bg-[hsl(24,95%,45%)] transition-colors"
                    >
                      {language === "sv" ? "Öppna i Google Maps" : "Open in Google Maps"}
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

