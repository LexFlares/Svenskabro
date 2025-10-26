import type { TrafikverketSituation, DeviationData } from "@/types";
import { pushNotifications } from "@/lib/pushNotifications";
import { trafikverketStreaming } from "@/lib/trafikverketStreaming";

const TRAFIKVERKET_API_KEY = "a3733860138e455c9b0f3af5da10c109";
const TRAFIKVERKET_API_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";

// Add XML parser utility
function parseCoordinatesFromXML(coordElement: Element): { lat: number; lon: number } | null {
  try {
    const latElement = coordElement.querySelector('latitude');
    const lonElement = coordElement.querySelector('longitude');
    
    if (!latElement || !lonElement) return null;
    
    const lat = parseFloat(latElement.textContent || '');
    const lon = parseFloat(lonElement.textContent || '');
    
    if (isNaN(lat) || isNaN(lon)) return null;
    
    return { lat, lon };
  } catch (error) {
    return null;
  }
}

function parseDeviation(situationRecord: Element, situationId: string): DeviationData | null {
  try {
    console.log(`\n🔍 Parsing deviation for situation: ${situationId}`);
    
    // Helper function to get text content from element with namespace fallback
    const getElementText = (selector: string): string | null => {
      // Try with namespace first (sit:, loc:, com:)
      const elements = situationRecord.querySelectorAll(selector);
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          const text = elements[i].textContent?.trim();
          if (text) return text;
        }
      }
      return null;
    };

    // Extract severity - DATEX II v3 uses lowercase: low, medium, high, highest
    const severityText = getElementText('severity, sit\\:severity')?.toLowerCase() || '';
    let severity: "Low" | "Medium" | "High" | "VeryHigh" | undefined = undefined;
    
    if (severityText) {
      switch (severityText) {
        case 'lowest':
        case 'low':
          severity = 'Low';
          break;
        case 'medium':
          severity = 'Medium';
          break;
        case 'high':
          severity = 'High';
          break;
        case 'highest':
        case 'veryhigh':
          severity = 'VeryHigh';
          break;
      }
    }
    
    // Get creation time
    const creationTime = getElementText('situationRecordCreationTime, sit\\:situationRecordCreationTime') || new Date().toISOString();
    
    // Get description from generalPublicComment -> comment -> values -> value
    // Path: sit:generalPublicComment/sit:comment/com:values/com:value
    const commentValueElement = situationRecord.querySelector('generalPublicComment comment values value, sit\\:generalPublicComment sit\\:comment com\\:values com\\:value');
    const message = commentValueElement?.textContent?.trim() || 'No description';
    
    console.log(`   📝 Message: ${message.substring(0, 100)}...`);
    
    // Get location description
    // Path: loc:supplementaryPositionalDescription/loc:locationDescription/com:values/com:value
    const locationDescElement = situationRecord.querySelector('supplementaryPositionalDescription locationDescription values value, loc\\:supplementaryPositionalDescription loc\\:locationDescription com\\:values com\\:value');
    const locationDescriptor = locationDescElement?.textContent?.trim();
    
    // CRITICAL FIX: Extract coordinates from coordinatesForDisplay (DATEX II v3 format)
    const latElement = situationRecord.querySelector('coordinatesForDisplay latitude, loc\\:coordinatesForDisplay loc\\:latitude');
    const lonElement = situationRecord.querySelector('coordinatesForDisplay longitude, loc\\:coordinatesForDisplay loc\\:longitude');
    
    console.log(`   🔍 Looking for coordinates...`);
    console.log(`      Lat element found: ${!!latElement}`);
    console.log(`      Lon element found: ${!!lonElement}`);
    
    if (latElement) {
      console.log(`      Lat text: "${latElement.textContent}"`);
    }
    if (lonElement) {
      console.log(`      Lon text: "${lonElement.textContent}"`);
    }
    
    const lat = latElement?.textContent ? parseFloat(latElement.textContent.trim()) : null;
    const lon = lonElement?.textContent ? parseFloat(lonElement.textContent.trim()) : null;
    
    console.log(`   📍 Parsed coordinates: lat=${lat}, lon=${lon}`);
    
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      console.warn(`⚠️ No valid coordinates for situation ${situationId}:`, { lat, lon });
      console.warn(`   ℹ️ This situation will NOT appear on the map`);
      return null;
    }
    
    // CRITICAL FIX: Validate coordinates are in Sweden range (lat: 55-70, lon: 10-25)
    if (lat < 55 || lat > 70 || lon < 10 || lon > 25) {
      console.warn(`⚠️ Coordinates out of Sweden range for ${situationId}:`, { lat, lon });
      return null;
    }
    
    console.log(`   ✅ Valid coordinates: ${lat}, ${lon}`);
    
    // Extract road information
    // Path: loc:roadInformation/loc:roadNumber
    const roadNumberElement = situationRecord.querySelector('roadInformation roadNumber, loc\\:roadInformation loc\\:roadNumber');
    const roadNumber = roadNumberElement?.textContent?.trim();
    
    // Extract county code (subdivisionCode)
    // Path: loc:namedArea/loc:subdivisionCode
    const subdivisionCodeElement = situationRecord.querySelector('namedArea subdivisionCode, loc\\:namedArea loc\\:subdivisionCode');
    const countyCodeText = subdivisionCodeElement?.textContent?.trim();
    const countyCode = countyCodeText ? parseInt(countyCodeText, 10) : undefined;
    
    // Determine icon/type from situationRecord xsi:type attribute
    const recordType = situationRecord.getAttribute('xsi:type') || '';
    let iconId = 'other';
    
    // Map DATEX II v3 situation types to our internal types
    if (recordType.includes('Accident') || recordType.includes('VehicleObstruction')) {
      iconId = 'accident';
    } else if (recordType.includes('Obstruction') || recordType.includes('RoadConditions') || recordType.includes('RoadWork')) {
      iconId = 'roadwork';
    } else if (recordType.includes('Congestion') || recordType.includes('SlowTraffic')) {
      iconId = 'congestion';
    } else if (recordType.includes('PublicEvent')) {
      iconId = 'roadwork'; // Treat public events as roadwork/obstacles
    } else if (recordType.includes('EquipmentOrSystemFault')) {
      iconId = 'roadwork'; // Traffic signal issues etc.
    } else if (recordType.includes('NonWeatherRelatedRoadConditions')) {
      iconId = 'roadwork'; // Poor road surface conditions
    }
    
    // Create header from first 100 chars of message
    const header = message.length > 100 ? message.substring(0, 100) + '...' : message;
    
    const result = {
      Id: situationId,
      CreationTime: creationTime,
      Message: message,
      Severity: severity,
      IconId: iconId,
      Header: header,
      Geometry: {
        WGS84: `${lon} ${lat}` // Lon first, then lat (standard WGS84 format)
      },
      LocationDescriptor: locationDescriptor,
      RoadNumber: roadNumber,
      CountyNo: countyCode !== undefined && !isNaN(countyCode) ? [countyCode] : undefined,
      StartTime: creationTime,
      EndTime: undefined,
      AffectedDirection: undefined,
      TemporaryLimit: undefined
    };
    
    console.log(`✅ Successfully parsed deviation:`, {
      id: situationId,
      coordinates: `${lat}, ${lon}`,
      severity,
      type: iconId,
      header: header.substring(0, 50) + '...'
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error parsing deviation from DATEX II v3 XML:', error);
    console.error('📋 Situation ID:', situationId);
    console.error('📋 Record type:', situationRecord.getAttribute('xsi:type'));
    return null;
  }
}

