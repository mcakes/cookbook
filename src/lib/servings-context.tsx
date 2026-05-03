// src/lib/servings-context.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

interface ServingsContextValue {
  servings: number;
  setServings: (n: number) => void;
  baseServings: number | undefined;
}

const ServingsContext = createContext<ServingsContextValue | null>(null);

export function ServingsProvider({
  baseServings, children,
}: { baseServings: number | undefined; children: ReactNode }) {
  const [servings, setServings] = useState(baseServings ?? 0);
  return (
    <ServingsContext value={{ servings, setServings, baseServings }}>
      {children}
    </ServingsContext>
  );
}

export function useServings(): ServingsContextValue {
  const ctx = useContext(ServingsContext);
  if (!ctx) throw new Error("useServings must be used inside ServingsProvider");
  return ctx;
}
