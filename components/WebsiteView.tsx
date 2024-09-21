import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Monitor, Tablet, Smartphone, X, Star, PlusCircle } from "lucide-react";
import { View, ViewType } from "./WebsiteViewer";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const defaultViewDimensions = {
  desktop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

interface WebsiteViewProps {
  view: View;
  onRemove: () => void;
  onTypeChange: (type: ViewType) => void;
  onDuplicate: (view: View) => void;
  index: number;
}

export default function WebsiteView({
  view,
  onRemove,
  onTypeChange,
  onDuplicate,
  index,
}: WebsiteViewProps) {
  const [viewDimensions] = useState(defaultViewDimensions);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { favorites, addToFavorites, removeFromFavorites } = useFavorites();

  const isFavorite = favorites.includes(view.url);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const viewWidth = viewDimensions[view.type].width;
        const newScale = Math.min(1, containerWidth / viewWidth);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [view.type, viewDimensions]);

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(view.url);
    } else {
      addToFavorites(view.url);
    }
  };

  const scaledWidth = viewDimensions[view.type].width * scale;
  const scaledHeight = viewDimensions[view.type].height * scale;
  const optionsHeight = 90;
  const borderWidth = 1;

  return (
    <div
      ref={containerRef}
      className="relative border rounded-lg overflow-hidden w-full sm:w-auto"
      style={{
        width: `${scaledWidth + 2 * borderWidth}px`,
        height: `${scaledHeight + optionsHeight + 2 * borderWidth}px`,
      }}
    >
      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold z-10">
        {index + 1}
      </div>
      <div className="p-2 space-y-2" style={{ height: `${optionsHeight}px` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 mr-2">
            <p className="responsive-text-sm font-medium truncate flex-1 pl-8">
              {view.url}
            </p>
            <button
              onClick={handleFavoriteToggle}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Add to favorites"
            >
              {isFavorite ? (
                <Star fill="yellow" className="h-4 w-4 text-yellow-500 " />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="Duplicate view"
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: "desktop" });
                    // Close the dropdown menu automatically
                  }}
                >
                  <Monitor className="mr-2 h-4 w-4" /> Desktop
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: "tablet" });
                    // Close the dropdown menu automatically
                  }}
                >
                  <Tablet className="mr-2 h-4 w-4" /> Tablet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onDuplicate({ ...view, type: "mobile" });
                    // Close the dropdown menu automatically
                  }}
                >
                  <Smartphone className="mr-2 h-4 w-4" /> Mobile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
            <span className="sr-only">Remove view</span>
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <Select value={view.type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="View type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">
                <Monitor className="inline mr-1 h-4 w-4" /> Desktop{" "}
                <span className="text-[10px] text-muted-foreground">
                  1024 x 768
                </span>
              </SelectItem>
              <SelectItem value="tablet">
                <Tablet className="inline mr-1 h-4 w-4" /> Tablet{" "}
                <span className="text-[10px] text-muted-foreground">
                  768 x 1024
                </span>
              </SelectItem>
              <SelectItem value="mobile">
                <Smartphone className="inline mr-1 h-4 w-4" /> Mobile{" "}
                <span className="text-[10px] text-muted-foreground">
                  375 x 667
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          {/* <Button onClick={captureScreenshot} size="sm" disabled={isCapturing}>
            {isCapturing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Capture
          </Button> */}
        </div>
        <div className="text-xs text-center">
          {viewDimensions[view.type].width} x {viewDimensions[view.type].height}
        </div>
      </div>
      <div
        className="overflow-hidden bg-background mx-auto border-t"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        <iframe
          ref={iframeRef}
          src={view.url}
          style={{
            width: `${viewDimensions[view.type].width}px`,
            height: `${viewDimensions[view.type].height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          title={`View ${view.id}`}
        />
      </div>
    </div>
  );
}