function parseXMLSituations(xmlText: string): TrafikverketSituation[] {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 PARSING DATEX II XML");
    console.log("=".repeat(80));
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return [];
    }
    
    // Try to find situations in DATEX II format (with or without namespace)
    let situations = xmlDoc.querySelectorAll('situation, sit\\:situation');
    
    console.log(`📦 Found ${situations.length} situation elements in XML`);
    
    // If no DATEX II situations found, try JSON-style XML format
    if (situations.length === 0) {
      console.log("📋 No DATEX II situations found, checking for JSON-style XML...");
      situations = xmlDoc.querySelectorAll('RESPONSE > RESULT > Situation');
      
      if (situations.length > 0) {
        console.log(`📦 Found ${situations.length} situations in JSON-style XML format`);
        return parseJSONStyleXML(xmlDoc);
      }
    }
    
    const result: TrafikverketSituation[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    situations.forEach((situation, index) => {
      const situationId = situation.getAttribute('id') || `situation_${index}`;
      console.log(`\n📍 Processing situation ${index + 1}/${situations.length}: ${situationId}`);
      
      // Get all situationRecord elements (with or without namespace)
      const situationRecords = situation.querySelectorAll('situationRecord, sit\\:situationRecord');
      console.log(`   Found ${situationRecords.length} situation records`);
      
      situationRecords.forEach((record, recordIndex) => {
        console.log(`\n   🔹 Processing record ${recordIndex + 1}/${situationRecords.length}`);
        const deviation = parseDeviation(record, `${situationId}_${recordIndex}`);
        
        if (deviation) {
          result.push({
            Deviation: [deviation]
          });
          successCount++;
          console.log(`   ✅ Successfully added to results (total: ${successCount})`);
        } else {
          failureCount++;
          console.log(`   ❌ Failed to parse - no valid coordinates (failures: ${failureCount})`);
        }
      });
    });
    
    console.log("\n" + "=".repeat(80));
    console.log(`📊 PARSING RESULTS:`);
    console.log(`   ✅ Success: ${successCount} situations`);
    console.log(`   ❌ Failed: ${failureCount} situations (no valid coordinates)`);
    console.log(`   📍 Total situations on map: ${result.length}`);
    console.log("=".repeat(80) + "\n");
    
    return result;
  } catch (error) {
    console.error('Failed to parse DATEX II XML:', error);
    return [];
  }
}

