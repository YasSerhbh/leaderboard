
// NOTE: This page is designed for OBS overlay capture.
// Place the browser source in the bottom-right of your stream in OBS and crop as needed.
// The leaderboard will always render in the bottom-right of the page for easy overlay alignment.
import { Leaderboard, Team } from "../../components/leaderboard";

const dummyTeams: Team[] = [
  { id: 1, name: "TOXIC MAFIA", elims: 10, aliveCount: 3 },
  { id: 2, name: "JOD BROTHERS", elims: 3, aliveCount: 1 },
  { id: 3, name: "PHOTOGRAPHER", elims: 3, aliveCount: 1 },
  { id: 4, name: "PHILOSOPHER", elims: 4, aliveCount: 3 },
  { id: 5, name: "JEXA ESPORTS", elims: 5, aliveCount: 4 },
  { id: 6, name: "FF WARRIORS", elims: 6, aliveCount: 2 },
  { id: 7, name: "GAY WARRIORS", elims: 7, aliveCount: 3 },
  { id: 8, name: "1X ESPORTS", elims: 8, aliveCount: 4 },
  { id: 9, name: "GENESIS", elims: 9, aliveCount: 1 },
  { id: 10, name: "GODREJ", elims: 1, aliveCount: 0 },
  { id: 11, name: "RNTX", elims: 11, aliveCount: 4 },
  { id: 12, name: "OPPO", elims: 0, aliveCount: 0 },
  { id: 13, name: "VIVO", elims: 13, aliveCount: 3 },
  { id: 14, name: "APPLE", elims: 2, aliveCount: 1 },
  { id: 15, name: "SAMSUNG", elims: 15, aliveCount: 4 },
  { id: 16, name: "NOKIA", elims: 0, aliveCount: 0 },
  { id: 17, name: "MOTOROLA", elims: 8, aliveCount: 2 },
  { id: 18, name: "KAUSHIK GAY", elims: 0, aliveCount: 0 },
];

export default function LeaderboardDemoPage() {
  return (
    <>
      {/* Google Fonts for better style */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&family=Orbitron:wght@700&display=swap"
        rel="stylesheet"
      />
      <main
        className="min-h-screen bg-green-950 flex items-end justify-end"
        style={{ padding: 2 }}
      >
        <Leaderboard teams={dummyTeams} />
      </main>
    </>
  );
}
