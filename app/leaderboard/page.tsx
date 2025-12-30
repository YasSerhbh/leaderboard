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

  useEffect(() => {
    if (!supabase) return;
    // Initial fetch
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("teams") // table name should be lowercase
        .select("id, name, elims, alive_count, logo")
        .order("id", { ascending: true });

        console.log("Fetched teams:", data, error);
      if (!error && data) {
        setTeams(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map((t: any) => ({
            id: t.id,
            name: t.name,
            elims: t.elims,
            aliveCount: t.alive_count,
            logo: t.logo,
          }))
        );

      } else {
        // Optionally, handle error
        setTeams([]);
      }
    };
    fetchTeams();

    // Real-time subscription
    const channel = supabase
      .channel("teams-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (_payload) => {
          fetchTeams();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
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
      className="min-h-screen bg-green-950 flex items-end justify-end"
      style={{ padding: 5 }}
    >
      <Leaderboard teams={teams} />
    </main>
  );
}