function parseJSONStyleXML(xmlDoc: Document): TrafikverketSituation[] {
  try {
    const situationElements = xmlDoc.querySelectorAll('Situation');
    const result: TrafikverketSituation[] = [];
    
    situationElements.forEach((situation) => {
      const deviations: DeviationData[] = [];
      
      const deviationElements = situation.querySelectorAll('Deviation');
      deviationElements.forEach((deviationEl) => {
        const deviation: Partial<DeviationData> = {};
        
        // Parse all child elements
        Array.from(deviationEl.children).forEach((child) => {
          const tagName = child.tagName;
          const textContent = child.textContent || '';
          
          switch (tagName) {
            case 'Id':
              deviation.Id = textContent;
              break;
            case 'CreationTime':
              deviation.CreationTime = textContent;
              break;
            case 'Message':
              deviation.Message = textContent;
              break;
            case 'Header':
              deviation.Header = textContent;
              break;
            case 'Severity':
              deviation.Severity = textContent as any;
              break;
            case 'IconId':
              deviation.IconId = textContent;
              break;
            case 'LocationDescriptor':
              deviation.LocationDescriptor = textContent;
              break;
            case 'RoadNumber':
              deviation.RoadNumber = textContent;
              break;
            case 'Geometry':
              const wgs84 = child.querySelector('WGS84')?.textContent;
              if (wgs84) {
                deviation.Geometry = { WGS84: wgs84 };
              }
              break;
          }
        });
        
        if (deviation.Id && deviation.Geometry?.WGS84) {
          deviations.push(deviation as DeviationData);
        }
      });
      
      if (deviations.length > 0) {
        result.push({ Deviation: deviations });
      }
    });
    
    console.log(`✅ Parsed ${result.length} situations from JSON-style XML`);
    return result;
  } catch (error) {
    console.error('Failed to parse JSON-style XML:', error);
    return [];
  }
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_KEY_CHECKED_SITUATIONS = "trafikverket_checked_situations_v2";
const CACHE_KEY_NOTIFICATION_START_TIME = "trafikverket_notification_start_time";

// CRITICAL FIX: Reduce cache size by removing in-memory cache for large datasets
// Use memory-only cache instead of localStorage to prevent quota errors
let inMemoryCache: {
  situations: TrafikverketSituation[];
  timestamp: number;
} | null = null;

const CACHE_DURATION_SITUATIONS = 2 * 60 * 1000; // 2 minutes

interface CachedSituationData {
  situations: TrafikverketSituation[];
  timestamp: number;
}

function getCheckedSituations(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(CACHE_KEY_CHECKED_SITUATIONS);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCheckedSituations(situations: Set<string>): void {
  if (typeof window === "undefined") return;
  const situationsArray = Array.from(situations);
  try {
    // Keep only last 1000 to prevent storage overflow
    const trimmed = situationsArray.slice(-1000);
    localStorage.setItem(CACHE_KEY_CHECKED_SITUATIONS, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save checked situations:", error);
    // If storage is full, clear old data
    try {
      localStorage.removeItem(CACHE_KEY_CHECKED_SITUATIONS);
      const trimmed = situationsArray.slice(-500); // Keep fewer on error
      localStorage.setItem(CACHE_KEY_CHECKED_SITUATIONS, JSON.stringify(trimmed));
    } catch (e) {
      console.error("Critical: Cannot save checked situations even after cleanup:", e);
    }
  }
}

function getCachedSituations(): TrafikverketSituation[] | null {
  if (!inMemoryCache) return null;
  
  const age = Date.now() - inMemoryCache.timestamp;
  
  if (age < CACHE_DURATION_SITUATIONS) {
    console.log("✅ Using in-memory cached traffic situations");
    return inMemoryCache.situations;
  }
  
  // Cache expired
  inMemoryCache = null;
  return null;
}

function cacheSituations(situations: TrafikverketSituation[]): void {
  // CRITICAL FIX: Use in-memory cache instead of localStorage to avoid QuotaExceededError
  inMemoryCache = {
    situations,
    timestamp: Date.now()
  };
  console.log(`💾 Cached ${situations.length} situations in memory (not localStorage)`);
}

function getNotificationStartTime(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CACHE_KEY_NOTIFICATION_START_TIME);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

function saveNotificationStartTime(timestamp: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY_NOTIFICATION_START_TIME, timestamp.toString());
  } catch (error) {
    console.error("Failed to save notification start time:", error);
  }
}

function clearNotificationStartTime(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY_NOTIFICATION_START_TIME);
  } catch (error) {
    console.error("Failed to clear notification start time:", error);
  }
}

