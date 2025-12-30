import Link from "next/link";


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-950">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold text-white">Welcome to the Leaderboard Project</h1>
        <Link
          href="/leaderboard"
          className="px-6 py-3 bg-green-800 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition"
        >
          View Leaderboard
        </Link>
      </div>
    </main>
  );
}
