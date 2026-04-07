import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import AuthModal from "./AuthModal";

export default function Layout() {
  const { authenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Cookbook
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Browse
            </Link>
            <Link to="/search" className="text-gray-600 hover:text-gray-900">
              Search
            </Link>
            <Link to="/meal-planner" className="text-gray-600 hover:text-gray-900">
              Meal Planner
            </Link>
            {authenticated && (
              <Link
                to="/new"
                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-700"
              >
                + New Recipe
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between text-sm text-gray-400">
          <span>Cookbook</span>
          <button
            onClick={() => (authenticated ? logout() : setShowAuth(true))}
            className="hover:text-gray-600"
          >
            {authenticated ? "Logout" : "🔑"}
          </button>
        </div>
      </footer>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