// ============================================================================
// TRAFIKVERKET TYPES
// ============================================================================

export interface TrafficNotificationSettings {
  enabled: boolean;
  cities: string[];
  counties: string[];
  roadNumbers: string[];
  regions: string[];
  eventTypes: string[];
  soundEnabled: boolean;
  pollingInterval: number;
  severityFilter: string[];
}

export const SWEDISH_COUNTIES = [
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

export const EVENT_TYPES = [
  { id: "accident", name: { sv: "Olycka", en: "Accident" }, icon: "🚨" },
  { id: "roadwork", name: { sv: "Vägarbete/Hinder", en: "Roadwork/Obstacle" }, icon: "🚧" },
  { id: "congestion", name: { sv: "Trafikstockning", en: "Traffic Congestion" }, icon: "🚗" },
  { id: "roadCondition", name: { sv: "Väglag", en: "Road Condition" }, icon: "❄️" },
  { id: "other", name: { sv: "Övrigt", en: "Other" }, icon: "ℹ️" }
];

export const SEVERITY_LEVELS = [
  { id: "Low", name: { sv: "Låg", en: "Low" } },
  { id: "Medium", name: { sv: "Medel", en: "Medium" } },
  { id: "High", name: { sv: "Hög", en: "High" } },
  { id: "VeryHigh", name: { sv: "Mycket hög", en: "Very High" } }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function classifyDeviation(deviation: DeviationData): string {
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
  
  if (iconId.includes("weather") || header.includes("väder") || 
      header.includes("halka") || header.includes("snö") ||
      header.includes("weather") || header.includes("ice")) {
    return "roadCondition";
  }

  return "other";
}

function getSituationId(situation: TrafikverketSituation): string {
  const deviation = situation.Deviation?.[0];
  if (!deviation) return `situation_${Date.now()}_${Math.random()}`;
  return deviation.Id || deviation.CreationTime || `situation_${Date.now()}_${Math.random()}`;
}

// ============================================================================
// FILTERING AND CLASSIFICATION
// ============================================================================

export const filterTrafficSituations = (
  situations: TrafikverketSituation[],
  settings: TrafficNotificationSettings
): TrafikverketSituation[] => {
  if (!settings.enabled) return [];

  return situations.filter((situation) => {
    if (!situation || !situation.Deviation || situation.Deviation.length === 0) {
      return false;
    }
    const deviation = situation.Deviation[0];
    const eventType = classifyDeviation(deviation);

    // Filter by event type
    if (!settings.eventTypes.includes(eventType)) {
      return false;
    }

    // Filter by severity if specified
    if (settings.severityFilter && settings.severityFilter.length > 0 && deviation.Severity) {
      if (!settings.severityFilter.includes(deviation.Severity)) {
        return false;
      }
    }

    // Filter by road numbers
    if (settings.roadNumbers.length > 0 && deviation.RoadNumber) {
      const matches = settings.roadNumbers.some(rn => 
        deviation.RoadNumber?.toUpperCase().includes(rn.toUpperCase())
      );
      if (!matches) return false;
    }

    // Filter by counties
    if (settings.counties.length > 0 && deviation.CountyNo) {
      const matches = deviation.CountyNo.some(cn => 
        settings.counties.includes(String(cn).padStart(2, '0'))
      );
      if (!matches) return false;
    }

    // Filter by cities
    if (settings.cities.length > 0 && deviation.LocationDescriptor) {
      const matches = settings.cities.some(city => 
        deviation.LocationDescriptor?.toLowerCase().includes(city.toLowerCase())
      );
      if (!matches) return false;
    }

    return true;
  });
};

// ============================================================================
// STREAMING SERVICE WITH FALLBACK
// ============================================================================

let pollingInterval: NodeJS.Timeout | null = null;
let isUsingFallback = false;
let notificationStartTime: number | null = null;

export function startTrafficPolling(
  settings: TrafficNotificationSettings,
  onNewSituation: (situation: TrafikverketSituation) => void,
  onAllSituations?: (situations: TrafikverketSituation[]) => void
) {
  console.log("🚀 Starting traffic monitoring...");

  // Mark the time when notifications were enabled
  notificationStartTime = getNotificationStartTime();
  if (!notificationStartTime) {
    notificationStartTime = Date.now();
    saveNotificationStartTime(notificationStartTime);
    console.log("📅 Notification start time set to:", new Date(notificationStartTime).toISOString());
  }

  const checkedSituations = getCheckedSituations();
  let connectionAttempts = 0;
  const MAX_CONNECTION_ATTEMPTS = 3;

  // Try WebSocket first
  trafikverketStreaming.start({
    objectTypes: ["Situation"],
    schemaVersion: "1.5",
    onConnect: () => {
      console.log("✅ Connected to Trafikverket real-time stream (WebSocket)");
      connectionAttempts = 0;
      isUsingFallback = false;
      
      // Stop any fallback polling if it was running
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    },
    onMessage: async (situation: TrafikverketSituation) => {
      const deviation = situation.Deviation?.[0];
      if (!deviation) return;

      // Always pass all situations to map callback
      if (onAllSituations) {
        onAllSituations([situation]);
      }

      // Check if this situation is NEW (created after notification start time)
      const creationTime = new Date(deviation.CreationTime).getTime();
      const isNewSituation = notificationStartTime ? creationTime > notificationStartTime : false;

      if (!isNewSituation) {
        console.log("⏭️ Skipping old situation (created before notification start):", deviation.Header);
        return;
      }

      const situationId = getSituationId(situation);
      
      if (checkedSituations.has(situationId)) {
        console.log("⏭️ Skipping already checked situation:", deviation.Header);
        return;
      }

      checkedSituations.add(situationId);
      saveCheckedSituations(checkedSituations);

      const filtered = filterTrafficSituations([situation], settings);
      if (filtered.length === 0) {
        console.log("⏭️ Situation filtered out by settings:", deviation.Header);
        return;
      }

      const eventType = classifyDeviation(deviation);
      const emoji = EVENT_TYPES.find(et => et.id === eventType)?.icon || "ℹ️";

      console.log(`🚨 NEW REAL-TIME ALERT (WebSocket): ${emoji} ${deviation.Header}`);
      onNewSituation(situation);
      
      if (pushNotifications.getPermissionStatus() === "granted") {
        await pushNotifications.showLocalNotification(
          `${emoji} ${deviation.Header}`,
          {
            body: deviation.Message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: situationId,
            requireInteraction: true,
            data: {
              url: "/traffic-alerts",
              situationId: situationId,
              severity: deviation.Severity || "Medium"
            }
          }
        );
      }
    },
    onError: (error) => {
      console.error("❌ WebSocket error:", error.message);
      connectionAttempts++;
      
      // If WebSocket fails multiple times, switch to fallback polling
      if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS && !isUsingFallback) {
        console.warn("⚠️ WebSocket connection failed, switching to REST API polling fallback");
        startFallbackPolling(settings, onNewSituation, checkedSituations, onAllSituations);
      }
    },
    onDisconnect: () => {
      console.log("🔌 Disconnected from Trafikverket stream");
      
      // If we disconnected unexpectedly and haven't tried many times, try fallback
      if (!isUsingFallback && connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
        console.warn("⚠️ Starting fallback polling due to disconnect");
        startFallbackPolling(settings, onNewSituation, checkedSituations, onAllSituations);
      }
    }
  });

  console.log("✅ Traffic monitoring started (attempting WebSocket, will fallback to REST API if needed)");
}

function startFallbackPolling(
  settings: TrafficNotificationSettings,
  onNewSituation: (situation: TrafikverketSituation) => void,
  checkedSituations: Set<string>,
  onAllSituations?: (situations: TrafikverketSituation[]) => void
) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  isUsingFallback = true;
  console.log("🔄 Starting REST API polling fallback (every 30 seconds)");

  const pollAPI = async () => {
    try {
      console.log("📡 Polling Trafikverket REST API...");
      const situations = await fetchAllTrafficSituations();
      
      // Always pass all situations to map callback
      if (onAllSituations) {
        onAllSituations(situations);
      }

      // Filter for NEW situations only (for notifications)
      const newSituations = situations.filter(situation => {
        const situationId = getSituationId(situation);
        if (checkedSituations.has(situationId)) return false;
        
        // Check if created after notification start time
        const deviation = situation.Deviation[0];
        const creationTime = new Date(deviation.CreationTime).getTime();
        return notificationStartTime ? creationTime > notificationStartTime : false;
      });

      if (newSituations.length > 0) {
        console.log(`📊 Found ${newSituations.length} NEW situations via REST API`);
        
        newSituations.forEach(situation => {
          const situationId = getSituationId(situation);
          checkedSituations.add(situationId);
          saveCheckedSituations(checkedSituations);

          const filtered = filterTrafficSituations([situation], settings);
          if (filtered.length > 0) {
            const deviation = situation.Deviation[0];
            const eventType = classifyDeviation(deviation);
            const emoji = EVENT_TYPES.find(et => et.id === eventType)?.icon || "ℹ️";
            
            console.log(`🚨 NEW ALERT (REST API): ${emoji} ${deviation.Header}`);
            onNewSituation(situation);
            
            if (pushNotifications.getPermissionStatus() === "granted") {
              pushNotifications.showLocalNotification(
                `${emoji} ${deviation.Header}`,
                {
                  body: deviation.Message,
                  icon: "/favicon.ico",
                  badge: "/favicon.ico",
                  tag: situationId,
                  requireInteraction: true,
                  data: {
                    url: "/traffic-alerts",
                    situationId: situationId,
                    severity: deviation.Severity || "Medium"
                  }
                }
              );
            }
          }
        });
      }
    } catch (error) {
      console.error("❌ REST API polling error:", error);
    }
  };

  // Poll immediately, then every 30 seconds
  pollAPI();
  pollingInterval = setInterval(pollAPI, 30000);
}

