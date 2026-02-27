"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminTeamPanel from "../../components/admin-team-panel";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<unknown>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("[Admin Login] Auth error full response:", error);
        const detail = [
          error.message,
          error.status ? `Status: ${error.status}` : null,
          "name" in error && error.name ? `Type: ${error.name}` : null,
        ]
          .filter(Boolean)
          .join(" | ");
        setError(detail);
      }
    } catch (err: unknown) {
      console.error("[Admin Login] Network/unexpected error:", err);
      const msg =
        err instanceof Error
          ? `${err.name}: ${err.message}`
          : String(err);
      setError(`Network error — ${msg}. Check your internet connection and that Supabase is reachable at ${supabaseUrl}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!supabaseUrl || !supabaseKey) {
    return <div className="text-red-500 font-bold text-lg">Supabase env vars missing.</div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-green-950">
        <form onSubmit={handleLogin} className="bg-green-900 p-8 rounded-lg flex flex-col gap-4 w-80">
          <h2 className="text-white text-xl font-bold text-center">Admin Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="p-2 rounded bg-green-100 text-black"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="p-2 rounded bg-green-100 text-black"
            required
          />
          {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="bg-green-700 text-white font-bold py-2 rounded hover:bg-green-800 transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </main>
    );
  }

  // Only allow admin email
//   @ts-expect-error typescript issue
  if (user?.email != ADMIN_EMAIL) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-green-950">
        <div className="bg-green-900 p-8 rounded-lg flex flex-col gap-4 w-80 items-center">
          <h2 className="text-white text-xl font-bold">Access Denied</h2>
          <p className="text-white text-center">You do not have permission to access this page.</p>
          <button
            onClick={handleLogout}
            className="bg-green-700 text-white font-bold py-2 rounded hover:bg-green-800 transition w-full"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-green-950">
      <div className="bg-green-900 p-8 rounded-lg flex flex-col gap-4 w-full items-center">
        <div className="w-full flex flex-row justify-between items-center mb-4">
          <h2 className="text-white text-xl font-bold">Welcome, Admin!</h2>
          <button
            onClick={handleLogout}
            className="bg-green-700 text-white font-bold py-2 px-4 rounded hover:bg-green-800 transition"
          >
            Logout
          </button>
        </div>
        <AdminTeamPanel />
      </div>
    </main>
  );
}
