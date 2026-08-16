import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthModal from "./AuthModal";

export default function Layout() {
  const { authenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen">
      <header>
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-4 flex items-baseline justify-between gap-x-6 border-b border-line">
          <Link to="/" className="font-display text-2xl text-ink tracking-tight">
            Cook<span className="italic text-accent">book</span>
          </Link>
          <nav className="flex flex-wrap items-baseline justify-end gap-x-6 gap-y-2">
            <Link to="/" className="text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors">
              Browse
            </Link>
            <Link to="/search" className="text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors">
              Search
            </Link>
            <Link to="/meal-planner" className="text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors">
              Meal Planner
            </Link>
            {authenticated && (
              <Link
                to="/new"
                className="bg-accent text-paper px-3 py-1.5 rounded text-[11px] uppercase tracking-[0.14em] hover:bg-accent-hover transition-colors"
              >
                + New Recipe
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line mt-16">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>Cookbook</span>
          <button
            onClick={() => (authenticated ? logout() : setShowAuth(true))}
            className="hover:text-ink transition-colors"
          >
            {authenticated ? "Logout" : "🔑"}
          </button>
        </div>
      </footer>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
