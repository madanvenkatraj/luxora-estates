import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Favourites persisted in localStorage ("luxora.favorites.v1").
 * Degrades gracefully when storage is unavailable (private mode). */

const STORAGE_KEY = "luxora.favorites.v1";

interface FavoritesValue {
  ids: ReadonlySet<string>;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function writeStored(ids: string[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setIds(new Set(readStored()));
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeStored([...next]);
      return next;
    });
  }, []);

  const value = useMemo<FavoritesValue>(
    () => ({
      ids,
      has: (id: string) => ids.has(id),
      toggle,
      count: ids.size,
    }),
    [ids, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
}