export function stopTrafficPolling() {
  trafikverketStreaming.stop();
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  
  isUsingFallback = false;
  notificationStartTime = null;
  clearNotificationStartTime();
  console.log("🛑 Traffic monitoring stopped");
}

export function getStreamingStatus(): {
  isConnected: boolean;
  connectionState: string;
  isUsingFallback: boolean;
  connectionError: string | null;
} {
  const stats = trafikverketStreaming.getStats();
  return {
    isConnected: trafikverketStreaming.isConnected(),
    connectionState: trafikverketStreaming.getConnectionState(),
    isUsingFallback: isUsingFallback,
    connectionError: stats.connectionError
  };
}

export async function testTrafikverketConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  return await trafikverketStreaming.testConnection();
}

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

const SETTINGS_KEY = "traffic_notification_settings_v2";

export function getNotificationSettings(): TrafficNotificationSettings {
  if (typeof window === "undefined") {
    return getDefaultSettings();
  }

  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return getDefaultSettings();
  }

  try {
    const settings = JSON.parse(stored);
    // Ensure severityFilter exists
    if (!settings.severityFilter) {
      settings.severityFilter = [];
    }
    return settings;
  } catch {
    return getDefaultSettings();
  }
}

export function saveNotificationSettings(settings: TrafficNotificationSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  console.log("💾 Saved traffic notification settings");
}

