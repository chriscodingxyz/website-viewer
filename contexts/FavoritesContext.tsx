"use client";

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";

interface FavoritesContextType {
  favorites: string[];
  addToFavorites: (url: string) => void;
  removeFromFavorites: (url: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([
    "http://localhost:3000",
    "http://localhost:5173",
    "https://chriscoding.xyz",
  ]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  const addToFavorites = (url: string) => {
    if (!favorites.includes(url)) {
      const newFavorites = [...favorites, url];
      setFavorites(newFavorites);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      toast.success("Added to favorites");
    } else {
      toast.info("Already in favorites");
    }
  };

  const removeFromFavorites = (url: string) => {
    const newFavorites = favorites.filter((item) => item !== url);
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
    toast.info("Removed from favorites");
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addToFavorites, removeFromFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
