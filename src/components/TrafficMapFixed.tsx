"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TrafikverketSituation } from "@/types";
import { getTrafficIcon } from "@/lib/trafficIcons";

// Fix default marker icons (only on client)
if (typeof window !== 'undefined') {
  interface IconDefaultWithPrototype extends L.Icon.Default {
    _getIconUrl?: () => string;
  }
  delete (L.Icon.Default.prototype as IconDefaultWithPrototype)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface TrafficMapFixedProps {
  situations: TrafikverketSituation[];
  language: "sv" | "en";
  isStreaming: boolean;
}

interface ParsedMarker {
  id: string;
  lat: number;
  lon: number;
  header: string;
  message: string;
  severity?: string;
  type: string;
  creationTime: string;
}

export default function TrafficMapFixed({ situations, language, isStreaming }: TrafficMapFixedProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const parsedMarkers = useMemo(() => {
    const markers: ParsedMarker[] = [];
    
    console.log(`🗺️ TrafficMapFixed: Parsing ${situations.length} situations`);
    
    situations.forEach((situation, sitIndex) => {
      // Safety check: ensure Deviation exists and is an array
      if (!situation.Deviation || !Array.isArray(situation.Deviation)) {
        console.warn(`⚠️ Situation ${sitIndex}: No Deviation array`);
        return;
      }

      // Process each deviation in the situation
      situation.Deviation.forEach((deviation, devIndex) => {
        // Safety check: ensure deviation exists
        if (!deviation) {
          console.warn(`⚠️ Situation ${sitIndex}, Deviation ${devIndex}: Null deviation`);
          return;
        }

        // Extract coordinates
        let lat: number | null = null;
        let lon: number | null = null;

        if (deviation.Geometry?.WGS84) {
          // WGS84 format is "POINT (longitude latitude)" in WKT format
          let wgs84 = deviation.Geometry.WGS84.trim();
          
          // Remove "POINT (" and ")" if present
          if (wgs84.startsWith('POINT')) {
            wgs84 = wgs84.replace(/^POINT\s*\(/i, '').replace(/\)$/, '').trim();
          }
          
          // Now split by space to get lon and lat
          const coords = wgs84.split(/\s+/);
          
          if (coords.length >= 2) {
            lon = parseFloat(coords[0]);
            lat = parseFloat(coords[1]);
            
            // Validate coordinates are within Sweden's bounds
            // Sweden: lat 55-69, lon 11-24
            if (isNaN(lat) || isNaN(lon) || lat < 55 || lat > 69 || lon < 11 || lon > 24) {
              if (sitIndex < 3) {
                console.warn(`⚠️ Invalid coordinates for situation ${sitIndex}:`, { lat, lon, wgs84: deviation.Geometry.WGS84 });
              }
              return;
            }
          } else {
            if (sitIndex < 3) {
              console.warn(`⚠️ Invalid WGS84 format for situation ${sitIndex}:`, deviation.Geometry.WGS84);
            }
            return;
          }
        } else {
          // No coordinates available
          if (sitIndex < 3) {
            console.warn(`⚠️ No Geometry.WGS84 for situation ${sitIndex}`);
          }
          return;
        }

        // Classify type based on header/message content
        const header = deviation.Header || "";
        const message = deviation.Message || "";
        const combined = (header + " " + message).toLowerCase();
        
        let type = "other";
        if (combined.includes("olycka") || combined.includes("accident")) {
          type = "accident";
        } else if (combined.includes("vägarbete") || combined.includes("roadwork") || combined.includes("hinder")) {
          type = "roadwork";
        } else if (combined.includes("kö") || combined.includes("trafik") || combined.includes("congestion")) {
          type = "congestion";
        }

        // Create marker
        const marker: ParsedMarker = {
          id: `${deviation.Id || deviation.CreationTime}-${sitIndex}-${devIndex}`,
          lat,
          lon,
          header: deviation.Header || "Ingen rubrik",
          message: deviation.Message || "Ingen beskrivning",
          severity: deviation.Severity,
          type,
          creationTime: deviation.CreationTime
        };

        markers.push(marker);
        
        // Log first few successful parses
        if (markers.length <= 5) {
          console.log(`✅ Marker ${markers.length}:`, { lat, lon, type, header: header.substring(0, 50) });
        }
      });
    });

    console.log(`✅ Successfully parsed ${markers.length} markers from ${situations.length} situations`);
    
    return markers;
  }, [situations]);

  // Show debug info
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const debugDiv = document.createElement('div');
      debugDiv.id = 'traffic-map-fixed-debug';
      debugDiv.style.cssText = `
        position: fixed;
        top: 200px;
        left: 10px;
        background: rgba(0, 200, 0, 0.95);
        color: white;
        padding: 20px;
        border: 3px solid white;
        border-radius: 8px;
        z-index: 99999;
        font-family: monospace;
        font-size: 16px;
        font-weight: bold;
      `;
      
      debugDiv.innerHTML = `
        <div>✅ TrafficMapFixed LOADED!</div>
        <div>📊 Situations: ${situations.length}</div>
        <div>📍 Parsed Markers: ${parsedMarkers.length}</div>
        <div>🌍 Language: ${language}</div>
        <div>📡 Streaming: ${isStreaming ? 'YES' : 'NO'}</div>
      `;
      
      document.body.appendChild(debugDiv);
      
      setTimeout(() => debugDiv.remove(), 15000);
    }
  }, [mounted, situations.length, parsedMarkers.length, language, isStreaming]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
        <div className="text-white text-lg">Laddar karta...</div>
      </div>
    );
  }

  const getMarkerIcon = (type: string) => {
    const iconDataUrl = getTrafficIcon(type);

    return L.icon({
      iconUrl: iconDataUrl,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -16],
      className: 'custom-marker'
    });
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "VeryHigh": return "#dc2626";
      case "High": return "#f97316";
      case "Medium": return "#eab308";
      case "Low": return "#22c55e";
      default: return "#6b7280";
    }
  };

  return (
    <div className="relative w-full h-full">
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 200, 0, 0.9)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        zIndex: 1000,
        fontWeight: 'bold',
        fontSize: '16px'
      }}>
        ✅ FIXED MAP - {parsedMarkers.length} markörer från {situations.length} händelser
      </div>
      
      <MapContainer
        center={[62.0, 15.0]}
        zoom={5}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {parsedMarkers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.lat, marker.lon]}
            icon={getMarkerIcon(marker.type)}
          >
            <Popup maxWidth={400} minWidth={280}>
              <div style={{ color: 'black' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '10px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                    <img src={getTrafficIcon(marker.type)} alt={marker.type} style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>{marker.header}</h3>
                    {marker.severity && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: getSeverityColor(marker.severity) 
                        }}></div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {language === "sv" ? "Allvarlighetsgrad:" : "Severity:"} {marker.severity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>{marker.message}</p>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <div>{language === "sv" ? "Skapad:" : "Created:"} {new Date(marker.creationTime).toLocaleString(language === "sv" ? "sv-SE" : "en-US")}</div>
                </div>
                <a 
                  href={`https://www.google.com/maps?q=${marker.lat},${marker.lon}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    display: 'block',
                    marginTop: '10px',
                    textAlign: 'center',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#f97316',
                    color: 'white',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  {language === "sv" ? "Öppna i Google Maps" : "Open in Google Maps"}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

