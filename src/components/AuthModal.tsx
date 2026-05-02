import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [tokenInput, setTokenInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      login(tokenInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 p-4">
      <div className="bg-paper rounded-md border border-line shadow-lg p-6 w-full max-w-md">
        <h2 className="font-display text-xl font-medium text-ink mb-2">
          Enter GitHub Token
        </h2>
        <p className="text-sm text-muted mb-4">
          Paste a GitHub Personal Access Token with repo scope to enable editing.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ghp_…"
            className="w-full bg-bg border border-line rounded px-3 py-2 mb-4 font-mono text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-accent text-paper rounded hover:bg-accent-hover transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
