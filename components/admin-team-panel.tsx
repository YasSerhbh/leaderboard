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

    // State for editing team name
    const [editNameId, setEditNameId] = useState<number | null>(null);
    const [editNameValue, setEditNameValue] = useState("");
    const [editNameLoading, setEditNameLoading] = useState(false);

    // State for editing team logo
    const [editLogoId, setEditLogoId] = useState<number | null>(null);
    const [editLogoValue, setEditLogoValue] = useState("");
    const [editLogoLoading, setEditLogoLoading] = useState(false);

    // State for adding a team
    const [addTeamName, setAddTeamName] = useState("");
    const [addTeamLogo, setAddTeamLogo] = useState("");
    const [addTeamLoading, setAddTeamLoading] = useState(false);

    // State for deleting a team
    const [deleteLoading, setDeleteLoading] = useState<{ [id: number]: boolean }>({});

    // State for editing elims inline
    const [editingElimsId, setEditingElimsId] = useState<number | null>(null);
    const [editingElimsValue, setEditingElimsValue] = useState<string>("");

    // State for editing finishes inline
    const [editingFinishesId, setEditingFinishesId] = useState<number | null>(null);
    const [editingFinishesValue, setEditingFinishesValue] = useState<string>("");

    // State for global show_logos setting
    const [showLogosSetting, setShowLogosSetting] = useState(true);
    const [showLogosLoading, setShowLogosLoading] = useState(false);

    // State for global show_leaderboard visibility setting
    const [showLeaderboardSetting, setShowLeaderboardSetting] = useState(true);
    const [showLeaderboardLoading, setShowLeaderboardLoading] = useState(false);

    // State for active theme selector
    const [activeThemeSetting, setActiveThemeSetting] = useState(1);
    const [activeThemeLoading, setActiveThemeLoading] = useState(false);
    const TOTAL_THEMES = 2; // Increment when adding new themes

    const removeTeam = async (id: number) => {
        if (deleteLoading[id]) return;
        if (!window.confirm("Are you sure you want to remove this team?")) return;
        setDeleteLoading((prev) => ({ ...prev, [id]: true }));
        setError("");
        const { error } = await supabase.from("teams").delete().eq("id", id);
        if (error) {
            setError(error.message);
            setDeleteLoading((prev) => ({ ...prev, [id]: false }));
            return;
        }
        fetchTeams().then(() => {
            setDeleteLoading((prev) => ({ ...prev, [id]: false }));
        });
    };

    useEffect(() => {
        fetchTeams();
        fetchShowLogosSetting();
        fetchShowLeaderboardSetting();
        fetchActiveThemeSetting();
    }, []);

    const fetchShowLogosSetting = async () => {
        setShowLogosLoading(true);
        const { data, error } = await supabase
            .from("settings")
            .select("show_logos")
            .single();
        if (!error && data && typeof data.show_logos === "boolean") {
            setShowLogosSetting(data.show_logos);
        }
        setShowLogosLoading(false);
    };

    const updateShowLogosSetting = async (value: boolean) => {
        setShowLogosLoading(true);
        const { error } = await supabase
            .from("settings")
            .update({ show_logos: value })
            .eq("id", 1); // assuming single settings row with id=1
        if (!error) {
            setShowLogosSetting(value);
        }
        setShowLogosLoading(false);
    };

    const fetchShowLeaderboardSetting = async () => {
        setShowLeaderboardLoading(true);
        const { data, error } = await supabase
            .from("settings")
            .select("show_leaderboard")
            .single();
        if (!error && data && typeof data.show_leaderboard === "boolean") {
            setShowLeaderboardSetting(data.show_leaderboard);
        }
        setShowLeaderboardLoading(false);
    };

    const updateShowLeaderboardSetting = async (value: boolean) => {
        setShowLeaderboardLoading(true);
        const { error } = await supabase
            .from("settings")
            .update({ show_leaderboard: value })
            .eq("id", 1); // assuming single settings row with id=1
        if (!error) {
            setShowLeaderboardSetting(value);
        }
        setShowLeaderboardLoading(false);
    };

    const fetchActiveThemeSetting = async () => {
        setActiveThemeLoading(true);
        const { data, error } = await supabase
            .from("settings")
            .select("active_theme")
            .single();
        if (!error && data && typeof data.active_theme === "number") {
            setActiveThemeSetting(data.active_theme);
        }
        setActiveThemeLoading(false);
    };

    const updateActiveThemeSetting = async (value: number) => {
        setActiveThemeLoading(true);
        const { error } = await supabase
            .from("settings")
            .update({ active_theme: value })
            .eq("id", 1);
        if (!error) {
            setActiveThemeSetting(value);
        }
        setActiveThemeLoading(false);
    };

    const fetchTeams = async () => {
        setError("");
        const { data, error } = await supabase
            .from("teams")
            .select("id, name, elims, alive_count, knocked_count, finishes, logo, show_on_leaderboard, outside_zone")
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
        <div className="mx-auto p-4 space-y-8">
            <div className="bg-green-950/90 rounded-xl shadow-lg p-6 mb-6 border border-green-800 w-fit">
                <h2 className="text-2xl font-bold text-green-200 mb-4 flex items-center gap-2">
                    <span>Team Management</span>
                </h2>
                {/* Show Logos Toggle */}
                <div className="mb-4 flex items-center gap-3">
                    <span className="text-green-300 font-semibold">Show Logos on Leaderboard:</span>
                    <button
                        className={`px-4 py-2 rounded font-bold text-xs shadow ${showLogosSetting ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'} hover:bg-green-800 transition`}
                        onClick={() => updateShowLogosSetting(!showLogosSetting)}
                        disabled={showLogosLoading}
                    >
                        {showLogosSetting ? 'Logos Shown' : 'Logos Hidden'}
                    </button>
                </div>
                {/* Show/Hide Leaderboard Toggle for OBS */}
                <div className="mb-4 flex items-center gap-3">
                    <span className="text-green-300 font-semibold">Leaderboard Visibility:</span>
                    <button
                        className={`px-5 py-2.5 rounded font-bold text-sm shadow-lg transition-all transform hover:scale-105 ${showLeaderboardSetting ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-600 hover:to-yellow-600' : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'}`}
                        onClick={() => updateShowLeaderboardSetting(!showLeaderboardSetting)}
                        disabled={showLeaderboardLoading}
                    >
                        {showLeaderboardSetting ? '📊 Leaderboard Visible' : '👁️ Leaderboard Hidden'}
                    </button>
                    <span className="text-gray-400 text-xs">(Press L key on leaderboard page to toggle)</span>
                </div>
                {/* Active Theme Selector */}
                <div className="mb-4 flex items-center gap-3">
                    <span className="text-green-300 font-semibold">Active Theme:</span>
                    <div className="flex gap-2">
                        {Array.from({ length: TOTAL_THEMES }, (_, i) => i + 1).map((themeNum) => (
                            <button
                                key={themeNum}
                                className={`px-4 py-2 rounded font-bold text-sm shadow-lg transition-all transform hover:scale-105 ${
                                    activeThemeSetting === themeNum
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white ring-2 ring-purple-300'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                                onClick={() => updateActiveThemeSetting(themeNum)}
                                disabled={activeThemeLoading}
                            >
                                🎨 Theme {themeNum}
                            </button>
                        ))}
                    </div>
                </div>
                <form
                    className="flex flex-wrap gap-3 items-end mb-2"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (addTeamLoading) return;
                        setAddTeamLoading(true);
                        setError("");
                        const { error } = await supabase.from("teams").insert([
                            {
                                name: addTeamName,
                                logo: addTeamLogo || null,
                                elims: 0,
                                alive_count: 4,
                                knocked_count: 0,
                                finishes: 0,
                                show_on_leaderboard: true,
                                outside_zone: false,
                            },
                        ]);
                        if (error) {
                            setError(error.message);
                            setAddTeamLoading(false);
                            return;
                        }
                        setAddTeamName("");
                        setAddTeamLogo("");
                        setAddTeamLoading(false);
                        fetchTeams();
                    }}
                >
                    <div className="flex flex-col gap-1">
                        <label className="text-green-300 text-sm font-semibold">Team Name</label>
                        <input
                            className="px-2 py-1 rounded border border-green-700 bg-green-900 text-white focus:outline-none focus:ring focus:ring-green-600"
                            type="text"
                            placeholder="Team Name"
                            value={addTeamName}
                            onChange={(e) => setAddTeamName(e.target.value)}
                            required
                            disabled={addTeamLoading}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-green-300 text-sm font-semibold">Logo URL</label>
                        <input
                            className="px-2 py-1 rounded border border-green-700 bg-green-900 text-white focus:outline-none focus:ring focus:ring-green-600"
                            type="text"
                            placeholder="Logo URL (optional)"
                            value={addTeamLogo}
                            onChange={(e) => setAddTeamLogo(e.target.value)}
                            disabled={addTeamLoading}
                        />
                    </div>
                    <button
                        className="bg-green-700 px-5 py-2 rounded text-white font-bold hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow self-end"
                        type="submit"
                        disabled={addTeamLoading || !addTeamName.trim()}
                    >
                        {addTeamLoading ? "Adding..." : "Add Team"}
                    </button>
                </form>
                {error && (
                    <div className="text-red-400 mb-2 font-semibold">{error}</div>
                )}
            </div>
            <div className="bg-green-950/80 rounded-xl shadow-lg p-4 border border-green-800">
                <h3 className="text-xl font-bold text-green-200 mb-3">Teams List</h3>
                <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="min-w-[900px] max-w-full mx-auto" style={{ overflow: 'auto', maxHeight: '60vh' }}>
                        <table className="w-full text-white text-center bg-green-900 rounded-lg border-separate border-spacing-0 shadow-xl">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-green-800">
                                    <th className="p-2">#</th>
                                    <th className="p-2">Team Name</th>
                                    <th className="p-2">Elims</th>
                                    <th className="p-2">Alive</th>
                                    <th className="p-2">Knocked</th>
                                    <th className="p-2">Finishes</th>
                                    <th className="p-2">Logo</th>
                                    <th className="p-2">Show?</th>
                                    <th className="p-2">Zone</th>
                                    <th className="p-2">Actions</th>
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
                                        style={{ height: 56 }}
                                    >
                                        {/* ...existing code for each <td>... */}
                                        <td className="p-2 font-bold align-middle">{idx + 1}</td>
                                        <td className="p-2 align-middle text-left pl-4">
                                            {/* ...existing code for team name edit... */}
                                            {editNameId === team.id ? (
                                                <form
                                                    className="flex items-center gap-2"
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        setEditNameLoading(true);
                                                        setError("");
                                                        await updateTeam(team.id, { name: editNameValue });
                                                        setEditNameId(null);
                                                        setEditNameValue("");
                                                        setEditNameLoading(false);
                                                    }}
                                                >
                                                    <input
                                                        className="px-2 py-1 rounded border border-green-700 bg-green-900 text-white focus:outline-none focus:ring focus:ring-green-600"
                                                        type="text"
                                                        value={editNameValue}
                                                        onChange={(e) => setEditNameValue(e.target.value)}
                                                        disabled={editNameLoading}
                                                        autoFocus
                                                        required
                                                    />
                                                    <button
                                                        className="bg-green-700 px-2 py-1 rounded text-white font-bold text-xs hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                                                        type="submit"
                                                        disabled={editNameLoading || !editNameValue.trim()}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="bg-gray-700 px-2 py-1 rounded text-white font-bold text-xs hover:bg-gray-600 active:bg-gray-800 disabled:opacity-50 shadow"
                                                        type="button"
                                                        onClick={() => { setEditNameId(null); setEditNameValue(""); }}
                                                        disabled={editNameLoading}
                                                    >
                                                        Cancel
                                                    </button>
                                                </form>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    {team.name}
                                                    <button
                                                        className="ml-2 bg-green-800 px-2 py-1 rounded text-white font-bold text-xs hover:bg-green-700 active:bg-green-900 disabled:opacity-50 shadow"
                                                        onClick={() => { setEditNameId(team.id); setEditNameValue(team.name); }}
                                                        disabled={rowLoading[team.id]}
                                                        title="Edit team name"
                                                    >
                                                        Edit
                                                    </button>
                                                </span>
                                            )}
                                        </td>
                                        {/* ...existing code for elims, alive, logo, show, actions... */}
                                        <td className="p-2 align-middle">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    className="w-16 px-2 py-1 rounded border border-green-700 bg-green-900 text-white text-center font-semibold focus:outline-none focus:ring focus:ring-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={editingElimsId === team.id ? editingElimsValue : team.elims}
                                                    onFocus={() => {
                                                        setEditingElimsId(team.id);
                                                        setEditingElimsValue(String(team.elims));
                                                    }}
                                                    onChange={(e) => {
                                                        setEditingElimsValue(e.target.value);
                                                    }}
                                                    onBlur={() => {
                                                        const value = parseInt(editingElimsValue, 10);
                                                        if (!isNaN(value) && value >= 0 && value !== team.elims) {
                                                            updateTeam(team.id, { elims: value });
                                                        } else if (isNaN(value) || value < 0) {
                                                            updateTeam(team.id, { elims: 0 });
                                                        }
                                                        setEditingElimsId(null);
                                                        setEditingElimsValue("");
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        } else if (e.key === 'Escape') {
                                                            setEditingElimsId(null);
                                                            setEditingElimsValue("");
                                                        }
                                                    }}
                                                    min={0}
                                                    disabled={rowLoading[team.id]}
                                                    aria-label="Eliminations"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 align-middle">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    className="bg-green-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                                                    onClick={() => {
                                                        // Alive-: instant death → eliminated
                                                        updateTeam(team.id, { alive_count: team.alive_count - 1 });
                                                    }}
                                                    disabled={rowLoading[team.id] || team.alive_count <= 0}
                                                    aria-label="Decrease alive count"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-semibold">{team.alive_count}</span>
                                                <button
                                                    className="bg-green-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                                                    onClick={() => {
                                                        const knocked = team.knocked_count ?? 0;
                                                        if (knocked > 0) {
                                                            // Alive+: revive from knocked
                                                            updateTeam(team.id, { alive_count: team.alive_count + 1, knocked_count: knocked - 1 });
                                                        } else {
                                                            // Alive+: revive from eliminated
                                                            updateTeam(team.id, { alive_count: team.alive_count + 1 });
                                                        }
                                                    }}
                                                    disabled={rowLoading[team.id] || team.alive_count >= 4}
                                                    aria-label="Increase alive count"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        {/* Knocked count +/- */}
                                        <td className="p-2 align-middle">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    className="bg-yellow-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-yellow-600 active:bg-yellow-800 disabled:opacity-50 shadow"
                                                    onClick={() => {
                                                        // Knocked-: knocked player gets eliminated
                                                        updateTeam(team.id, { knocked_count: (team.knocked_count ?? 0) - 1 });
                                                    }}
                                                    disabled={rowLoading[team.id] || (team.knocked_count ?? 0) <= 0}
                                                    aria-label="Decrease knocked count"
                                                >
                                                    -
                                                </button>
                                                <span className="w-8 text-center font-semibold">{team.knocked_count ?? 0}</span>
                                                <button
                                                    className="bg-yellow-700 w-7 h-7 rounded text-white font-bold flex items-center justify-center text-lg hover:bg-yellow-600 active:bg-yellow-800 disabled:opacity-50 shadow"
                                                    onClick={() => {
                                                        // Knocked+: knock an alive player (alive→knocked)
                                                        updateTeam(team.id, {
                                                            alive_count: team.alive_count - 1,
                                                            knocked_count: (team.knocked_count ?? 0) + 1,
                                                        });
                                                    }}
                                                    disabled={rowLoading[team.id] || team.alive_count <= 0}
                                                    aria-label="Increase knocked count"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        {/* Finishes input */}
                                        <td className="p-2 align-middle">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    className="w-16 px-2 py-1 rounded border border-green-700 bg-green-900 text-white text-center font-semibold focus:outline-none focus:ring focus:ring-green-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    value={editingFinishesId === team.id ? editingFinishesValue : (team.finishes ?? 0)}
                                                    onFocus={() => {
                                                        setEditingFinishesId(team.id);
                                                        setEditingFinishesValue(String(team.finishes ?? 0));
                                                    }}
                                                    onChange={(e) => {
                                                        setEditingFinishesValue(e.target.value);
                                                    }}
                                                    onBlur={() => {
                                                        const value = parseInt(editingFinishesValue, 10);
                                                        if (!isNaN(value) && value >= 0 && value !== (team.finishes ?? 0)) {
                                                            updateTeam(team.id, { finishes: value });
                                                        } else if (isNaN(value) || value < 0) {
                                                            updateTeam(team.id, { finishes: 0 });
                                                        }
                                                        setEditingFinishesId(null);
                                                        setEditingFinishesValue("");
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        } else if (e.key === 'Escape') {
                                                            setEditingFinishesId(null);
                                                            setEditingFinishesValue("");
                                                        }
                                                    }}
                                                    min={0}
                                                    disabled={rowLoading[team.id]}
                                                    aria-label="Finishes"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 align-middle">
                                            {editLogoId === team.id ? (
                                                <form
                                                    className="flex flex-col items-center gap-2"
                                                    onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        setEditLogoLoading(true);
                                                        setError("");
                                                        await updateTeam(team.id, { logo: editLogoValue });
                                                        setEditLogoId(null);
                                                        setEditLogoValue("");
                                                        setEditLogoLoading(false);
                                                    }}
                                                >
                                                    <input
                                                        className="px-2 py-1 rounded border border-green-700 bg-green-900 text-white focus:outline-none focus:ring focus:ring-green-600 w-32"
                                                        type="text"
                                                        value={editLogoValue}
                                                        onChange={(e) => setEditLogoValue(e.target.value)}
                                                        disabled={editLogoLoading}
                                                        placeholder="Logo URL"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            className="bg-green-700 px-2 py-1 rounded text-white font-bold text-xs hover:bg-green-600 active:bg-green-800 disabled:opacity-50 shadow"
                                                            type="submit"
                                                            disabled={editLogoLoading}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            className="bg-gray-700 px-2 py-1 rounded text-white font-bold text-xs hover:bg-gray-600 active:bg-gray-800 disabled:opacity-50 shadow"
                                                            type="button"
                                                            onClick={() => { setEditLogoId(null); setEditLogoValue(""); }}
                                                            disabled={editLogoLoading}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    {team.logo ? (
                                                        <img src={team.logo} alt="logo" className="w-10 h-10 mx-auto rounded bg-white object-contain border border-green-700 shadow" />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No logo</span>
                                                    )}
                                                    <button
                                                        className="mt-1 bg-green-800 px-2 py-1 rounded text-white font-bold text-xs hover:bg-green-700 active:bg-green-900 disabled:opacity-50 shadow"
                                                        onClick={() => { setEditLogoId(team.id); setEditLogoValue(team.logo || ""); }}
                                                        disabled={rowLoading[team.id]}
                                                        title="Change logo"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
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
                                        <td className="p-2 align-middle">
                                            <button
                                                className={`px-3 py-1 rounded font-bold text-xs shadow ${(team.outside_zone) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'} hover:bg-blue-700 transition`}
                                                onClick={() => updateTeam(team.id, { outside_zone: !(team.outside_zone ?? false) })}
                                                disabled={rowLoading[team.id]}
                                            >
                                                {(team.outside_zone) ? 'Outside' : 'In Zone'}
                                            </button>
                                        </td>
                                        <td className="p-2 align-middle flex flex-col gap-2 items-center justify-center min-w-[110px]">
                                            <button
                                                className="bg-red-700 px-3 py-1 rounded text-white font-bold text-xs shadow hover:bg-red-600 active:bg-red-800 disabled:opacity-50"
                                                onClick={() => removeTeam(team.id)}
                                                disabled={deleteLoading[team.id]}
                                            >
                                                {deleteLoading[team.id] ? "Removing..." : "Remove"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>{/* close .min-w-[900px]... */}
                </div>{/* close .w-full overflow-x-auto */}
            </div>{/* close .bg-green-950/80... Teams List */}
        </div>
    );

}
