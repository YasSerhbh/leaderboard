/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Leaderboard, Team } from "../../components/leaderboard";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default function LiveLeaderboardPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showLogos, setShowLogos] = useState(true); // default true

  useEffect(() => {
    if (!supabase) return;
    // Initial fetch
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, elims, alive_count, logo, show_on_leaderboard")
        .order("id", { ascending: true });
      if (!error && data) {
        setTeams(
          data.map((t: any) => ({
            id: t.id,
            name: t.name,
            elims: t.elims,
            aliveCount: t.alive_count,
            logo: t.logo,
            show_on_leaderboard: t.show_on_leaderboard,
          }))
        );
      } else {
        setTeams([]);
      }
    };
    // Fetch global settings for leaderboard
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("show_logos")
        .single<{ show_logos: boolean }>();
        console.log("Settings fetch:", { data, error });
      if (!error && data && typeof data.show_logos === "boolean") {
        setShowLogos(data.show_logos);
      }
    };
    fetchTeams();
    fetchSettings();
    // Subscribe to teams changes
    const teamsChannel = supabase
      .channel("teams-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        (_payload) => {
          fetchTeams();
        }
      )
      .subscribe();
    // Subscribe to settings changes
    const settingsChannel = supabase
      .channel("settings-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settings" },
        (_payload) => {
          fetchSettings();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-green-950">
        <div className="text-red-500 font-bold text-lg">Supabase environment variables are missing.</div>
      </main>
    );
  }
  return (
    <main
      className="min-h-screen bg-green-950 flex flex-col items-end justify-end"
      style={{ padding: 5 }}
    >
      <Leaderboard teams={teams} showLogos={showLogos} />
    </main>
  );
}
