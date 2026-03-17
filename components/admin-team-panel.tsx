/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_THEME1_PALETTE, Theme1Palette } from "./leaderboard-theme1";
import { DEFAULT_THEME2_PALETTE, Theme2Palette } from "./leaderboard-theme2";
import {
  Users,
  UserPlus,
  Trophy,
  Palette,
  Eye,
  EyeOff,
  Image,
  ImageOff,
  Type,
  Layers,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Flag,
  RotateCcw,
  Zap,
  PenLine,
  Search,
  Star,
  Settings,
} from "lucide-react";

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
  const [deleteLoading, setDeleteLoading] = useState<{ [id: number]: boolean }>(
    {}
  );

  // State for editing elims inline
  const [editingElimsId, setEditingElimsId] = useState<number | null>(null);
  const [editingElimsValue, setEditingElimsValue] = useState<string>("");

  // State for editing finishes inline
  const [editingFinishesId, setEditingFinishesId] = useState<number | null>(
    null
  );
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

  // State for font family setting
  const [fontFamilySetting, setFontFamilySetting] = useState("Countach");
  const [fontFamilyLoading, setFontFamilyLoading] = useState(false);
  const [fontSearchInput, setFontSearchInput] = useState("");
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);

  // --- Color Palette State ---
  type PaletteRow = {
    id: number;
    theme_number: number;
    name: string;
    colors: Record<string, string>;
    is_default: boolean;
  };
  const [palettes, setPalettes] = useState<PaletteRow[]>([]);
  const [activePaletteTheme1, setActivePaletteTheme1] = useState<number | null>(
    null
  );
  const [activePaletteTheme2, setActivePaletteTheme2] = useState<number | null>(
    null
  );
  const [paletteTab, setPaletteTab] = useState<number>(1); // which theme's palettes to show
  const [paletteEditorOpen, setPaletteEditorOpen] = useState(false);
  const [editingPalette, setEditingPalette] = useState<PaletteRow | null>(null); // null = creating new
  const [editorName, setEditorName] = useState("");
  const [editorColors, setEditorColors] = useState<Record<string, string>>({});
  const [paletteSaving, setPaletteSaving] = useState(false);

  // --- End Match / Points Management State ---
  const [endMatchMode, setEndMatchMode] = useState<"auto" | "manual">("auto");
  const [endMatchConfirm, setEndMatchConfirm] = useState(false);
  const [endMatchLoading, setEndMatchLoading] = useState(false);
  const [manualPastPts, setManualPastPts] = useState<{ [id: number]: string }>(
    {}
  );

  // Placement points table
  const PLACEMENT_POINTS: { [key: number]: number } = {
    1: 12,
    2: 9,
    3: 8,
    4: 7,
    5: 6,
    6: 5,
    7: 4,
    8: 3,
    9: 2,
    10: 1,
  };
  const getPlacementPoints = (placement: number): number =>
    PLACEMENT_POINTS[placement] ?? 0;

  const handleEndMatchAutomatic = async () => {
    setEndMatchLoading(true);
    setError("");
    // Rank teams by finishes (descending) to determine placement
    const ranked = [...teams]
      .filter((t) => t.show_on_leaderboard ?? true)
      .sort((a, b) => (b.finishes ?? 0) - (a.finishes ?? 0));
    // For each team: match_score = placement_pts + finishes, add to elims (past pts), reset finishes
    for (let i = 0; i < ranked.length; i++) {
      const team = ranked[i];
      const placementPts = getPlacementPoints(i + 1);
      const matchScore = placementPts + (team.finishes ?? 0);
      const newElims = (team.elims ?? 0) + matchScore;
      const { error } = await supabase
        .from("teams")
        .update({ elims: newElims, finishes: 0 })
        .eq("id", team.id);
      if (error) {
        setError(`Error updating ${team.name}: ${error.message}`);
        break;
      }
    }
    // Also reset finishes for hidden teams
    const hiddenTeams = teams.filter((t) => !(t.show_on_leaderboard ?? true));
    for (const team of hiddenTeams) {
      await supabase.from("teams").update({ finishes: 0 }).eq("id", team.id);
    }
    await fetchTeams();
    setEndMatchConfirm(false);
    setEndMatchLoading(false);
  };

  const handleEndMatchManual = async () => {
    setEndMatchLoading(true);
    setError("");
    for (const team of teams) {
      const manualVal = manualPastPts[team.id];
      if (manualVal !== undefined && manualVal !== "") {
        const value = parseInt(manualVal, 10);
        if (!isNaN(value) && value >= 0) {
          const { error } = await supabase
            .from("teams")
            .update({ elims: value, finishes: 0 })
            .eq("id", team.id);
          if (error) {
            setError(`Error updating ${team.name}: ${error.message}`);
            break;
          }
        }
      }
    }
    await fetchTeams();
    setManualPastPts({});
    setEndMatchLoading(false);
  };

  const handleResetPastPoints = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset ALL past points to 0? This cannot be undone."
      )
    )
      return;
    setEndMatchLoading(true);
    setError("");
    for (const team of teams) {
      const { error } = await supabase
        .from("teams")
        .update({ elims: 0 })
        .eq("id", team.id);
      if (error) {
        setError(`Error resetting ${team.name}: ${error.message}`);
        break;
      }
    }
    await fetchTeams();
    setEndMatchLoading(false);
  };

  const FONT_OPTIONS = [
    "Countach",
    "Inter",
    "Roboto",
    "Montserrat",
    "Orbitron",
    "Oswald",
    "Bebas Neue",
    "Rajdhani",
    "Teko",
    "Russo One",
    "Press Start 2P",
    "Black Ops One",
  ];

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
    fetchFontFamilySetting();
    fetchPalettes();
    fetchActivePaletteIds();
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
    if (error) {
      setError(
        `Failed to switch theme: ${error.message}. The 'active_theme' column may be missing from your settings table.`
      );
    } else {
      setActiveThemeSetting(value);
    }
    setActiveThemeLoading(false);
  };

  const fetchFontFamilySetting = async () => {
    setFontFamilyLoading(true);
    const { data, error } = await supabase
      .from("settings")
      .select("font_family")
      .single();
    if (
      !error &&
      data &&
      typeof data.font_family === "string" &&
      data.font_family
    ) {
      setFontFamilySetting(data.font_family);
    }
    setFontFamilyLoading(false);
  };

  const updateFontFamilySetting = async (value: string) => {
    setFontFamilyLoading(true);
    const { error } = await supabase
      .from("settings")
      .update({ font_family: value })
      .eq("id", 1);
    if (!error) {
      setFontFamilySetting(value);
    }
    setFontFamilyLoading(false);
  };

  const fetchTeams = async () => {
    setError("");
    const { data, error } = await supabase
      .from("teams")
      .select(
        "id, name, elims, alive_count, knocked_count, finishes, logo, show_on_leaderboard, outside_zone"
      )
      .order("id", { ascending: true });
    if (!error && data) setTeams(data);
    else setError(error?.message || "Failed to fetch teams");
  };

  // Optimistic update for elims and alive_count
  const updateTeam = async (id: number, changes: Partial<any>) => {
    setRowLoading((prev) => ({ ...prev, [id]: true }));
    setTeams((prevTeams) =>
      prevTeams.map((team) => (team.id === id ? { ...team, ...changes } : team))
    );
    setError("");
    const { error } = await supabase.from("teams").update(changes).eq("id", id);
    if (error) setError(error.message);
    // Optionally, re-fetch to ensure sync
    await fetchTeams();
    setRowLoading((prev) => ({ ...prev, [id]: false }));
  };

  // --- Color Palette CRUD ---
  const fetchPalettes = async () => {
    const { data } = await supabase
      .from("color_palettes")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (data) setPalettes(data as PaletteRow[]);
  };

  const fetchActivePaletteIds = async () => {
    const { data } = await supabase
      .from("settings")
      .select("active_palette_theme1, active_palette_theme2")
      .single<{
        active_palette_theme1?: number;
        active_palette_theme2?: number;
      }>();
    if (data) {
      if (typeof data.active_palette_theme1 === "number")
        setActivePaletteTheme1(data.active_palette_theme1);
      if (typeof data.active_palette_theme2 === "number")
        setActivePaletteTheme2(data.active_palette_theme2);
    }
  };

  const setActivePalette = async (themeNum: number, paletteId: number) => {
    const col =
      themeNum === 2 ? "active_palette_theme2" : "active_palette_theme1";
    await supabase
      .from("settings")
      .update({ [col]: paletteId })
      .eq("id", 1);
    if (themeNum === 2) setActivePaletteTheme2(paletteId);
    else setActivePaletteTheme1(paletteId);
  };

  const savePalette = async () => {
    setPaletteSaving(true);
    if (editingPalette) {
      // Update existing
      await supabase
        .from("color_palettes")
        .update({ name: editorName, colors: editorColors })
        .eq("id", editingPalette.id);
    } else {
      // Create new
      await supabase.from("color_palettes").insert({
        theme_number: paletteTab,
        name: editorName || "Custom",
        colors: editorColors,
        is_default: false,
      });
    }
    setPaletteSaving(false);
    setPaletteEditorOpen(false);
    setEditingPalette(null);
    fetchPalettes();
  };

  const deletePalette = async (id: number, themeNum: number) => {
    await supabase.from("color_palettes").delete().eq("id", id);
    // If this was the active palette, revert to default
    const activeId = themeNum === 2 ? activePaletteTheme2 : activePaletteTheme1;
    if (activeId === id) {
      const defaultPalette = palettes.find(
        (p) => p.theme_number === themeNum && p.is_default
      );
      if (defaultPalette) setActivePalette(themeNum, defaultPalette.id);
    }
    fetchPalettes();
  };

  const openCreateEditor = () => {
    const defaults =
      paletteTab === 2
        ? (DEFAULT_THEME2_PALETTE as Record<string, string>)
        : (DEFAULT_THEME1_PALETTE as Record<string, string>);
    setEditingPalette(null);
    setEditorName("");
    setEditorColors({ ...defaults });
    setPaletteEditorOpen(true);
  };

  const openEditEditor = (palette: PaletteRow) => {
    setEditingPalette(palette);
    setEditorName(palette.name);
    setEditorColors({ ...palette.colors });
    setPaletteEditorOpen(true);
  };

  const PALETTE_COLOR_LABELS: Record<number, Record<string, string>> = {
    1: {
      bgMain: "Background",
      rowGradientFrom: "Row Gradient Start",
      rowGradientTo: "Row Gradient End",
      headerGradientFrom: "Header Gradient Start",
      headerGradientTo: "Header Gradient End",
      aliveColor: "Alive Status",
      knockedColor: "Knocked Status",
      elimColor: "Eliminated Status",
      outsideZoneColor: "Outside Zone",
    },
    2: {
      headerGradientFrom: "Header Gradient Start",
      headerGradientTo: "Header Gradient End",
      bodyGradientFrom: "Body Gradient Start",
      bodyGradientTo: "Body Gradient End",
      accentBg: "Accent Background",
      aliveColor: "Alive Status",
      elimColor: "Eliminated Status",
      outsideZoneColor: "Outside Zone",
    },
  };

  return (
    <div className="space-y-6">
      {/* Team Management */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Team Management
            </h2>
          </div>

          {/* Settings Grid */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Show Logos */}
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="flex items-center gap-2.5">
                {showLogosSetting ? (
                  <Image className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ImageOff className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-slate-200 font-medium text-sm">
                  Team Logos
                </span>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showLogosSetting ? "bg-emerald-500" : "bg-slate-600"}`}
                onClick={() => updateShowLogosSetting(!showLogosSetting)}
                disabled={showLogosLoading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${showLogosSetting ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="flex items-center gap-2.5">
                {showLeaderboardSetting ? (
                  <Eye className="w-4 h-4 text-emerald-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                )}
                <span className="text-slate-200 font-medium text-sm">
                  Leaderboard Visible
                </span>
              </div>
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showLeaderboardSetting ? "bg-emerald-500" : "bg-slate-600"}`}
                onClick={() =>
                  updateShowLeaderboardSetting(!showLeaderboardSetting)
                }
                disabled={showLeaderboardLoading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${showLeaderboardSetting ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>
          </div>

          <span className="text-slate-500 text-xs">
            (Press L key on leaderboard page to toggle visibility)
          </span>

          {/* Active Theme */}
          <div className="flex flex-wrap items-center gap-3 mb-4 mt-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium text-sm">Theme</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_THEMES }, (_, i) => i + 1).map(
                (themeNum) => (
                  <button
                    key={themeNum}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      activeThemeSetting === themeNum
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/50"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300"
                    }`}
                    onClick={() => updateActiveThemeSetting(themeNum)}
                    disabled={activeThemeLoading}
                  >
                    Theme {themeNum}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Font Family */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium text-sm">Font</span>
            </div>
            <div className="relative" style={{ minWidth: 220 }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 text-white text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder-slate-500"
                type="text"
                placeholder="Search fonts..."
                value={fontSearchInput}
                onChange={(e) => {
                  setFontSearchInput(e.target.value);
                  setFontDropdownOpen(true);
                }}
                onFocus={() => {
                  setFontDropdownOpen(true);
                  if (!fontSearchInput) setFontSearchInput("");
                }}
                onBlur={() => {
                  setTimeout(() => setFontDropdownOpen(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const match = FONT_OPTIONS.find(
                      (f) =>
                        f.toLowerCase() === fontSearchInput.trim().toLowerCase()
                    );
                    const value = match || fontSearchInput.trim();
                    if (value) {
                      updateFontFamilySetting(value);
                      setFontSearchInput("");
                      setFontDropdownOpen(false);
                    }
                  }
                  if (e.key === "Escape") {
                    setFontSearchInput("");
                    setFontDropdownOpen(false);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                disabled={fontFamilyLoading}
              />
              {fontDropdownOpen &&
                (() => {
                  const query = fontSearchInput.toLowerCase();
                  const filtered = FONT_OPTIONS.filter((f) =>
                    f.toLowerCase().includes(query)
                  );
                  if (filtered.length === 0 && !fontSearchInput.trim())
                    return null;
                  return (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {filtered.map((font) => (
                        <button
                          key={font}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            fontFamilySetting === font
                              ? "bg-indigo-500/20 text-indigo-300 font-semibold"
                              : "text-slate-300 hover:bg-slate-700"
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            updateFontFamilySetting(font);
                            setFontSearchInput("");
                            setFontDropdownOpen(false);
                          }}
                        >
                          <span className="flex items-center justify-between">
                            <span>{font}</span>
                            <span className="flex items-center gap-1">
                              {font === "Countach" && (
                                <Star className="w-3 h-3 text-amber-400" />
                              )}
                              {fontFamilySetting === font && (
                                <Check className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </span>
                          </span>
                        </button>
                      ))}
                      {fontSearchInput.trim() &&
                        !FONT_OPTIONS.some(
                          (f) =>
                            f.toLowerCase() ===
                            fontSearchInput.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-amber-300 hover:bg-slate-700 border-t border-slate-700 transition-colors last:rounded-b-xl"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              updateFontFamilySetting(fontSearchInput.trim());
                              setFontSearchInput("");
                              setFontDropdownOpen(false);
                            }}
                          >
                            Use &quot;{fontSearchInput.trim()}&quot; from Google
                            Fonts
                          </button>
                        )}
                    </div>
                  );
                })()}
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              {fontFamilySetting}
              {fontFamilyLoading && " ..."}
            </span>
          </div>

          {/* Add Team Form */}
          <div className="border-t border-slate-800 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 font-medium text-sm">
                Add New Team
              </span>
            </div>
            <form
              className="flex flex-wrap gap-3 items-end"
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
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-medium">
                  Team Name
                </label>
                <input
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  type="text"
                  placeholder="Enter team name"
                  value={addTeamName}
                  onChange={(e) => setAddTeamName(e.target.value)}
                  required
                  disabled={addTeamLoading}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-medium">
                  Logo URL
                </label>
                <input
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  type="text"
                  placeholder="https://... (optional)"
                  value={addTeamLogo}
                  onChange={(e) => setAddTeamLogo(e.target.value)}
                  disabled={addTeamLoading}
                />
              </div>
              <button
                className="flex items-center gap-2 bg-indigo-500 px-5 py-2 rounded-lg text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 shadow-lg shadow-indigo-500/20 transition-all self-end"
                type="submit"
                disabled={addTeamLoading || !addTeamName.trim()}
              >
                <Plus className="w-4 h-4" />
                {addTeamLoading ? "Adding..." : "Add Team"}
              </button>
            </form>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <span className="text-rose-400 text-sm font-medium">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match & Points Management */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Match & Points
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
            <span className="text-slate-400 font-medium text-sm">Mode:</span>
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  endMatchMode === "auto"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-300"
                }`}
                onClick={() => setEndMatchMode("auto")}
              >
                <Zap className="w-3.5 h-3.5" />
                Automatic
              </button>
              <button
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  endMatchMode === "manual"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-300"
                }`}
                onClick={() => setEndMatchMode("manual")}
              >
                <PenLine className="w-3.5 h-3.5" />
                Manual
              </button>
            </div>
          </div>

          {endMatchMode === "auto" && (
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Teams ranked by current finishes (kills). Placement points
                awarded automatically:
                <span className="text-amber-300 font-medium">
                  {" "}
                  1st=10, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7-8th=1, 9th+=0
                </span>
                . Each team&apos;s match score (placement pts + kills) is added
                to past points, then finishes reset to 0.
              </p>
              {!endMatchConfirm ? (
                <button
                  className="flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                  onClick={() => setEndMatchConfirm(true)}
                  disabled={endMatchLoading}
                >
                  <Flag className="w-4 h-4" />
                  End Match
                </button>
              ) : (
                <div className="bg-slate-800/80 rounded-xl p-5 border border-amber-500/20">
                  <h4 className="text-amber-300 font-bold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Preview: Placement Points
                  </h4>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm text-white">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">
                            Team
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            Kills
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            Place Pts
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            Match Score
                          </th>
                          <th className="px-3 py-2 text-center font-medium">
                            New Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...teams]
                          .filter((t) => t.show_on_leaderboard ?? true)
                          .sort((a, b) => (b.finishes ?? 0) - (a.finishes ?? 0))
                          .map((team, i) => {
                            const placePts = getPlacementPoints(i + 1);
                            const matchScore = placePts + (team.finishes ?? 0);
                            return (
                              <tr
                                key={team.id}
                                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                              >
                                <td className="px-3 py-2 text-slate-400">
                                  {i + 1}
                                </td>
                                <td className="px-3 py-2 font-semibold">
                                  {team.name}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {team.finishes ?? 0}
                                </td>
                                <td className="px-3 py-2 text-center text-amber-300 font-medium">
                                  +{placePts}
                                </td>
                                <td className="px-3 py-2 text-center text-emerald-400 font-bold">
                                  {matchScore}
                                </td>
                                <td className="px-3 py-2 text-center text-white font-bold">
                                  {(team.elims ?? 0) + matchScore}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex items-center gap-2 bg-rose-500 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow hover:bg-rose-600 disabled:opacity-50 transition-all"
                      onClick={handleEndMatchAutomatic}
                      disabled={endMatchLoading}
                    >
                      <Check className="w-4 h-4" />
                      {endMatchLoading ? "Processing..." : "Confirm End Match"}
                    </button>
                    <button
                      className="bg-slate-700 text-slate-300 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-600 transition-all"
                      onClick={() => setEndMatchConfirm(false)}
                      disabled={endMatchLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {endMatchMode === "manual" && (
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Manually set past points for each team. This overwrites the
                current past points and resets finishes to 0.
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm text-white">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="px-3 py-2 text-left font-medium">Team</th>
                      <th className="px-3 py-2 text-center font-medium">
                        Current Past Pts
                      </th>
                      <th className="px-3 py-2 text-center font-medium">
                        New Past Pts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr
                        key={team.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-3 py-2 font-semibold">{team.name}</td>
                        <td className="px-3 py-2 text-center text-slate-400">
                          {team.elims ?? 0}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-white text-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={manualPastPts[team.id] ?? ""}
                            onChange={(e) =>
                              setManualPastPts((prev) => ({
                                ...prev,
                                [team.id]: e.target.value,
                              }))
                            }
                            placeholder={String(team.elims ?? 0)}
                            min={0}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 disabled:opacity-50 transition-all"
                onClick={handleEndMatchManual}
                disabled={endMatchLoading}
              >
                <Save className="w-4 h-4" />
                {endMatchLoading
                  ? "Saving..."
                  : "Save Past Points & Reset Finishes"}
              </button>
            </div>
          )}

          {/* Reset Past Points */}
          <div className="border-t border-slate-800 pt-4 mt-2">
            <button
              className="flex items-center gap-2 bg-slate-800 text-rose-400 border border-slate-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-50 transition-all"
              onClick={handleResetPastPoints}
              disabled={endMatchLoading}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Past Points to 0
            </button>
            <span className="text-slate-600 text-xs ml-2">
              (cannot be undone)
            </span>
          </div>
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Teams List
            </h3>
          </div>
        </div>
        <div
          className="w-full overflow-x-auto pb-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            className="min-w-[900px] max-w-full mx-auto px-2 sm:px-4"
            style={{ overflow: "auto", maxHeight: "60vh" }}
          >
            <table className="w-full text-white text-center border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800/90 backdrop-blur-sm">
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider first:rounded-tl-lg">
                    #
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">
                    Team Name
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total PTS
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Alive
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Knocked
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Finishes
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Show?
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider last:rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, idx) => (
                  <tr
                    key={team.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors group"
                    style={{ height: 56 }}
                  >
                    <td className="px-3 py-2 font-bold text-slate-500 align-middle">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 align-middle text-left">
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
                            className="px-2.5 py-1.5 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            disabled={editNameLoading}
                            autoFocus
                            required
                          />
                          <button
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                            type="submit"
                            disabled={editNameLoading || !editNameValue.trim()}
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-50 transition-all"
                            type="button"
                            onClick={() => {
                              setEditNameId(null);
                              setEditNameValue("");
                            }}
                            disabled={editNameLoading}
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{team.name}</span>
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
                            onClick={() => {
                              setEditNameId(team.id);
                              setEditNameValue(team.name);
                            }}
                            disabled={rowLoading[team.id]}
                            title="Edit team name"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </td>
                    {/* Total PTS */}
                    <td className="px-3 py-2 align-middle">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-lg text-amber-300">
                          {(team.elims ?? 0) + (team.finishes ?? 0)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({team.elims ?? 0} past + {team.finishes ?? 0} kills)
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-sm hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-all"
                          onClick={() => {
                            updateTeam(team.id, {
                              alive_count: team.alive_count - 1,
                            });
                          }}
                          disabled={
                            rowLoading[team.id] || team.alive_count <= 0
                          }
                          aria-label="Decrease alive count"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">
                          {team.alive_count}
                        </span>
                        <button
                          className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center text-sm hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-all"
                          onClick={() => {
                            updateTeam(team.id, {
                              alive_count: team.alive_count + 1,
                            });
                          }}
                          disabled={
                            rowLoading[team.id] || team.alive_count >= 4
                          }
                          aria-label="Increase alive count"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {/* Knocked */}
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="w-7 h-7 rounded-lg bg-slate-800 border border-amber-600/30 text-amber-400 font-bold flex items-center justify-center text-sm hover:bg-amber-500/10 disabled:opacity-30 transition-all"
                          onClick={() => {
                            updateTeam(team.id, {
                              knocked_count: (team.knocked_count ?? 0) - 1,
                            });
                          }}
                          disabled={
                            rowLoading[team.id] ||
                            (team.knocked_count ?? 0) <= 0
                          }
                          aria-label="Decrease knocked count"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-semibold text-sm">
                          {team.knocked_count ?? 0}
                        </span>
                        <button
                          className="w-7 h-7 rounded-lg bg-slate-800 border border-amber-600/30 text-amber-400 font-bold flex items-center justify-center text-sm hover:bg-amber-500/10 disabled:opacity-30 transition-all"
                          onClick={() => {
                            updateTeam(team.id, {
                              knocked_count: (team.knocked_count ?? 0) + 1,
                            });
                          }}
                          disabled={rowLoading[team.id]}
                          aria-label="Increase knocked count"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    {/* Finishes */}
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-white text-center font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={
                            editingFinishesId === team.id
                              ? editingFinishesValue
                              : (team.finishes ?? 0)
                          }
                          onFocus={() => {
                            setEditingFinishesId(team.id);
                            setEditingFinishesValue(String(team.finishes ?? 0));
                          }}
                          onChange={(e) => {
                            setEditingFinishesValue(e.target.value);
                          }}
                          onBlur={() => {
                            const value = parseInt(editingFinishesValue, 10);
                            if (
                              !isNaN(value) &&
                              value >= 0 &&
                              value !== (team.finishes ?? 0)
                            ) {
                              updateTeam(team.id, { finishes: value });
                            } else if (isNaN(value) || value < 0) {
                              updateTeam(team.id, { finishes: 0 });
                            }
                            setEditingFinishesId(null);
                            setEditingFinishesValue("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            } else if (e.key === "Escape") {
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
                    {/* Logo */}
                    <td className="px-3 py-2 align-middle">
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
                            className="px-2 py-1.5 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-32 transition-all"
                            type="text"
                            value={editLogoValue}
                            onChange={(e) => setEditLogoValue(e.target.value)}
                            disabled={editLogoLoading}
                            placeholder="Logo URL"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                              type="submit"
                              disabled={editLogoLoading}
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-50 transition-all"
                              type="button"
                              onClick={() => {
                                setEditLogoId(null);
                                setEditLogoValue("");
                              }}
                              disabled={editLogoLoading}
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          {team.logo ? (
                            <img
                              src={team.logo}
                              alt="logo"
                              className="w-10 h-10 mx-auto rounded-lg bg-white/5 object-contain border border-slate-700 shadow-sm"
                            />
                          ) : (
                            <span className="text-xs text-slate-600">
                              No logo
                            </span>
                          )}
                          <button
                            className="opacity-0 group-hover:opacity-100 mt-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-all"
                            onClick={() => {
                              setEditLogoId(team.id);
                              setEditLogoValue(team.logo || "");
                            }}
                            disabled={rowLoading[team.id]}
                            title="Change logo"
                          >
                            Change
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <button
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${(team.show_on_leaderboard ?? true) ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"}`}
                        onClick={() =>
                          updateTeam(team.id, {
                            show_on_leaderboard: !(
                              team.show_on_leaderboard ?? true
                            ),
                          })
                        }
                        disabled={rowLoading[team.id]}
                      >
                        {(team.show_on_leaderboard ?? true)
                          ? "Shown"
                          : "Hidden"}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <button
                        className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${team.outside_zone ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"}`}
                        onClick={() =>
                          updateTeam(team.id, {
                            outside_zone: !(team.outside_zone ?? false),
                          })
                        }
                        disabled={rowLoading[team.id]}
                      >
                        {team.outside_zone ? "Outside" : "In Zone"}
                      </button>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <button
                        className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-rose-400 font-semibold text-xs hover:bg-rose-500/10 hover:border-rose-500/30 disabled:opacity-50 transition-all"
                        onClick={() => removeTeam(team.id)}
                        disabled={deleteLoading[team.id]}
                      >
                        <Trash2 className="w-3 h-3" />
                        {deleteLoading[team.id] ? "..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Color Palettes */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-violet-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Color Palettes
            </h2>
          </div>

          {/* Theme Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 w-fit mb-5">
            {[1, 2].map((t) => (
              <button
                key={t}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
                  paletteTab === t
                    ? "bg-violet-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-300"
                }`}
                onClick={() => {
                  setPaletteTab(t);
                  setPaletteEditorOpen(false);
                }}
              >
                Theme {t}
              </button>
            ))}
          </div>

          {/* Palette Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {palettes
              .filter((p) => p.theme_number === paletteTab)
              .map((palette) => {
                const isActive =
                  paletteTab === 1
                    ? activePaletteTheme1 === palette.id
                    : activePaletteTheme2 === palette.id;
                const colors = Object.values(palette.colors);
                return (
                  <div
                    key={palette.id}
                    className={`relative rounded-xl p-4 border transition-all cursor-pointer group ${
                      isActive
                        ? "border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/30"
                        : "border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60"
                    }`}
                    onClick={() => setActivePalette(paletteTab, palette.id)}
                  >
                    {/* Active Badge */}
                    {isActive && (
                      <span className="absolute -top-2 -right-2 bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-violet-500/30">
                        ACTIVE
                      </span>
                    )}

                    {/* Palette Name */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-white text-sm">
                        {palette.name}
                        {palette.is_default && (
                          <span className="ml-1.5 text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                            DEFAULT
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex gap-1.5 mb-3">
                      {colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-md border border-white/10 shadow-sm"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!palette.is_default && (
                        <>
                          <button
                            className="flex items-center gap-1 text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-600 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditEditor(palette);
                            }}
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            className="flex items-center gap-1 text-xs bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded-lg hover:bg-rose-500/20 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete palette "${palette.name}"?`))
                                deletePalette(palette.id, palette.theme_number);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Create New Palette Card */}
            <div
              className="rounded-xl p-4 border border-dashed border-slate-700 bg-slate-800/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all min-h-[120px]"
              onClick={openCreateEditor}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Plus className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-sm text-slate-500 font-medium">
                New Palette
              </span>
            </div>
          </div>

          {/* Palette Editor */}
          {paletteEditorOpen && (
            <div className="bg-slate-800/80 rounded-xl border border-violet-500/20 p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">
                  {editingPalette
                    ? `Edit "${editingPalette.name}"`
                    : "Create New Palette"}
                </h3>
                <button
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                  onClick={() => setPaletteEditorOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Name Input */}
              <div className="mb-5">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Palette Name
                </label>
                <input
                  className="w-full max-w-xs px-3 py-2 rounded-lg bg-slate-900 text-white text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder-slate-500 transition-all"
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  placeholder="e.g. Neon Night, Ocean Breeze..."
                />
              </div>

              {/* Color Pickers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
                {Object.entries(PALETTE_COLOR_LABELS[paletteTab] || {}).map(
                  ([key, label]) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 font-medium">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editorColors[key] || "#000000"}
                          onChange={(e) =>
                            setEditorColors((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-8 h-8 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={editorColors[key] || ""}
                          onChange={(e) =>
                            setEditorColors((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 text-white text-xs border border-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder-slate-600 transition-all"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Preview Strip */}
              <div className="mb-5">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Preview
                </label>
                <div className="flex gap-1 p-2.5 bg-slate-900 rounded-lg border border-slate-700">
                  {Object.entries(editorColors).map(([key, color]) => (
                    <div
                      key={key}
                      className="flex-1 h-8 rounded-md border border-white/5"
                      style={{ background: color }}
                      title={`${PALETTE_COLOR_LABELS[paletteTab]?.[key] || key}: ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-2 bg-violet-500 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-violet-600 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20"
                  onClick={savePalette}
                  disabled={paletteSaving || !editorName.trim()}
                >
                  <Save className="w-4 h-4" />
                  {paletteSaving
                    ? "Saving..."
                    : editingPalette
                      ? "Update Palette"
                      : "Create Palette"}
                </button>
                <button
                  className="bg-slate-700 text-slate-300 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-600 transition-all"
                  onClick={() => setPaletteEditorOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
