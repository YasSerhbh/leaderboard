import React from "react";


export type Team = {
  id: number;
  name: string;
  elims: number;
  aliveCount: number; // 0-4, number of alive squad members
  logo?: string | null; // optional logo url
};


interface LeaderboardProps {
  teams: Team[];
}



export const Leaderboard: React.FC<LeaderboardProps> = ({ teams }) => {
  // Table width and row height for compact overlay
  const tableWidth = 340;
  const rowHeight = 30;
  const headerHeight = 28;
  const rankColWidth = 38;
  const logoColWidth = 38;
  const teamNameColWidth = 96;
  const statusColWidth = 60;
  const elimsColWidth = 48;
  // Colors from the reference image
  const bgMain = '#18521b'; // dark green
  const bgHeader = '#2b6b2f'; // lighter green for header
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
              color: '#fff',
              fontFamily: 'Orbitron, Montserrat, Arial, sans-serif',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: 0.5,
              height: headerHeight,
              textTransform: 'uppercase',
            }}
          >
            <th style={{ padding: 0, borderTopLeftRadius: 8, width: rankColWidth, fontWeight: 900, fontSize: 13 }}>#</th>
            <th style={{ padding: 0, width: logoColWidth, fontWeight: 900, fontSize: 13 }}> </th>
            <th style={{ padding: 0, width: teamNameColWidth, fontWeight: 900, fontSize: 13 }}>TEAM NAME</th>
            <th style={{ padding: 0, width: statusColWidth, fontWeight: 900, fontSize: 13, borderRight: '1px solid #bdbdbd', borderLeft: '1px solid #bdbdbd' }}>STATUS</th>
            <th style={{ padding: 0, borderTopRightRadius: 8, width: elimsColWidth, fontWeight: 900, fontSize: 13 }}>ELIMS</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => (
            <tr
              key={team.id}
              style={{
                background: idx % 2 === 0 ? bgRowEven : bgRowOdd,
                fontWeight: 600,
                fontSize: 13,
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
                    style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, background: '#222' }}
                  />
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      background: '#222',
                      color: '#fff',
                      fontSize: 16,
                      lineHeight: '28px',
                      textAlign: 'center',
                      fontWeight: 700,
                    }}
                  >
                    ?
                  </span>
                )}
              </td>
              <td style={{ padding: 0, width: teamNameColWidth, textAlign: 'left', paddingLeft: 6 }}>{team.name}</td>
              <td style={{ padding: 0, width: statusColWidth }}>
                <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                  {Array.from({ length: statusBarCount }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        width: 7,
                        height: 15,
                        borderRadius: 2,
                        background: i < team.aliveCount ? '#fff' : '#e53935',
                        border: '1px solid #222',
                        marginLeft: i === 0 ? 0 : 1,
                      }}
                    />
                  ))}
                </div>
              </td>
              <td style={{ padding: 0, width: elimsColWidth, fontSize: 15, fontWeight: 700 }}>{team.elims}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
