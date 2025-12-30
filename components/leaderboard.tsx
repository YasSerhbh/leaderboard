import React from "react";


export type Team = {
  id: number;
  name: string;
  elims: number;
  aliveCount: number; // 0-4, number of alive squad members
  logo?: string | null; // optional logo url
  show_on_leaderboard?: boolean; // optional, for filtering
};


interface LeaderboardProps {
  teams: Team[];
}


  export const Leaderboard: React.FC<LeaderboardProps> = ({ teams }) => {
    // Only show teams where show_on_leaderboard is true (default to true if null/undefined)
    const visibleTeams = teams.filter(
      (team) => team.show_on_leaderboard == true || team.show_on_leaderboard == undefined || team.show_on_leaderboard == null
    );

    // Table width and row height for compact overlay
    const tableWidth = 340;
    const rowHeight = 24; // reduced from 30
    const headerHeight = 22; // reduced from 28
    const rankColWidth = 32; // reduced from 38
    const logoColWidth = 30; // reduced from 38
    const teamNameColWidth = 90; // reduced from 96
    const statusColWidth = 48; // reduced from 60
    const elimsColWidth = 38; // reduced from 48
    // Colors from the reference image
    const bgMain = '#18521b'; // dark green
    const bgHeader = '#fff'; // white header as in reference
    const headerTextColor = '#18521b'; // green text for header
    const bgRowEven = '#226022'; // slightly lighter for even rows
    const bgRowOdd = '#18521b'; // same as main for odd rows
    const borderColor = '#18521b';
    const statusBarCount = 4; // Number of status bars per team

    return (
      <div
        style={{
          width: tableWidth,
          background: bgMain,
          borderRadius: 12,
          boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)',
          border: `2px solid ${borderColor}`,
          padding: 0,
          fontFamily: 'Montserrat, Orbitron, Arial, sans-serif',
          color: '#fff',
        }}
      >
        <table
          className="w-full text-white text-center"
          style={{ borderCollapse: 'collapse', borderSpacing: 0, width: tableWidth, tableLayout: 'fixed' }}
        >
          <thead>
            <tr
              style={{
                background: bgHeader,
                color: headerTextColor,
                fontFamily: 'Orbitron, Montserrat, Arial, sans-serif',
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: 0.5,
                height: headerHeight,
                textTransform: 'uppercase',
                borderBottom: `2px solid ${borderColor}`,
              }}
            >
              <th style={{ padding: 0, borderTopLeftRadius: 8, width: rankColWidth, fontWeight: 900, fontSize: 11, color: headerTextColor }}>#</th>
              <th style={{ padding: 0, width: logoColWidth, fontWeight: 900, fontSize: 11, color: headerTextColor }}> </th>
              <th style={{ padding: 0, width: teamNameColWidth, fontWeight: 900, fontSize: 11, color: headerTextColor }}>TEAM NAME</th>
              <th style={{ padding: 0, width: statusColWidth, fontWeight: 900, fontSize: 11, borderRight: '1px solid #bdbdbd', borderLeft: '1px solid #bdbdbd', color: headerTextColor }}>STATUS</th>
              <th style={{ padding: 0, borderTopRightRadius: 8, width: elimsColWidth, fontWeight: 900, fontSize: 11, color: headerTextColor }}>ELIMS</th>
            </tr>
          </thead>
          <tbody>
            {visibleTeams.map((team, idx) => (
              <tr
                key={team.id}
                style={{
                  background: idx % 2 === 0 ? bgRowEven : bgRowOdd,
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: `2px solid ${borderColor}`,
                  fontFamily: 'Montserrat, Arial, sans-serif',
                  height: rowHeight,
                }}
              >
                <td style={{ padding: 0, width: rankColWidth }}>{idx + 1}</td>
                <td style={{ padding: 0, width: logoColWidth }}>
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name + ' logo'}
                      style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 3, background: '#222' }}
                    />
                  ) : (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 20,
                        height: 20,
                        borderRadius: 3,
                        background: '#222',
                        color: '#fff',
                        fontSize: 12,
                        lineHeight: '20px',
                        textAlign: 'center',
                        fontWeight: 700,
                      }}
                    >
                      ?
                    </span>
                  )}
                </td>
                <td style={{ padding: 0, width: teamNameColWidth, textAlign: 'left', paddingLeft: 4 }}>{team.name}</td>
                <td style={{ padding: 0, width: statusColWidth }}>
                  <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    {Array.from({ length: statusBarCount }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-block',
                          width: 5,
                          height: 11,
                          borderRadius: 2,
                          background: i < team.aliveCount ? '#fff' : '#e53935',
                          border: '1px solid #222',
                          marginLeft: i === 0 ? 0 : 1,
                        }}
                      />
                    ))}
                  </div>
                </td>
                <td style={{ padding: 0, width: elimsColWidth, fontSize: 12, fontWeight: 700 }}>{team.elims}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Legend Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: bgMain,
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            padding: '4px 0 2px 0',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              display: 'inline-block',
              width: 11,
              height: 11,
              borderRadius: 2,
              background: '#fff',
              border: '1.2px solid #222',
              marginRight: 3,
            }} />
            <span style={{ color: '#fff', fontWeight: 700 }}>ALIVE</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              display: 'inline-block',
              width: 11,
              height: 11,
              borderRadius: 2,
              background: '#e53935',
              border: '1.2px solid #222',
              marginRight: 3,
            }} />
            <span style={{ color: '#fff', fontWeight: 700 }}>ELIMINATED</span>
          </span>
        </div>
      </div>
    );
  };
