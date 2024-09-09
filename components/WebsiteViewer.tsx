"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  X,
  Globe,
  Trash2,
  Star,
  History,
  Heart,
} from "lucide-react";
import WebsiteView from "./WebsiteView";
import FavoriteLinks from "./FavoriteLinks";
import { toast } from "sonner";

export type ViewType = "desktop" | "tablet" | "mobile";

export interface View {
  id: number;
  url: string;
  type: ViewType;
}

const isValidUrl = (url: string): boolean => {
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  const localhostPattern =
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/;
  return urlPattern.test(url) || localhostPattern.test(url);
};

const formatUrl = (inputUrl: string): string | null => {
  let formattedUrl = inputUrl.trim().toLowerCase();

  if (
    formattedUrl.includes("localhost") ||
    formattedUrl.includes("127.0.0.1")
  ) {
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = "http://" + formattedUrl;
    }
    return isValidUrl(formattedUrl) ? formattedUrl : null;
  }

  if (
    !formattedUrl.startsWith("http://") &&
    !formattedUrl.startsWith("https://")
  ) {
    formattedUrl = "https://" + formattedUrl;
  }

  return isValidUrl(formattedUrl) ? formattedUrl : null;
};

export default function WebsiteViewer() {
  const [url, setUrl] = useState("");
  const [views, setViews] = useState<View[]>([]);
  const [nextId, setNextId] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [isInputHighlighted, setIsInputHighlighted] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showFavorites, setShowFavorites] = useState(true);

  const highlightInput = () => {
    setIsInputHighlighted(true);
    setTimeout(() => setIsInputHighlighted(false), 1000);
  };

  const setUrlWithHighlight = (url: string) => {
    setUrl(url);
    setIsInputHighlighted(true);
    setTimeout(() => setIsInputHighlighted(false), 1000);
    toast.success("URL added to the viewer");
  };

  const addView = () => {
    const formattedUrl = formatUrl(url);
    if (formattedUrl) {
      setViews((prevViews) => [
        { id: nextId, url: formattedUrl, type: "desktop" },
        ...prevViews,
      ]);
      setNextId(nextId + 1);
      setHistory((prev) => Array.from(new Set([formattedUrl, ...prev])));
      setUrl("");
    } else {
      toast.error("Please enter a valid URL");
    }
  };

  const addAllViews = () => {
    const formattedUrl = formatUrl(url);
    if (formattedUrl) {
      setViews((prevViews) => [
        { id: nextId, url: formattedUrl, type: "desktop" },
        { id: nextId + 1, url: formattedUrl, type: "tablet" },
        { id: nextId + 2, url: formattedUrl, type: "mobile" },
        ...prevViews,
      ]);
      setNextId(nextId + 3);
      setHistory((prev) => Array.from(new Set([formattedUrl, ...prev])));
      setUrl("");
    } else {
      toast.error("Please enter a valid URL");
    }
  };

  const removeView = (id: number) => {
    setViews(views.filter((view) => view.id !== id));
  };

  const changeViewType = (id: number, type: ViewType) => {
    setViews(views.map((view) => (view.id === id ? { ...view, type } : view)));
  };

  const removeFromHistory = (urlToRemove: string) => {
    setHistory((prev) => prev.filter((item) => item !== urlToRemove));
  };

  const clearAllViews = () => {
    setViews([]);
  };

  const duplicateView = (view: View) => {
    setViews((prevViews) => [{ ...view, id: nextId }, ...prevViews]);
    setNextId(nextId + 1);
    toast.success(`New ${view.type} view added`);
  };

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes highlightInput {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            box-shadow: 0 0 0 4px blue;
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        .highlight-input {
          animation: highlightInput 1s ease-out;
        }
      `}</style>
      <div className="space-y-2 container mx-auto">
        <Label htmlFor="url-input">Enter Website URL:</Label>
        <div className="flex gap-2 flex-col lg:flex-row">
          <Input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or localhost:3000"
            className={`flex-grow text-[16px] ${
              isInputHighlighted ? "highlight-input" : ""
            }`}
          />
          <div className="flex gap-1">
            {/* <Button onClick={addView} disabled={!formatUrl(url)}>
              <PlusCircle className="mr-2 h-4 w-4" /> View
            </Button> */}
            <Button onClick={addAllViews} disabled={!formatUrl(url)}>
              <PlusCircle className="mr-2 h-4 w-4" /> All Views
            </Button>
            <Button
              onClick={() => setShowHistory((prev) => !prev)}
              variant={showHistory ? "outline" : "ghost"}
              size={"icon"}
            >
              <History size={18} />
            </Button>
            <Button
              onClick={() => setShowFavorites((prev) => !prev)}
              variant={showFavorites ? "outline" : "ghost"}
              size={"icon"}
            >
              {showFavorites ? (
                <Heart color="red" size={18} />
              ) : (
                <Heart size={18} />
              )}
            </Button>

            {views.length > 0 && (
              <Button onClick={clearAllViews} variant="destructive">
                <Trash2 className=" h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {showFavorites && (
        <FavoriteLinks setUrlWithHighlight={setUrlWithHighlight} />
      )}

      {history.length > 0 && showHistory && (
        <div className="space-y-2 container mx-auto">
          <Label>Recent URLs:</Label>
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-md"
              >
                <button
                  onClick={() => setUrlWithHighlight(item)}
                  className="text-sm text-blue-600 hover:underline px-2 py-1"
                >
                  {item}
                </button>
                <button
                  onClick={() => removeFromHistory(item)}
                  className="text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-6 justify-center">
        {views.map((view, index) => (
          <WebsiteView
            key={view.id}
            view={view}
            onRemove={() => removeView(view.id)}
            onTypeChange={(type) => changeViewType(view.id, type)}
            onDuplicate={duplicateView}
            index={views.length - index - 1}
          />
        ))}
      </div>
    </div>
  );
}
