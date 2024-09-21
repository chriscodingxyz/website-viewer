"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";

type FavoriteLinksProps = {
  setUrlWithHighlight: (url: string) => void;
};

const FavoriteLinks = ({ setUrlWithHighlight }: FavoriteLinksProps) => {
  const { favorites, removeFromFavorites } = useFavorites();

  return (
    <div className="space-y-2 container mx-auto bg-accent p-4 rounded-md">
      {favorites.length > 0 && <Label>Favorites:</Label>}
      <div className="flex flex-wrap gap-2">
        {favorites.map((item, index) => (
          <div key={index} className="flex items-center bg-accent rounded-md">
            <button
              onClick={() => setUrlWithHighlight(item)}
              className="text-sm text-blue-600 hover:underline px-2 py-1"
            >
              {item}
            </button>
            <button
              onClick={() => removeFromFavorites(item)}
              className="text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoriteLinks;