function getDefaultSettings(): TrafficNotificationSettings {
  return {
    enabled: false,
    cities: [],
    counties: [],
    roadNumbers: [],
    regions: [],
    eventTypes: ["accident", "roadwork"],
    soundEnabled: true,
    pollingInterval: 0,
    severityFilter: []
  };
}

// ============================================================================
// API FUNCTIONS (for legacy compatibility and direct queries)
// ============================================================================

export async function fetchAllTrafficSituations(): Promise<TrafikverketSituation[]> {
  // Check cache first
  const cached = getCachedSituations();
  if (cached) {
    console.log("✅ Using cached traffic situations");
    return cached;
  }

  console.log("\n" + "=".repeat(80));
  console.log("🔍 TRAFIKVERKET DATEX II API REQUEST");
  console.log("=".repeat(80));
  console.log("🔑 API Key:", TRAFIKVERKET_API_KEY ? `${TRAFIKVERKET_API_KEY.substring(0, 12)}...` : "❌ MISSING");
  console.log("📡 Endpoint:", "https://api.trafikinfo.trafikverket.se/v2/data.xml");
  console.log("⏰ Time:", new Date().toISOString());

  try {
    // Request DATEX II XML format directly
    const xmlUrl = `https://api.trafikinfo.trafikverket.se/v2/data.xml`;
    
    const requestBody = `<REQUEST>
  <LOGIN authenticationkey="${TRAFIKVERKET_API_KEY}" />
  <QUERY objecttype="Situation" schemaversion="1.5" />
</REQUEST>`;

    console.log("\n📦 Request body:");
    console.log(requestBody);

    const startTime = Date.now();
    
    const response = await fetch(xmlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "Accept": "application/xml, text/xml"
      },
      body: requestBody
    });

    const responseTime = Date.now() - startTime;
    console.log(`\n📥 Response received in ${responseTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📏 Content-Type: ${response.headers.get("content-type")}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`);
      console.error(errorText.substring(0, 500));
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const xmlText = await response.text();
    console.log(`\n📦 Received XML response (${xmlText.length} characters)`);
    console.log(`📄 First 500 chars of response:\n${xmlText.substring(0, 500)}...`);
    
    // Parse the DATEX II XML
    const situations = parseXMLSituations(xmlText);
    
    if (situations.length === 0) {
      console.warn("⚠️ Parsed 0 situations from XML response");
      console.warn("📋 Possible reasons:");
      console.warn("  1. No active situations right now");
      console.warn("  2. XML parsing failed (check structure)");
      console.warn("  3. API key has restrictions");
      
      // Try to parse as RESPONSE/RESULT format (JSON-style XML)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const resultElements = xmlDoc.querySelectorAll('RESPONSE > RESULT');
      
      if (resultElements.length > 0) {
        console.log("📋 Found RESPONSE/RESULT structure, checking for Situation elements...");
        const situationElements = xmlDoc.querySelectorAll('Situation');
        console.log(`   Found ${situationElements.length} Situation elements in JSON-style XML`);
      }
      
      return [];
    }
    
    console.log(`\n✅ SUCCESS! Parsed ${situations.length} situations from DATEX II XML`);
    
    // Log sample for verification
    const sample = situations.slice(0, 3);
    console.log(`\n📋 Sample situations (first ${sample.length}):`);
    sample.forEach((s, idx) => {
      const deviation = s.Deviation?.[0];
      console.log(`\n  ${idx + 1}. Situation:`);
      console.log(`     • ID: ${deviation?.Id || "N/A"}`);
      console.log(`     • Header: ${deviation?.Header || "N/A"}`);
      console.log(`     • Message: ${(deviation?.Message || "N/A").substring(0, 100)}...`);
      console.log(`     • Severity: ${deviation?.Severity || "N/A"}`);
      console.log(`     • Coordinates: ${deviation?.Geometry?.WGS84 || "N/A"}`);
      console.log(`     • Location: ${deviation?.LocationDescriptor || "N/A"}`);
    });
    
    console.log("\n" + "=".repeat(80));
    console.log("🎉 DATEX II XML PARSING SUCCESSFUL");
    console.log("=".repeat(80) + "\n");
    
    cacheSituations(situations);
    return situations;
    
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ FAILED TO FETCH TRAFFIC SITUATIONS");
    console.error("=".repeat(80));
    console.error("💥 Error:", (error as Error).message);
    console.error("📋 Stack:", (error as Error).stack);
    console.error("\n💡 Troubleshooting:");
    console.error("  1. Check API key is valid and active");
    console.error("  2. Verify network connectivity");
    console.error("  3. Check if Trafikverket API is operational");
    console.error("  4. Review XML parsing logic if response received");
    console.error("=".repeat(80) + "\n");
    
    throw error;
  }
}

