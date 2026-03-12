"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import AdminTeamPanel from "../../components/admin-team-panel";
import {
  Shield,
  LogOut,
  Mail,
  Lock,
  AlertCircle,
  ShieldOff,
} from "lucide-react";

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
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
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
        err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      setError(
        `Network error: ${msg}. Check your internet connection and that Supabase is reachable at ${supabaseUrl}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-6 py-4">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <span className="text-rose-400 font-semibold">
            Supabase environment variables are missing.
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
        <div className="w-full max-w-sm px-4">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl flex flex-col gap-5 shadow-2xl"
          >
            <div className="text-center">
              <h2 className="text-white text-2xl font-bold tracking-tight">
                Admin Login
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Sign in to manage your leaderboard
              </p>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm"
                required
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <span className="text-rose-400 text-sm">{error}</span>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold py-3 rounded-xl hover:from-indigo-600 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Only allow admin email
  //   @ts-expect-error typescript issue
  if (user?.email != ADMIN_EMAIL) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl flex flex-col gap-5 w-full max-w-sm items-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldOff className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-white text-xl font-bold">Access Denied</h2>
          <p className="text-slate-400 text-sm text-center">
            You do not have permission to access this page.
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-700 hover:text-white transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold tracking-tight leading-tight">
                Admin Panel
              </h2>
              <p className="text-slate-500 text-xs">
                Manage teams, themes, and settings
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 font-medium py-2 px-4 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminTeamPanel />
      </div>
    </main>
  );
}
