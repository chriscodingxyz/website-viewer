"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import WebsiteView from "./WebsiteView";

export type ViewType = "desktop" | "tablet" | "mobile";

export interface View {
  id: number;
  url: string;
  type: ViewType;
}

export default function WebsiteViewer() {
  const [url, setUrl] = useState("");
  const [views, setViews] = useState<View[]>([]);
  const [nextId, setNextId] = useState(1);
  const [history, setHistory] = useState<string[]>([]);

  const addView = () => {
    if (url) {
      setViews([...views, { id: nextId, url, type: "desktop" }]);
      setNextId(nextId + 1);
      setHistory((prev) => Array.from(new Set([url, ...prev])));
      setUrl("");
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="url-input">Enter Website URL:</Label>
        <div className="flex gap-2">
          <Input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com or http://localhost:3000"
            className="flex-grow"
          />
          <Button onClick={addView}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add View
          </Button>
        </div>
      </div>
      {history.length > 0 && (
        <div className="space-y-2">
          <Label>Recent URLs:</Label>
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-md p-1"
              >
                <button
                  onClick={() => setUrl(item)}
                  className="text-sm text-blue-600 hover:underline mr-1"
                >
                  {item}
                </button>
                <button
                  onClick={() => removeFromHistory(item)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-6 justify-start ">
        {views.map((view) => (
          <WebsiteView
            key={view.id}
            view={view}
            onRemove={() => removeView(view.id)}
            onTypeChange={(type) => changeViewType(view.id, type)}
          />
        ))}
      </div>
    </div>
  );
}
