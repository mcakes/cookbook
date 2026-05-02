import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthModal from "./AuthModal";

export default function Layout() {
  const { authenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="bg-paper border-b border-line">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl font-medium text-ink tracking-tight">
            Cookbook
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-muted hover:text-ink transition-colors">
              Browse
            </Link>
            <Link to="/search" className="text-muted hover:text-ink transition-colors">
              Search
            </Link>
            <Link to="/meal-planner" className="text-muted hover:text-ink transition-colors">
              Meal Planner
            </Link>
            {authenticated && (
              <Link
                to="/new"
                className="bg-accent text-paper px-3 py-1.5 rounded text-sm hover:bg-accent-hover transition-colors"
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between text-sm text-muted">
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
