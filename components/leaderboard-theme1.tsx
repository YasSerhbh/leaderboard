import React from "react";


export type Team = {
    id: number;
    name: string;
    elims: number;
    aliveCount: number; // 0-4, number of alive squad members
    knockedCount: number; // 0-4, number of knocked squad members
    finishes: number; // number of finishes/placement
    logo?: string | null; // optional logo url
    show_on_leaderboard?: boolean; // optional, for filtering
    outsideZone?: boolean; // optional, blue overlay when outside zone
};


interface LeaderboardTheme1Props {
    teams: Team[];
    showLogos?: boolean;
}



export const LeaderboardTheme1: React.FC<LeaderboardTheme1Props> = ({ teams, showLogos = true }) => {
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

    // Colors matching reference image
    const bgMain = '#1b1464';        // deep navy/indigo
    const bgHeader = '#12103a';      // darker header
    const headerTextColor = '#c8c8ff'; // light blue/lavender header text
    const rowGradient = 'linear-gradient(to right, #3d1b95, #300c77)';
    const borderColor = '#2d2799';   // subtle purple border
    const textColor = '#ffffff';
    const aliveColor = '#5c00e8';    // blue/indigo status bar
    const knockedColor = '#fee44b';  // gold/yellow
    const elimColor = '#c5152f';     // red
    const outsideZoneColor = '#0068ed'; // blue overlay for outside zone
    // #0068ed

    return (
        <div
            style={{
                width: tableWidth,
                background: bgMain,
                borderRadius: 0,
                boxShadow: '0 4px 32px 0 rgba(0,0,0,0.45)',
                // border: `2px solid ${borderColor}`,
                padding: 0,
                fontFamily: "var(--font-countach), sans-serif",
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
                            background: 'linear-gradient(to right, #2d0182, #190d34)',
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
                <tbody style={{ border: '1px solid #0d0a2a' }}>
                    {visibleTeams.map((team, idx) => {
                        const isEliminated = team.aliveCount === 0;
                        const displayName = team.name.slice(0, 3).toUpperCase();
                        const isOutsideZone = team.outsideZone === true;
                        // Purple side: blue when outside zone, normal gradient otherwise
                        const purpleSideBg = isOutsideZone ? outsideZoneColor : rowGradient;
                        return (
                            <tr
                                key={team.id}
                                style={{
                                    height: rowHeight,
                                    fontSize: 15,
                                    fontWeight: 400,
                                    borderBottom: '1px solid #0d0a2a',
                                    background: purpleSideBg,
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
                                    background: '#fff',
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
                                    background: '#fff',
                                    color: '#111',
                                }}>
                                    {team.elims}
                                </td>
                                {/* STATUS */}
                                <td style={{
                                    padding: 0,
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    background: '#fff',
                                }}>
                                    <div style={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                                        {[...Array(statusBarCount)].map((_, i) => {
                                            let barColor: string;
                                            if (i < team.aliveCount) {
                                                barColor = aliveColor;
                                            } else if (i < team.aliveCount + team.knockedCount) {
                                                barColor = knockedColor;
                                            } else {
                                                barColor = elimColor;
                                            }
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
                {/* Legend as tfoot */}
                <tfoot>
                    <tr>
                        <td
                            colSpan={showLogos ? 6 : 5}
                            style={{ padding: 0, border: 'none' }}
                        >
                            <div
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    background: '#1a1a1a',
                                    height: 32,
                                    overflow: 'hidden',
                                    border: 'none',
                                }}
                            >
                                {/* Diagonal gold triangle on left */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 17,
                                        top: 0,
                                        width: 50,
                                        height: '100%',
                                        background: '#b58c42',
                                        clipPath: 'polygon(0 0, 0 100%, 50% 100%)',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: 17,
                                        height: '100%',
                                        background: '#b58c42',
                                    }}
                                />
                                {/* Legend items centered in remaining space */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 16,
                                        width: '100%',
                                        fontSize: 10,
                                        fontWeight: 400,
                                        letterSpacing: 1,
                                        textTransform: 'uppercase',
                                        zIndex: 1,
                                        paddingLeft: 40,
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: 14,
                                            height: 12,
                                            borderRadius: 0,
                                            background: aliveColor,
                                        }} />
                                        <span style={{ color: '#fff' }}>ALIVE</span>
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: 14,
                                            height: 12,
                                            borderRadius: 0,
                                            background: knockedColor,
                                        }} />
                                        <span style={{ color: '#fff' }}>KNOCKED</span>
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: 14,
                                            height: 12,
                                            borderRadius: 0,
                                            background: elimColor,
                                        }} />
                                        <span style={{ color: '#fff' }}>ELIM.</span>
                                    </span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
