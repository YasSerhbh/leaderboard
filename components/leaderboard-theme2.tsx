import React from "react";
import { Team } from "./leaderboard-theme1";

export type Theme2Palette = {
    headerGradientFrom: string;
    headerGradientTo: string;
    bodyGradientFrom: string;
    bodyGradientTo: string;
    accentBg: string;
    aliveColor: string;
    elimColor: string;
};

export const DEFAULT_THEME2_PALETTE: Theme2Palette = {
    headerGradientFrom: '#0a4209',
    headerGradientTo: '#072800',
    bodyGradientFrom: '#0f5a0d',
    bodyGradientTo: '#082f02',
    accentBg: '#f2e4b4',
    aliveColor: '#0f5a0d',
    elimColor: '#bc1a26',
};

interface LeaderboardTheme2Props {
    teams: Team[];
    showLogos?: boolean;
    fontFamily?: string;
    colorPalette?: Partial<Theme2Palette>;
}

export const LeaderboardTheme2: React.FC<LeaderboardTheme2Props> = ({ teams, showLogos = true, fontFamily, colorPalette }) => {
    // Only show teams where show_on_leaderboard is true (default to true if null/undefined)
    const visibleTeams = teams
        .filter((team) => team.show_on_leaderboard === true || team.show_on_leaderboard == null)
        .sort((a, b) => b.elims - a.elims); // Descending by total points (elims)

    // Dimensions
    const tableWidth = 260;
    const headerHeight = 22;
    const rowHeight = 22;
    const rankColWidth = 22;
    const logoColWidth = 24;
    const teamNameColWidth = 58;
    const finColWidth = 30;
    const ptsColWidth = 38;
    const statusColWidth = 44;
    const statusBarCount = 4;

    // Merge palette with defaults
    const p = { ...DEFAULT_THEME2_PALETTE, ...colorPalette };

    // Colors derived from palette
    const textColor = '#ffffff';
    const aliveColor = p.aliveColor;
    const elimColor = p.elimColor;
    // const outsideZoneColor = '#0068ed';

    // Determine the font to use: default to Countach local font, otherwise use provided Google Font
    const resolvedFont = (!fontFamily || fontFamily === 'Countach')
        ? 'var(--font-countach), sans-serif'
        : `"${fontFamily}", sans-serif`;

    return (
        <div
            style={{
                width: tableWidth,
                borderRadius: 0,
                padding: 0,
                fontFamily: resolvedFont,
                color: textColor,
                overflow: 'hidden',
            }}
        >
            <table
                style={{
                    borderCollapse: 'collapse',
                    borderSpacing: 0,
                    width: tableWidth,
                    tableLayout: 'fixed',
                }}
            >
                <colgroup>
                    <col style={{ width: rankColWidth }} />
                    {showLogos && <col style={{ width: logoColWidth }} />}
                    <col style={{ width: teamNameColWidth }} />
                    <col style={{ width: finColWidth }} />
                    <col style={{ width: ptsColWidth }} />
                    <col style={{ width: statusColWidth }} />
                </colgroup>
                <thead>
                    <tr
                        style={{
                            background: `linear-gradient(to right, ${p.headerGradientFrom}, ${p.headerGradientTo})`,
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: 10,
                            letterSpacing: 1.2,
                            height: headerHeight,
                            textTransform: 'uppercase',
                            border: 'none',
                        }}
                    >
                        <th style={{ padding: 0, fontWeight: 600, color: '#fff' }}>#</th>
                        {showLogos && (
                            <th style={{ padding: 0, fontWeight: 600 }}> </th>
                        )}
                        <th style={{ padding: '0 4px', fontWeight: 600, color: '#fff', textAlign: 'left' }}>TEAM</th>
                        <th style={{ padding: 0, fontWeight: 600, color: '#fff' }}>FIN.</th>
                        <th style={{ padding: 0, fontWeight: 600, color: '#fff' }}>TOT. PTS.</th>
                        <th style={{ padding: 0, fontWeight: 600, color: '#fff' }}>STATUS</th>
                    </tr>
                </thead>
                <tbody style={{ border: '1px solid #0d0a2a', background: `linear-gradient(to top right, ${p.bodyGradientFrom}, ${p.bodyGradientTo})` }}>
                    {visibleTeams.map((team, idx) => {
                        // In theme2, knocked counts as alive
                        const effectiveAlive = team.aliveCount + (team.knockedCount ?? 0);
                        const isEliminated = effectiveAlive === 0;
                        const displayName = team.name.slice(0, 3).toUpperCase();
                        return (
                            <tr
                                key={team.id}
                                style={{
                                    height: rowHeight,
                                    fontSize: 15,
                                    fontWeight: 400,
                                    borderBottom: '1px solid #0d0a2a',
                                    background: isEliminated
                                        ? `linear-gradient(to right, ${p.bodyGradientFrom}, ${p.bodyGradientTo})`
                                        : 'transparent',
                                    filter: isEliminated ? 'brightness(0.35)' : 'none',
                                    transition: 'filter 0.3s ease, background 0.3s ease',
                                }}
                            >
                                {/* Rank */}
                                <td style={{
                                    padding: 0,
                                    textAlign: 'center',
                                    fontSize: 15,
                                    fontWeight: 400,
                                    background: 'transparent',
                                    color: '#fff',
                                }}>
                                    {idx + 1}
                                </td>
                                {/* Logo */}
                                {showLogos && (
                                    <td style={{
                                        padding: 0,
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                        background: 'transparent',
                                    }}>
                                        {team.logo ? (
                                            <img
                                                src={team.logo}
                                                alt={team.name + ' logo'}
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    objectFit: 'contain',
                                                    borderRadius: 2,
                                                    background: 'rgba(255,255,255,0.08)',
                                                    verticalAlign: 'middle',
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: 2,
                                                background: 'rgba(255,255,255,0.05)',
                                                display: 'inline-block',
                                            }} />
                                        )}
                                    </td>
                                )}
                                {/* Team name */}
                                <td style={{
                                    padding: '0 4px',
                                    fontWeight: 400,
                                    fontSize: 15,
                                    letterSpacing: 1,
                                    textAlign: 'left',
                                    background: 'transparent',
                                    color: '#fff',
                                }}>
                                    {displayName}
                                </td>
                                {/* FIN */}
                                <td style={{
                                    padding: 0,
                                    textAlign: 'center',
                                    fontSize: 15,
                                    fontWeight: 400,
                                    background: p.accentBg,
                                    color: '#222',
                                }}>
                                    {team.finishes}
                                </td>
                                {/* TOT. PTS */}
                                <td style={{
                                    padding: 0,
                                    textAlign: 'center',
                                    fontSize: 16,
                                    fontWeight: 400,
                                    background: p.accentBg,
                                    color: '#111',
                                }}>
                                    {team.elims}
                                </td>
                                {/* STATUS */}
                                <td style={{
                                    padding: 0,
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    background: p.accentBg,
                                }}>
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                                        {[...Array(statusBarCount)].map((_, i) => {
                                            // Knocked counts as alive in theme2
                                            const barColor = i < effectiveAlive ? aliveColor : elimColor;
                                            return (
                                                <span
                                                    key={i}
                                                    style={{
                                                        display: 'inline-block',
                                                        width: 4,
                                                        height: 16,
                                                        borderRadius: 1,
                                                        background: barColor,
                                                        border: '1px solid rgba(0,0,0,0.15)',
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {/* Legend bar — outside the table so no bg bleed on sides */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                background: 'transparent',
            }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 20,
                        width: '90%',
                        background: '#1a1a1a',
                        height: 24,
                        fontSize: 10,
                        fontWeight: 400,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        clipPath: 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                            display: 'inline-block',
                            width: 12,
                            height: 10,
                            background: aliveColor,
                        }} />
                        <span style={{ color: '#fff' }}>ALIVE</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                            display: 'inline-block',
                            width: 12,
                            height: 10,
                            background: elimColor,
                        }} />
                        <span style={{ color: '#fff' }}>ELIMINATED</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
