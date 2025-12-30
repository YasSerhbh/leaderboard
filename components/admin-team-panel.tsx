/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

export default function AdminTeamPanel() {
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState("");
  // Track loading state per team id for elims and alive
  const [rowLoading, setRowLoading] = useState<{ [id: number]: boolean }>({});

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setError("");
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, elims, alive_count, logo, show_on_leaderboard")
      .order("id", { ascending: true });
    if (!error && data) setTeams(data);
    else setError(error?.message || "Failed to fetch teams");
  };

  // Optimistic update for elims and alive_count
  const updateTeam = async (id: number, changes: Partial<any>) => {
    setRowLoading((prev) => ({ ...prev, [id]: true }));
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === id ? { ...team, ...changes } : team
      )
    );
    setError("");
    const { error } = await supabase
      .from("teams")
      .update(changes)
      .eq("id", id);
    if (error) setError(error.message);
    // Optionally, re-fetch to ensure sync
    await fetchTeams();
    setRowLoading((prev) => ({ ...prev, [id]: false }));
  };

  return (
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-white text-center bg-green-900 rounded-lg border-separate border-spacing-0 shadow-xl">
          <thead className="sticky top-0 z-10">
            <tr className="bg-green-800">
              <th className="p-2">#</th>
              <th className="p-2">Team Name</th>
              <th className="p-2">Elims</th>
              <th className="p-2">Alive</th>
              <th className="p-2">Logo</th>
              <th className="p-2">Show?</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr
                key={team.id}
                className={
                  idx % 2 === 0
                    ? "bg-green-950/60 border-b border-green-800 hover:bg-green-800/30 transition-colors"
                    : "bg-green-900/80 border-b border-green-800 hover:bg-green-800/30 transition-colors"
                }
                style={{ height: 44 }}
              >
                <td className="p-2 font-bold align-middle">{team.id}</td>
                <td className="p-2 align-middle text-left pl-4">{team.name}</td>
                <td className="p-2 align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className="bg-green-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                      onClick={() => updateTeam(team.id, { elims: Math.max(0, team.elims - 1) })}
                      disabled={rowLoading[team.id] || team.elims <= 0}
                      aria-label="Decrease eliminations"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">{team.elims}</span>
                    <button
                      className="bg-green-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                      onClick={() => updateTeam(team.id, { elims: team.elims + 1 })}
                      disabled={rowLoading[team.id]}
                      aria-label="Increase eliminations"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-2 align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className="bg-green-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                      onClick={() => updateTeam(team.id, { alive_count: Math.max(0, team.alive_count - 1) })}
                      disabled={rowLoading[team.id] || team.alive_count <= 0}
                      aria-label="Decrease alive count"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold">{team.alive_count}</span>
                    <button
                      className="bg-green-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                      onClick={() => updateTeam(team.id, { alive_count: Math.min(4, team.alive_count + 1) })}
                      disabled={rowLoading[team.id] || team.alive_count >= 4}
                      aria-label="Increase alive count"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-2 align-middle">
                  {team.logo ? (
                    <img src={team.logo} alt="logo" className="w-8 h-8 mx-auto rounded bg-white object-contain border border-green-700 shadow" />
                  ) : (
                    <span className="text-xs text-gray-400">No logo</span>
                  )}
                </td>
                <td className="p-2 align-middle">
                  <button
                    className={`px-3 py-1 rounded font-bold text-xs shadow ${(team.show_on_leaderboard ?? true) ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'} hover:bg-green-700 transition`}
                    onClick={() => updateTeam(team.id, { show_on_leaderboard: !(team.show_on_leaderboard ?? true) })}
                    disabled={rowLoading[team.id]}
                  >
                    {(team.show_on_leaderboard ?? true) ? 'Shown' : 'Hidden'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    //       </tbody>
    //     </table>
    //   </div>
    // </div>
  );
}
