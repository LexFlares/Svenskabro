
import { useEffect, useState, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet-draw/dist/leaflet.draw.css";
import type { TrafikverketSituation } from "@/types";
import { AlertTriangle, Clock, MapPin, Navigation, Target, Ruler, Pencil, Maximize2, Minimize2, BarChart3, Layers, Route, Flame, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

function DistanceMeasurementTool({ 
  isActive, 
  onToggle, 
  language 
}: { 
  isActive: boolean; 
  onToggle: () => void;
  language: "sv" | "en";
}) {
  const map = useMap();
  const [points, setPoints] = useState<[number, number][]>([]);
  const [totalDistance, setTotalDistance] = useState(0);

  useMapEvents({
    click(e) {
      if (!isActive) return;
      
      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      const newPoints = [...points, newPoint];
      setPoints(newPoints);

      if (newPoints.length >= 2) {
        let distance = 0;
        for (let i = 0; i < newPoints.length - 1; i++) {
          const p1 = L.latLng(newPoints[i]);
          const p2 = L.latLng(newPoints[i + 1]);
          distance += p1.distanceTo(p2);
        }
        setTotalDistance(distance / 1000);
      }
    }
  });

  useEffect(() => {
    if (!isActive) {
      setPoints([]);
      setTotalDistance(0);
    }
  }, [isActive]);

  return (
    <>
      {points.length > 0 && (
        <>
          <Polyline positions={points} color="#3b82f6" weight={3} dashArray="5, 10" />
          {points.map((point, idx) => (
            <Circle
              key={idx}
              center={point}
              radius={50}
              fillColor="#3b82f6"
              fillOpacity={0.8}
              stroke={false}
            />
          ))}
          {totalDistance > 0 && (
            <div className="leaflet-control" style={{ 
              position: "absolute", 
              bottom: "20px", 
              left: "50%", 
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(17, 24, 39, 0.95)",
              padding: "12px 20px",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              {language === "sv" ? "Avstånd:" : "Distance:"} {totalDistance.toFixed(2)} km
            </div>
          )}
        </>
      )}
    </>
  );
}

function GeolocationControl({ language }: { language: "sv" | "en" }) {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation([lat, lon]);
        map.flyTo([lat, lon], 12, {
          duration: 1.5,
          easeLinearity: 0.25
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(language === "sv" ? "Kunde inte hitta din plats" : "Could not find your location");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <>
      <div className="leaflet-top leaflet-right" style={{ marginTop: "80px", marginRight: "10px" }}>
        <div className="leaflet-control leaflet-bar">
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

function StatisticsPanel({ 
  situations, 
  language 
}: { 
  situations: any[]; 
  language: "sv" | "en";
}) {
  const [isOpen, setIsOpen] = useState(false);

  const stats = useMemo(() => {
    const counts = {
      accident: 0,
      roadwork: 0,
      congestion: 0,
      other: 0
    };

    situations.forEach(s => {
      const type = s.type;
      counts[type as keyof typeof counts]++;
    });

    return counts;
  }, [situations]);

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "80px", marginLeft: "10px" }}>
      <Card className="bg-gray-900/95 border-white/10 text-white shadow-xl">
        <div className="p-3">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="ghost"
            size="sm"
            className="w-full justify-between hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <BarChart3 size={16} />
              {language === "sv" ? "Statistik" : "Statistics"}
            </span>
            <Badge variant="secondary">{situations.length}</Badge>
          </Button>
          
          {isOpen && (
            <div className="mt-3 space-y-2 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  🚨 {language === "sv" ? "Olyckor" : "Accidents"}
                </span>
                <Badge variant="destructive">{stats.accident}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  🚧 {language === "sv" ? "Hinder" : "Obstacles"}
                </span>
                <Badge className="bg-yellow-600">{stats.roadwork}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  🚗 {language === "sv" ? "Stockning" : "Congestion"}
                </span>
                <Badge className="bg-blue-600">{stats.congestion}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  ℹ️ {language === "sv" ? "Övrigt" : "Other"}
                </span>
                <Badge variant="secondary">{stats.other}</Badge>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function MapController({ situations }: { situations: TrafikverketSituation[] }) {
  const map = useMap();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Only attempt to fit bounds if we have situations AND haven't initialized yet
    if (situations.length === 0 || hasInitialized) {
      return;
    }

    console.log(`\n🗺️ MapController: Processing ${situations.length} situations for fitBounds`);

    // Create bounds array with explicit NaN filtering
    const validBounds: [number, number][] = [];
    
    situations.forEach((situation, idx) => {
      try {
        const coords = situation.Deviation[0].Geometry!.WGS84!.split(" ");
        const lon = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);
        
        // Explicitly check for NaN
        if (!isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon)) {
          validBounds.push([lat, lon]);
        } else {
          console.warn(`⚠️ MapController: Invalid coordinates at index ${idx}:`, { lat, lon, raw: coords });
        }
      } catch (error) {
        console.error(`❌ MapController: Failed to parse coordinates at index ${idx}:`, error);
      }
    });

    console.log(`✅ MapController: ${validBounds.length}/${situations.length} situations have valid coordinates`);

    if (validBounds.length === 0) {
      console.warn("⚠️ MapController: No valid coordinates to fit bounds");
      setHasInitialized(true); // Mark as initialized even if no valid coords
      return;
    }

    console.log(`🗺️ MapController: Fitting bounds to ${validBounds.length} locations`);
    console.log(`   First 3 bounds:`, validBounds.slice(0, 3));
    
    try {
      map.fitBounds(validBounds, { 
        padding: [60, 60], 
        maxZoom: 11,
        animate: true,
        duration: 1.5
      });
      setHasInitialized(true);
      console.log("✅ MapController: Successfully fitted bounds");
    } catch (error) {
      console.error("❌ MapController: fitBounds error:", error);
      console.error("   Valid bounds (first 3):", validBounds.slice(0, 3));
      console.error("   Total valid bounds:", validBounds.length);
      // Mark as initialized even on error to prevent infinite retries
      setHasInitialized(true);
    }
  }, [situations, map, hasInitialized]);

  return null;
}

function HeatmapLayer({ situations, isActive }: { situations: any[]; isActive: boolean }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive || !map || !window.L) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    const accidentPoints = situations
      .filter(s => s.type === "accident")
      .map(s => [s.lat, s.lon, 0.8]);

    if (accidentPoints.length > 0 && (window.L as any).heatLayer) {
      heatLayerRef.current = (window.L as any).heatLayer(accidentPoints, {
        radius: 25,
        blur: 35,
        maxZoom: 13,
        gradient: {
          0.0: '#0000ff',
          0.2: '#00ffff', 
          0.4: '#00ff00',
          0.6: '#ffff00',
          0.8: '#ff9900',
          1.0: '#ff0000'
        }
      }).addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, situations, isActive]);

  return null;
}

function MarkerClusterLayer({ situations, language, isStreaming, onMarkerClick, getSeverityColor }: { 
  situations: any[];
  language: "sv" | "en";
  isStreaming: boolean;
  onMarkerClick: (id: string) => void;
  getSeverityColor: (severity?: string) => string;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    console.log("=== MarkerClusterLayer useEffect ===");
    console.log("1. map exists:", !!map);
    console.log("2. window.L exists:", !!window.L);
    console.log("3. markerClusterGroup exists:", !!(window.L as any)?.markerClusterGroup);
    console.log("4. situations count:", situations.length);
    
    if (!map || !window.L || !(window.L as any).markerClusterGroup) {
      console.warn("⚠️ MarkerClusterLayer: Missing dependencies, skipping render");
      return;
    }

    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    clusterGroupRef.current = (window.L as any).markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        let size = 'small';
        let color = '#3b82f6';
        
        if (count > 50) {
          size = 'large';
          color = '#ef4444';
        } else if (count > 20) {
          size = 'medium';
          color = '#eab308';
        }

        return L.divIcon({
          html: `<div style="
            background: ${color};
            width: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '30px'};
            height: ${size === 'large' ? '50px' : size === 'medium' ? '40px' : '30px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size === 'large' ? '16px' : size === 'medium' ? '14px' : '12px'};
            border: 3px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: 'marker-cluster',
          iconSize: L.point(size === 'large' ? 50 : size === 'medium' ? 40 : 30, size === 'large' ? 50 : size === 'medium' ? 40 : 30)
        });
      }
    });

    situations.forEach(parsed => {
      const { id, lat, lon, deviation, type, icon } = parsed;
      const marker = L.marker([lat, lon], { icon });
      
      marker.bindPopup(`
        <div class="text-white">
          <div class="flex items-start gap-3 mb-3 pb-3 border-b border-white/10">
            <div class="text-2xl">${type === 'accident' ? '🚨' : type === 'roadwork' ? '🚧' : type === 'congestion' ? '🚗' : 'ℹ️'}</div>
            <div class="flex-1">
              <h3 class="font-bold text-lg mb-1 leading-tight">${deviation.Header}</h3>
              ${deviation.Severity ? `
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" style="background: ${getSeverityColor(deviation.Severity)}"></div>
                  <span class="text-xs text-gray-400">${language === "sv" ? "Allvarlighetsgrad:" : "Severity:"} ${deviation.Severity}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <p class="text-sm text-gray-300 mb-4 leading-relaxed">${deviation.Message}</p>
          <div class="space-y-2 text-xs">
            ${deviation.RoadNumber ? `
              <div class="flex items-center gap-2 text-gray-400">
                <span><strong class="text-white">${language === "sv" ? "Väg:" : "Road:"}</strong> ${deviation.RoadNumber}</span>
              </div>
            ` : ''}
            ${deviation.LocationDescriptor ? `
              <div class="flex items-center gap-2 text-gray-400">
                <span><strong class="text-white">${language === "sv" ? "Plats:" : "Location:"}</strong> ${deviation.LocationDescriptor}</span>
              </div>
            ` : ''}
          </div>
          ${isStreaming ? `
            <div class="mt-4 pt-3 border-t border-white/10">
              <div class="flex items-center gap-2 text-xs">
                <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span class="text-green-400 font-medium">${language === "sv" ? "Live-streaming" : "Live streaming"}</span>
              </div>
            </div>
          ` : ''}
          <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" rel="noopener noreferrer" class="mt-4 block text-center px-4 py-2 rounded-lg bg-[hsl(24,95%,53%)] text-white text-sm font-medium hover:bg-[hsl(24,95%,45%)] transition-colors">
            ${language === "sv" ? "Öppna i Google Maps" : "Open in Google Maps"}
          </a>
        </div>
      `, { maxWidth: 400, minWidth: 280, className: 'custom-traffic-popup' });

      clusterGroupRef.current.addLayer(marker);
    });

    map.addLayer(clusterGroupRef.current);

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, situations, language, isStreaming, getSeverityColor]);

  return null;
}

function SearchControl({ 
  situations, 
  language,
  onResultClick 
}: { 
  situations: any[];
  language: "sv" | "en";
  onResultClick: (lat: number, lon: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = situations.filter(s => {
      const deviation = s.deviation;
      return (
        deviation.Header?.toLowerCase().includes(query) ||
        deviation.Message?.toLowerCase().includes(query) ||
        deviation.LocationDescriptor?.toLowerCase().includes(query) ||
        deviation.RoadNumber?.toLowerCase().includes(query)
      );
    });

    setSearchResults(results.slice(0, 5));
  }, [searchQuery, situations]);

  return (
    <div className="leaflet-bottom leaflet-left" style={{ marginBottom: "20px", marginLeft: "10px", zIndex: 1000 }}>
      <Card className="bg-gray-900/95 border-white/10 text-white shadow-xl" style={{ minWidth: "300px", maxWidth: "400px" }}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <Input
              type="text"
              placeholder={language === "sv" ? "Sök händelse..." : "Search event..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              className="flex-1 bg-gray-800 border-gray-700 text-white text-sm"
              style={{ minHeight: "36px" }}
            />
            {searchQuery && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsOpen(false);
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          {isOpen && searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onResultClick(result.lat, result.lon);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">
                      {result.type === 'accident' ? '🚨' : result.type === 'roadwork' ? '🚧' : result.type === 'congestion' ? '🚗' : 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white line-clamp-1">
                        {result.deviation.Header}
                      </p>
                      {result.deviation.LocationDescriptor && (
                        <p className="text-xs text-gray-400 line-clamp-1">
                          {result.deviation.LocationDescriptor}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              {language === "sv" ? "Inga resultat" : "No results"}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

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
              style={{ pointerEvents: "auto" }}
            >
              {isOpen ? <X size={18} /> : <Search size={18} />}
            </Button>
          </div>
        </CardHeader>
        
        {isOpen && (
          <CardContent className="p-4 pt-0 space-y-3" style={{ pointerEvents: "auto" }}>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-400">
                    {language === "sv" ? "Händelser" : "Events"}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {countyEvents.length}
                  </Badge>
                </div>
                
                {countyEvents.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {countyEvents.map((event, idx) => {
                      const deviation = event.deviation;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            onEventClick(event.lat, event.lon);
                            setIsOpen(false);
                          }}
                          className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors border border-gray-700/50 hover:border-[hsl(24,95%,53%)]/50"
                          style={{ pointerEvents: "auto" }}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xl flex-shrink-0 mt-0.5">
                              {event.type === 'accident' ? '🚨' : 
                               event.type === 'roadwork' ? '🚧' : 
                               event.type === 'congestion' ? '🚗' : 'ℹ️'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm line-clamp-2 mb-1">
                                {deviation.Header}
                              </p>
                              {deviation.LocationDescriptor && (
                                <p className="text-xs text-gray-400 line-clamp-1 mb-1">
                                  <MapPin size={10} className="inline mr-1" />
                                  {deviation.LocationDescriptor}
                                </p>
                              )}
                              {deviation.Severity && (
                                <div className="flex items-center gap-1.5 mt-1.5">
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
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [currentTileLayer, setCurrentTileLayer] = useState<"default" | "dark" | "satellite">("dark");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!isFullscreen) {
      if (mapContainerRef.current.requestFullscreen) {
        mapContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleSearchResultClick = (lat: number, lon: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 13, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  };

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

  const parsedSituations = useMemo(() => {
    console.log("\n" + "=".repeat(80));
    console.log("🗺️ TRAFFICMAP: PARSING SITUATIONS FOR DISPLAY (SIMPLIFIED)");
    console.log("=".repeat(80));
    console.log(`📊 Total situations received: ${situations.length}`);
    
    if (situations.length === 0) {
      return [];
    }
    
    // OPTIMIZATION: trafikverketService now guarantees all situations have valid coordinates
    // We can trust the data and skip redundant validation here
    const results = situations
      .map((situation, index) => {
        const deviation = situation.Deviation[0];
        
        // STEP 1: SIMPLE EXTRACTION (trust trafikverketService validation)
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
    
    console.log("\n" + "=".repeat(80));
    console.log(`📊 PARSING COMPLETE:`);
    console.log(`   Input: ${situations.length} situations`);
    console.log(`   Output: ${results.length} parsed situations`);
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

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "VeryHigh": return "#dc2626";
      case "High": return "#ea580c";
      case "Medium": return "#eab308";
      case "Low": return "#84cc16";
      default: return "#6b7280";
    }
  };

  const tileLayerUrls = {
    default: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
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
        <Button
          onClick={toggleFullscreen}
          size="icon"
          className="w-10 h-10 bg-white hover:bg-gray-100 text-gray-900 rounded shadow-lg"
          title={isFullscreen ? (language === "sv" ? "Stäng helskärm" : "Exit fullscreen") : (language === "sv" ? "Helskärm" : "Fullscreen")}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </Button>

        <Button
          onClick={() => setClusteringEnabled(!clusteringEnabled)}
          size="icon"
          className={`w-10 h-10 rounded shadow-lg ${
            clusteringEnabled 
              ? "bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)] text-white" 
              : "bg-white hover:bg-gray-100 text-gray-900"
          }`}
          title={language === "sv" ? "Gruppera markörer" : "Cluster markers"}
        >
          <Layers size={20} />
        </Button>

        <Button
          onClick={() => {
            setShowHeatmap(!showHeatmap);
            if (!showHeatmap) {
              setClusteringEnabled(false);
            }
          }}
          size="icon"
          className={`w-10 h-10 rounded shadow-lg ${
            showHeatmap 
              ? "bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)] text-white" 
              : "bg-white hover:bg-gray-100 text-gray-900"
          }`}
          title={language === "sv" ? "Värmekarteläge" : "Heatmap layer"}
        >
          <Flame size={20} />
        </Button>

        <Button
          onClick={() => setIsMeasuring(!isMeasuring)}
          size="icon"
          className={`w-10 h-10 rounded shadow-lg ${
            isMeasuring 
              ? "bg-[hsl(24,95%,53%)] hover:bg-[hsl(24,95%,45%)] text-white" 
              : "bg-white hover:bg-gray-100 text-gray-900"
          }`}
          title={language === "sv" ? "Mät avstånd" : "Measure distance"}
        >
          <Ruler size={20} />
        </Button>

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
              {language === "sv" ? "Standard" : "Default"}
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

        <MapController situations={situations} />
        <GeolocationControl language={language} />
        <DistanceMeasurementTool 
          isActive={isMeasuring} 
          onToggle={() => setIsMeasuring(!isMeasuring)}
          language={language}
        />
        <HeatmapLayer situations={parsedSituations} isActive={showHeatmap} />
        <StatisticsPanel situations={parsedSituations} language={language} />
        <SearchControl 
          situations={parsedSituations} 
          language={language}
          onResultClick={handleSearchResultClick}
        />
        <EventSearchPanel 
          situations={parsedSituations} 
          language={language}
          onEventClick={handleEventSearchClick}
        />

        {clusteringEnabled && !showHeatmap ? (
          <MarkerClusterLayer 
            situations={parsedSituations}
            language={language}
            isStreaming={isStreaming}
            onMarkerClick={setSelectedMarker}
            getSeverityColor={getSeverityColor}
          />
        ) : !showHeatmap && parsedSituations.map((parsed) => {
          const { id, lat, lon, deviation, type, icon } = parsed;
          return (
            <Marker
              key={id}
              position={[lat, lon]}
              icon={icon}
              eventHandlers={{
                click: () => setSelectedMarker(id),
              }}
            >
              <Popup maxWidth={400} minWidth={280} className="custom-traffic-popup">
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
                        <Navigation size={14} className="text-[hsl(24,95%,53%)]" />
                        <span><strong className="text-white">{language === "sv" ? "Väg:" : "Road:"}</strong> {deviation.RoadNumber}</span>
                      </div>
                    )}
                    {deviation.LocationDescriptor && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={14} className="text-[hsl(24,95%,53%)]" />
                        <span><strong className="text-white">{language === "sv" ? "Plats:" : "Location:"}</strong> {deviation.LocationDescriptor}</span>
                      </div>
                    )}
                    {deviation.StartTime && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} className="text-[hsl(24,95%,53%)]" />
                        <span><strong className="text-white">{language === "sv" ? "Start:" : "Start:"}</strong> {new Date(deviation.StartTime).toLocaleString(language === "sv" ? "sv-SE" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
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
                  <a href={`https://www.google.com/maps?q=${lat},${lon}`} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center px-4 py-2 rounded-lg bg-[hsl(24,95%,53%)] text-white text-sm font-medium hover:bg-[hsl(24,95%,45%)] transition-colors">
                    {language === "sv" ? "Öppna i Google Maps" : "Open in Google Maps"}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
