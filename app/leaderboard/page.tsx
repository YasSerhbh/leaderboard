/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { ThemedLeaderboard, Team } from "../../components/leaderboard-themed";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

export default function LiveLeaderboard2Page() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [showLogos, setShowLogos] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);
    const [activeTheme, setActiveTheme] = useState(1);
    const [fontFamily, setFontFamily] = useState<string>('Countach');
    const [colorPalette, setColorPalette] = useState<Record<string, string> | undefined>(undefined);

    // Dynamically load Google Font when fontFamily changes
    useEffect(() => {
        if (!fontFamily || fontFamily === 'Countach') return;
        const linkId = `google-font-${fontFamily.replace(/\s+/g, '-')}`;
        if (document.getElementById(linkId)) return; // already loaded
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600;700;800&display=swap`;
        document.head.appendChild(link);
    }, [fontFamily]);

    // Handle animation end to remove from DOM after slide-out
    const handleAnimationEnd = useCallback(() => {
        if (!isVisible) {
            setShouldRender(false);
        }
    }, [isVisible]);

    // When visibility changes to true, ensure we render before animating
    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
        }
    }, [isVisible]);

    // Keyboard hotkey support - press 'L' to toggle leaderboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'l' || e.key === 'L') {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    return;
                }
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!supabase) return;
        // Initial fetch
        const fetchTeams = async () => {
            const { data, error } = await supabase
                .from("teams")
                .select("id, name, elims, alive_count, knocked_count, finishes, logo, show_on_leaderboard, outside_zone")
                .order("id", { ascending: true });
            if (!error && data) {
                setTeams(
                    data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        elims: t.elims,
                        aliveCount: t.alive_count,
                        knockedCount: t.knocked_count ?? 0,
                        finishes: t.finishes ?? 0,
                        logo: t.logo,
                        show_on_leaderboard: t.show_on_leaderboard,
                        outsideZone: t.outside_zone,
                    }))
                );
            } else {
                setTeams([]);
            }
        };
        // Fetch global settings (visibility, logos, theme, font)
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from("settings")
                .select("show_logos, show_leaderboard")
                .single<{ show_logos: boolean; show_leaderboard?: boolean }>();
            if (!error && data) {
                if (typeof data.show_logos === "boolean") {
                    setShowLogos(data.show_logos);
                }
                if (typeof data.show_leaderboard === "boolean") {
                    setIsVisible(data.show_leaderboard);
                }
            }
            // Fetch active_theme, font_family, and palette IDs separately so a missing column doesn't break the rest
            const { data: themeData } = await supabase
                .from("settings")
                .select("active_theme, font_family, active_palette_theme1, active_palette_theme2")
                .single<{ active_theme?: number; font_family?: string; active_palette_theme1?: number; active_palette_theme2?: number }>();
            if (themeData) {
                const theme = typeof themeData.active_theme === "number" ? themeData.active_theme : 1;
                setActiveTheme(theme);
                if (typeof themeData.font_family === "string" && themeData.font_family) {
                    setFontFamily(themeData.font_family);
                }
                // Fetch the active palette colors
                const paletteId = theme === 2 ? themeData.active_palette_theme2 : themeData.active_palette_theme1;
                if (paletteId) {
                    const { data: paletteData } = await supabase
                        .from("color_palettes")
                        .select("colors")
                        .eq("id", paletteId)
                        .single<{ colors: Record<string, string> }>();
                    if (paletteData?.colors) {
                        setColorPalette(paletteData.colors);
                    }
                }
            }
        };
        fetchTeams();
        fetchSettings();
        // Subscribe to teams changes
        const teamsChannel = supabase
            .channel("teams-updates-lb2")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "teams" },
                (_payload) => {
                    fetchTeams();
                }
            )
            .subscribe();
        // Subscribe to settings changes (for visibility toggle & theme switching from admin)
        const settingsChannel = supabase
            .channel("settings-updates-lb2")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "settings" },
                (_payload) => {
                    fetchSettings();
                }
            )
            .subscribe();
        // Subscribe to color_palettes changes (for live palette edits)
        const palettesChannel = supabase
            .channel("palettes-updates-lb2")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "color_palettes" },
                (_payload) => {
                    fetchSettings(); // re-fetch to get updated palette colors
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(teamsChannel);
            supabase.removeChannel(settingsChannel);
            supabase.removeChannel(palettesChannel);
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
            className="min-h-screen bg-[#2E2EFF] flex flex-col items-end justify-end"
            style={{ padding: 5 }}
        >
            <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        
        .leaderboard-enter {
          animation: slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .leaderboard-exit {
          animation: slideOutRight 0.35s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
        }
      `}</style>

            {shouldRender && (
                <div
                    className={isVisible ? 'leaderboard-enter' : 'leaderboard-exit'}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <ThemedLeaderboard teams={teams} showLogos={showLogos} activeTheme={activeTheme} fontFamily={fontFamily} colorPalette={colorPalette} />
                </div>
            )}
        </main>
    );
}