export async function fetchTrafficInfo(
  latitude: number,
  longitude: number,
  radiusKm: number = 25
): Promise<TrafikverketSituation[]> {
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    throw new Error("Ogiltiga koordinater");
  }

  // Validate coordinates are in Sweden
  if (latitude < 55 || latitude > 70 || longitude < 10 || longitude < 25) {
    throw new Error("Koordinater utanför Sverige");
  }

  const requestBody = {
    REQUEST: {
      LOGIN: {
        authenticationkey: TRAFIKVERKET_API_KEY
      },
      QUERY: [
        {
          objecttype: "Situation",
          schemaversion: "1.5",
          limit: 100,
          FILTER: {
            WITHIN: {
              name: "Deviation.Geometry.WGS84",
              shape: "center",
              value: `${longitude} ${latitude}`,
              radius: radiusKm * 1000
            }
          }
        }
      ]
    }
  };

  try {
    const response = await fetch(TRAFIKVERKET_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Trafikverket API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.RESPONSE?.RESULT?.[0]?.Situation) {
      return data.RESPONSE.RESULT[0].Situation as TrafikverketSituation[];
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch traffic info:", error);
    throw error;
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export interface NotificationPayload {
  title: string;
  body: string;
  data: {
    url: string;
    situationId?: string;
    creationTime: string;
    severity?: string;
  };
}

export const createSituationNotification = (situation: TrafikverketSituation): NotificationPayload => {
  const deviation = situation.Deviation[0];
  const eventType = classifyDeviation(deviation);
  const emoji = EVENT_TYPES.find(et => et.id === eventType)?.icon || "ℹ️";
  
  return {
    title: `${emoji} ${deviation.Header}`,
    body: deviation.Message,
    data: {
      url: `/traffic-alerts?id=${deviation.Id}`,
      situationId: deviation.Id,
      creationTime: deviation.CreationTime,
      severity: deviation.Severity || "Medium"
    }
  };
};

export const getSituationDetailsForAI = (situation: TrafikverketSituation): string => {
  const deviation = situation.Deviation[0];
  const details = {
    Rubrik: deviation.Header,
    Meddelande: deviation.Message,
    Starttid: deviation.StartTime,
    Sluttid: deviation.EndTime,
    Allvarlighetsgrad: deviation.Severity,
    Ikon: deviation.IconId,
    Vägnummer: deviation.RoadNumber,
    Län: deviation.CountyNo,
    Plats: deviation.LocationDescriptor,
    Riktning: deviation.AffectedDirection,
    Hastighetsbegränsning: deviation.TemporaryLimit,
  };
  return Object.entries(details)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');
};

export const classifyDeviationExport = classifyDeviation;
