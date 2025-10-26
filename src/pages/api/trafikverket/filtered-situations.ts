
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const TRAFIKVERKET_API_KEY = "a3733860138e455c9b0f3af5da10c109";
const TRAFIKVERKET_API_URL = "https://api.trafikinfo.trafikverket.se/v2/data.json";

// In-memory cache for filtered situations
const situationsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const cacheKey = `situations_${userId}`;

    // Check cache first
    const cached = situationsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`✅ Returning cached situations for user ${userId}`);
      return res.status(200).json({ source: "cache", data: cached.data });
    }

    // Fetch user filters
    const { data: filterData, error: filterError } = await supabase
      .from("user_traffic_filters")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (filterError && filterError.code !== "PGRST116") {
      console.error("Error fetching user filters:", filterError);
      return res.status(500).json({ error: "Failed to fetch user filters" });
    }

    // Build dynamic query based on filters
    const filters = filterData || {
      counties: [],
      municipalities: [],
      road_numbers: [],
      event_types: [],
      high_priority_only: false,
      severity_filter: []
    };
    const query = buildFilteredQuery(filters);

    console.log(`🔍 Fetching situations for user ${userId} with filters:`, {
      counties: filters.counties || [],
      municipalities: filters.municipalities || [],
      roadNumbers: filters.road_numbers || [],
      eventTypes: filters.event_types || []
    });

    // Call Trafikverket API
    const response = await fetch(TRAFIKVERKET_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Trafikverket API error: ${response.status}`);
    }

    const apiData = await response.json();
    const situations = apiData.RESPONSE?.RESULT?.[0]?.Situation || [];

    // Filter situations on client-side for more detailed control
    const filtered = filterSituations(situations, filters);

    console.log(`✅ Fetched and filtered ${filtered.length}/${situations.length} situations`);

    // Cache the result
    situationsCache.set(cacheKey, {
      data: filtered,
      timestamp: Date.now()
    });

    return res.status(200).json({ source: "api", data: filtered });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Failed to fetch situations" });
  }
}

function buildFilteredQuery(filters: any) {
  const { counties } = filters;

  let countyFilter = null;

  if (counties && counties.length > 0) {
    // Filter by county codes
    const countyConditions = counties.map((c: string) => ({
      EQ: { name: "Deviation.CountyNo", value: parseInt(c, 10) }
    }));

    countyFilter = countyConditions.length > 1 
      ? { OR: countyConditions }
      : countyConditions[0];
  }

  const query = {
    REQUEST: {
      LOGIN: {
        authenticationkey: TRAFIKVERKET_API_KEY
      },
      QUERY: [
        {
          objecttype: "Situation",
          schemaversion: "1.5",
          limit: 500,
          ...(countyFilter && { FILTER: countyFilter }),
          INCLUDE: [
            "Deviation.Message",
            "Deviation.Header",
            "Deviation.IconId",
            "Deviation.LocationDescriptor",
            "Deviation.SeverityText",
            "Deviation.Severity",
            "Deviation.StartTime",
            "Deviation.EndTime",
            "Deviation.CreationTime",
            "Deviation.CountyNo",
            "Deviation.RoadNumber",
            "Deviation.RoadNumberNumeric",
            "Deviation.Geometry.WGS84",
            "Deviation.Id"
          ]
        }
      ]
    }
  };

  return query;
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

    // Filter by municipality/city (text search in LocationDescriptor)
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
          return iconId.includes("roadwork") || header.includes("vägarbete") || 
                 header.includes("hinder") || message.includes("arbete");
        }
        if (type === "congestion") {
          return iconId.includes("congestion") || header.includes("kö") || 
                 header.includes("stockning") || message.includes("stockning");
        }
        if (type === "roadCondition") {
          return iconId.includes("weather") || header.includes("väder") || 
                 header.includes("halka") || message.includes("halka");
        }
        return true;
      });
      
      if (!typeMatch) return false;
    }

    // Filter by severity if "high priority only" is enabled
    if (filters.high_priority_only) {
      const severity = (deviation.Severity || "").toLowerCase();
      if (severity !== "high" && severity !== "veryhigh") {
        return false;
      }
    }

    // Filter by specific severity levels if set
    if (filters.severity_filter && filters.severity_filter.length > 0) {
      const severity = deviation.Severity;
      if (!severity || !filters.severity_filter.includes(severity)) {
        return false;
      }
    }

    return true;
  });
}
