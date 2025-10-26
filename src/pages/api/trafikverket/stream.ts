
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const TRAFIKVERKET_API_KEY = "a3733860138e455c9b0f3af5da10c109";
const TRAFIKVERKET_API_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";

// Store last checked situation IDs per user to detect new events
const userLastChecked = new Map<string, Set<string>>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Missing userId" });
  }

  // Set up Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log(`📡 SSE connection established for user: ${userId}`);

  // Initialize last checked set for this user
  if (!userLastChecked.has(userId)) {
    userLastChecked.set(userId, new Set());
  }

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send initial connection success
  sendEvent({ type: "connected", timestamp: new Date().toISOString() });

  // Polling function to check for new traffic situations
  const checkForNewSituations = async () => {
    try {
      // Fetch user filters
      const { data: filterData, error: filterError } = await supabase
        .from("user_traffic_filters")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (filterError || !filterData || !filterData.notifications_enabled) {
        // User has no filters or notifications disabled
        return;
      }

      const filters = {
        counties: filterData.counties || [],
        municipalities: filterData.municipalities || [],
        road_numbers: filterData.road_numbers || [],
        event_types: filterData.event_types || [],
        severity_filter: filterData.severity_filter || [],
        high_priority_only: filterData.high_priority_only || false
      };

      // Build query based on user filters
      const query = buildFilteredQuery(filters);

      // Fetch from Trafikverket API
      const response = await fetch(TRAFIKVERKET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`Trafikverket API error: ${response.status}`);
      }

      const apiData = await response.json();
      const situations = apiData.RESPONSE?.RESULT?.[0]?.Situation || [];

      // Filter situations based on user preferences
      const filtered = filterSituations(situations, filters);

      // Get current checked IDs
      const checkedIds = userLastChecked.get(userId)!;
      const newSituations = [];

      // Identify NEW situations
      for (const situation of filtered) {
        const deviation = situation.Deviation?.[0];
        if (!deviation) continue;

        const situationId = deviation.Id || deviation.CreationTime;
        if (!checkedIds.has(situationId)) {
          newSituations.push(situation);
          checkedIds.add(situationId);
        }
      }

      // Send ONLY new situations to client
      if (newSituations.length > 0) {
        console.log(`🚨 Found ${newSituations.length} NEW situations for user ${userId}`);
        
        for (const situation of newSituations) {
          sendEvent({
            type: "new_situation",
            situation,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Trim checked IDs to last 1000 to prevent memory leak
      if (checkedIds.size > 1000) {
        const idsArray = Array.from(checkedIds);
        const trimmed = new Set(idsArray.slice(-1000));
        userLastChecked.set(userId, trimmed);
      }

    } catch (error) {
      console.error(`❌ Error checking situations for user ${userId}:`, error);
      sendEvent({
        type: "error",
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Initial check immediately
  checkForNewSituations();

  // Set up polling interval (every 30 seconds)
  const intervalId = setInterval(checkForNewSituations, 30000);

  // Heartbeat to keep connection alive
  const heartbeatId = setInterval(() => {
    sendEvent({ type: "heartbeat", timestamp: new Date().toISOString() });
  }, 15000);

  // Cleanup on client disconnect
  req.on("close", () => {
    console.log(`🔌 SSE connection closed for user: ${userId}`);
    clearInterval(intervalId);
    clearInterval(heartbeatId);
    userLastChecked.delete(userId);
    res.end();
  });
}

function buildFilteredQuery(filters: any) {
  const { counties } = filters;

  let countyFilter = null;

  if (counties && counties.length > 0) {
    const countyConditions = counties.map((c: string) => ({
      EQ: { name: "Deviation.CountyNo", value: parseInt(c, 10) }
    }));

    countyFilter = countyConditions.length > 1 
      ? { OR: countyConditions }
      : countyConditions[0];
  }

  return {
    REQUEST: {
      LOGIN: { authenticationkey: TRAFIKVERKET_API_KEY },
      QUERY: [{
        objecttype: "Situation",
        schemaversion: "1.5",
        limit: 500,
        ...(countyFilter && { FILTER: countyFilter }),
        INCLUDE: [
          "Deviation.Message",
          "Deviation.Header",
          "Deviation.IconId",
          "Deviation.LocationDescriptor",
          "Deviation.Severity",
          "Deviation.StartTime",
          "Deviation.CreationTime",
          "Deviation.CountyNo",
          "Deviation.RoadNumber",
          "Deviation.Geometry.WGS84",
          "Deviation.Id"
        ]
      }]
    }
  };
}

function filterSituations(situations: any[], filters: any) {
  if (!situations || situations.length === 0) return [];

  return situations.filter((situation: any) => {
    const deviation = situation.Deviation?.[0];
    if (!deviation) return false;

    // Filter by road numbers
    if (filters.road_numbers && filters.road_numbers.length > 0) {
      const roadNum = deviation.RoadNumber || "";
      const roadMatch = filters.road_numbers.some((road: string) => 
        roadNum.toUpperCase().includes(road.toUpperCase())
      );
      if (!roadMatch) return false;
    }

    // Filter by municipality
    if (filters.municipalities && filters.municipalities.length > 0) {
      const location = (deviation.LocationDescriptor || "").toLowerCase();
      const municipalityMatch = filters.municipalities.some((mun: string) => 
        location.includes(mun.toLowerCase())
      );
      if (!municipalityMatch) return false;
    }

    // Filter by event type
    if (filters.event_types && filters.event_types.length > 0) {
      const message = (deviation.Message || "").toLowerCase();
      const header = (deviation.Header || "").toLowerCase();
      const iconId = (deviation.IconId || "").toLowerCase();
      
      const typeMatch = filters.event_types.some((type: string) => {
        if (type === "accident") {
          return iconId.includes("accident") || header.includes("olycka") || message.includes("olycka");
        }
        if (type === "roadwork") {
          return iconId.includes("roadwork") || header.includes("hinder") || message.includes("arbete");
        }
        return true;
      });
      
      if (!typeMatch) return false;
    }

    // Filter by severity
    if (filters.high_priority_only) {
      const severity = (deviation.Severity || "").toLowerCase();
      if (severity !== "high" && severity !== "veryhigh") return false;
    }

    if (filters.severity_filter && filters.severity_filter.length > 0) {
      const severity = deviation.Severity;
      if (!severity || !filters.severity_filter.includes(severity)) return false;
    }

    return true;
  });
}
