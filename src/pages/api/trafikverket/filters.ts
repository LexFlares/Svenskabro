
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

interface UserFilters {
  counties: string[];
  municipalities: string[];
  roadNumbers: string[];
  eventTypes: string[];
  severityFilter: string[];
  notifications: {
    enabled: boolean;
    soundAlerts: boolean;
    highPriorityOnly: boolean;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (method === "POST") {
      // Save user filters
      const { userId, filters } = req.body as { userId: string; filters: UserFilters };

      if (!userId || !filters) {
        return res.status(400).json({ error: "Missing userId or filters" });
      }

      // Upsert user filters (insert or update if exists)
      const { data, error } = await supabase
        .from("user_traffic_filters")
        .upsert({
          user_id: userId,
          counties: filters.counties || [],
          municipalities: filters.municipalities || [],
          road_numbers: filters.roadNumbers || [],
          event_types: filters.eventTypes || [],
          severity_filter: filters.severityFilter || [],
          notifications_enabled: filters.notifications?.enabled ?? true,
          sound_alerts: filters.notifications?.soundAlerts ?? true,
          high_priority_only: filters.notifications?.highPriorityOnly ?? false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id"
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving user filters:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data });
    }

    if (method === "GET") {
      // Get user filters
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Missing or invalid userId" });
      }

      const { data, error } = await supabase
        .from("user_traffic_filters")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no filters found, return default empty filters
        if (error.code === "PGRST116") {
          return res.status(200).json({
            counties: [],
            municipalities: [],
            roadNumbers: [],
            eventTypes: ["accident", "roadwork"],
            severityFilter: [],
            notifications: {
              enabled: false,
              soundAlerts: true,
              highPriorityOnly: false
            }
          });
        }

        console.error("Error fetching user filters:", error);
        return res.status(500).json({ error: error.message });
      }

      // Transform database format to API format
      const filters: UserFilters = {
        counties: data.counties || [],
        municipalities: data.municipalities || [],
        roadNumbers: data.road_numbers || [],
        eventTypes: data.event_types || [],
        severityFilter: data.severity_filter || [],
        notifications: {
          enabled: data.notifications_enabled ?? false,
          soundAlerts: data.sound_alerts ?? true,
          highPriorityOnly: data.high_priority_only ?? false
        }
      };

      return res.status(200).json(filters);
    }

    if (method === "DELETE") {
      // Delete user filters
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Missing or invalid userId" });
      }

      const { error } = await supabase
        .from("user_traffic_filters")
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting user filters:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
