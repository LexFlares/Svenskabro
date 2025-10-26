'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  incidents: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    severity: string;
  }>;
}

export function EnhancedMap({ incidents }: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div>Laddar karta...</div>;

  return (
    <MapContainer
      center={[59.3293, 18.0686]}
      zoom={10}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {incidents.map(incident => (
        <Marker key={incident.id} position={[incident.lat, incident.lng]}>
          <Popup>{incident.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}