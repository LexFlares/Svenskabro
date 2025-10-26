// Professional traffic icons matching Trafikverket's official style
// SVG icons as data URLs for use in Leaflet markers

export const TrafficIcons = {
  // Accident - Red circle with exclamation
  accident: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#DC2626" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="12" fill="#DC2626"/>
      <text x="16" y="22" font-family="Arial" font-size="18" font-weight="bold" fill="white" text-anchor="middle">!</text>
    </svg>
  `)}`,

  // Roadwork - Orange triangle with construction symbol
  roadwork: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M 16 4 L 28 26 L 4 26 Z" fill="#F97316" stroke="white" stroke-width="2"/>
      <path d="M 16 6 L 26 24 L 6 24 Z" fill="#F97316"/>
      <rect x="14" y="12" width="4" height="8" fill="white"/>
      <rect x="12" y="20" width="8" height="2" fill="white"/>
    </svg>
  `)}`,

  // Road closed - Red octagon (stop sign style)
  roadClosed: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 4 L 22 4 L 28 10 L 28 22 L 22 28 L 10 28 L 4 22 L 4 10 Z" fill="#DC2626" stroke="white" stroke-width="2"/>
      <rect x="8" y="14" width="16" height="4" fill="white"/>
    </svg>
  `)}`,

  // Traffic jam - Orange circle with queue symbol
  congestion: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#F59E0B" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="12" fill="#F59E0B"/>
      <rect x="10" y="10" width="4" height="6" fill="white" rx="1"/>
      <rect x="14" y="12" width="4" height="6" fill="white" rx="1"/>
      <rect x="18" y="14" width="4" height="6" fill="white" rx="1"/>
    </svg>
  `)}`,

  // Weather warning - Yellow triangle with snowflake/rain
  weather: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M 16 4 L 28 26 L 4 26 Z" fill="#EAB308" stroke="white" stroke-width="2"/>
      <path d="M 16 6 L 26 24 L 6 24 Z" fill="#EAB308"/>
      <text x="16" y="21" font-family="Arial" font-size="14" font-weight="bold" fill="white" text-anchor="middle">❄</text>
    </svg>
  `)}`,

  // Information - Blue circle with 'i'
  information: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="12" fill="#3B82F6"/>
      <text x="16" y="22" font-family="Arial" font-size="16" font-weight="bold" fill="white" text-anchor="middle">i</text>
    </svg>
  `)}`,

  // Bridge opening - Purple circle with bridge symbol
  bridgeOpening: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#8B5CF6" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="12" fill="#8B5CF6"/>
      <path d="M 8 18 L 8 14 L 12 14 L 12 18 M 20 18 L 20 14 L 24 14 L 24 18 M 8 18 Q 16 12 24 18" stroke="white" stroke-width="2" fill="none"/>
    </svg>
  `)}`,

  // Other/Default - Gray circle
  other: `data:image/svg+xml;base64,${btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#6B7280" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="16" r="12" fill="#6B7280"/>
      <circle cx="16" cy="16" r="4" fill="white"/>
    </svg>
  `)}`,
};

// Function to get the appropriate icon based on deviation type
export function getTrafficIcon(deviationType: string): string {
  const type = deviationType.toLowerCase();
  
  if (type.includes('accident') || type.includes('olycka')) {
    return TrafficIcons.accident;
  }
  
  if (type.includes('roadwork') || type.includes('vägarbete') || type.includes('arbete')) {
    return TrafficIcons.roadwork;
  }
  
  if (type.includes('closed') || type.includes('avstängd') || type.includes('stängd')) {
    return TrafficIcons.roadClosed;
  }
  
  if (type.includes('congestion') || type.includes('kö') || type.includes('traffic')) {
    return TrafficIcons.congestion;
  }
  
  if (type.includes('weather') || type.includes('väder') || type.includes('snow') || type.includes('ice')) {
    return TrafficIcons.weather;
  }
  
  if (type.includes('bridge') || type.includes('bro')) {
    return TrafficIcons.bridgeOpening;
  }
  
  if (type.includes('information') || type.includes('info')) {
    return TrafficIcons.information;
  }
  
  return TrafficIcons.other;
}

// Get icon color for styling
export function getIconColor(deviationType: string): string {
  const type = deviationType.toLowerCase();
  
  if (type.includes('accident') || type.includes('olycka')) {
    return '#DC2626'; // Red
  }
  
  if (type.includes('roadwork') || type.includes('vägarbete')) {
    return '#F97316'; // Orange
  }
  
  if (type.includes('closed') || type.includes('avstängd')) {
    return '#DC2626'; // Red
  }
  
  if (type.includes('congestion') || type.includes('kö')) {
    return '#F59E0B'; // Amber
  }
  
  if (type.includes('weather') || type.includes('väder')) {
    return '#EAB308'; // Yellow
  }
  
  if (type.includes('bridge') || type.includes('bro')) {
    return '#8B5CF6'; // Purple
  }
  
  if (type.includes('information') || type.includes('info')) {
    return '#3B82F6'; // Blue
  }
  
  return '#6B7280'; // Gray
}

