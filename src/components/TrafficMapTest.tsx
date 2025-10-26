"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (only on client)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface TrafficMapTestProps {
  situations: any[];
  language: "sv" | "en";
  isStreaming: boolean;
}

export default function TrafficMapTest({ situations, language, isStreaming }: TrafficMapTestProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Create visible debug info
    const debugDiv = document.createElement('div');
    debugDiv.id = 'traffic-map-test-debug';
    debugDiv.style.cssText = `
      position: fixed;
      top: 200px;
      left: 10px;
      background: rgba(0, 255, 0, 0.9);
      color: black;
      padding: 20px;
      border: 3px solid black;
      border-radius: 8px;
      z-index: 99999;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
    `;
    
    debugDiv.innerHTML = `
      <div>✅ TrafficMapTest LOADED!</div>
      <div>📊 Situations received: ${situations.length}</div>
      <div>🌍 Language: ${language}</div>
      <div>📡 Streaming: ${isStreaming ? 'YES' : 'NO'}</div>
      ${situations[0] ? `<div>📋 First item has Deviation: ${situations[0].Deviation ? 'YES' : 'NO'}</div>` : ''}
    `;
    
    document.body.appendChild(debugDiv);
    
    return () => {
      debugDiv.remove();
    };
  }, [situations, language, isStreaming]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
        <div className="text-white text-2xl">Loading map...</div>
      </div>
    );
  }

  // Test markers - hardcoded Swedish locations
  const testMarkers = [
    { lat: 59.3293, lon: 18.0686, name: "Stockholm" },
    { lat: 57.7089, lon: 11.9746, name: "Göteborg" },
    { lat: 55.6050, lon: 13.0038, name: "Malmö" },
  ];

  return (
    <div className="relative w-full h-full">
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 0, 0.9)',
        color: 'black',
        padding: '10px 20px',
        borderRadius: '8px',
        zIndex: 1000,
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        🧪 TEST MAP - {situations.length} situations - {testMarkers.length} test markers
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

        {/* Render test markers */}
        {testMarkers.map((marker, idx) => (
          <Marker key={idx} position={[marker.lat, marker.lon]}>
            <Popup>
              <div style={{ color: 'black', fontWeight: 'bold' }}>
                <h3>{marker.name}</h3>
                <p>Test Marker {idx + 1}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

