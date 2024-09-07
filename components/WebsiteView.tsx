"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Monitor, Tablet, Smartphone, Camera, X, Loader2 } from "lucide-react";
import { View, ViewType } from "./WebsiteViewer";
import html2canvas from "html2canvas";

const defaultViewDimensions = {
  desktop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

interface WebsiteViewProps {
  view: View;
  onRemove: () => void;
  onTypeChange: (type: ViewType) => void;
}

export default function WebsiteView({
  view,
  onRemove,
  onTypeChange,
}: WebsiteViewProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [viewDimensions, setViewDimensions] = useState(defaultViewDimensions);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const iframeContent =
          iframe.contentDocument || iframe.contentWindow?.document;

        if (iframeContent) {
          const canvas = await html2canvas(iframeContent.body, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: viewDimensions[view.type].width,
            windowHeight: viewDimensions[view.type].height,
          });

          const image = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = image;
          link.download = `screenshot-${view.type}-${Date.now()}.png`;
          link.click();
        }
      }
    } catch (error) {
      console.error("Failed to capture screenshot:", error);
      alert(
        "Failed to capture screenshot. This might be due to cross-origin restrictions."
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCustomDimensions = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    if (width > 0 && height > 0) {
      setViewDimensions({
        ...viewDimensions,
        [view.type]: { width, height },
      });
    }
  };

  const scale =
    view.type === "desktop" ? 0.4 : view.type === "tablet" ? 0.5 : 0.8;

  // Add a constant for bottom padding
  const bottomPadding = 20;

  return (
    <Card
      className="w-full overflow-hidden"
      style={{
        width: `${viewDimensions[view.type].width * scale + 40}px`,
        height: `${
          viewDimensions[view.type].height * scale +
          (showCustomSize ? 220 : 180) +
          bottomPadding // Add bottom padding here
        }px`,
        paddingBottom: `${bottomPadding}px`, // Apply padding to the bottom of the card
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate flex-1 mr-2">
          {view.url}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X className="h-4 w-4" />
          <span className="sr-only">Remove view</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-2">
        <div className="flex justify-between items-center">
          <Select value={view.type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">
                <Monitor className="inline mr-2 h-4 w-4" /> Desktop
              </SelectItem>
              <SelectItem value="tablet">
                <Tablet className="inline mr-2 h-4 w-4" /> Tablet
              </SelectItem>
              <SelectItem value="mobile">
                <Smartphone className="inline mr-2 h-4 w-4" /> Mobile
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={captureScreenshot} size="sm" disabled={isCapturing}>
            {isCapturing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Capture
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id={`custom-size-${view.id}`}
            checked={showCustomSize}
            onCheckedChange={setShowCustomSize}
          />
          <Label htmlFor={`custom-size-${view.id}`}>Custom size</Label>
        </div>
        {showCustomSize && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Width"
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-20"
              />
              <span>x</span>
              <Input
                type="number"
                placeholder="Height"
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
                className="w-20"
              />
              <Button onClick={handleCustomDimensions} size="sm">
                Set
              </Button>
            </div>
          </div>
        )}
        <div className="text-sm text-center">
          {viewDimensions[view.type].width} x {viewDimensions[view.type].height}
        </div>
        <div
          className="overflow-hidden bg-background"
          style={{
            width: `${viewDimensions[view.type].width * scale}px`,
            height: `${viewDimensions[view.type].height * scale}px`,
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
            className="border-none"
            title={`View ${view.id}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
