import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  index: number;
}

export default function WebsiteView({
  view,
  onRemove,
  onTypeChange,
  index,
}: WebsiteViewProps) {
  const [isCapturing, setIsCapturing] = useState(false);
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

  const scale =
    view.type === "desktop" ? 0.4 : view.type === "tablet" ? 0.5 : 0.8;

  const scaledWidth = viewDimensions[view.type].width * scale;
  const scaledHeight = viewDimensions[view.type].height * scale;
  const optionsHeight = 90; // Adjust this value based on the actual height of your options section
  const borderWidth = 1; // Width of the border

  return (
    <div
      className="relative border rounded-lg"
      style={{
        width: `${scaledWidth + 2 * borderWidth}px`,
        height: `${scaledHeight + optionsHeight + 2 * borderWidth}px`,
      }}
    >
      <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
        {index + 1}
      </div>
      <div className="p-2 space-y-2" style={{ height: `${optionsHeight}px` }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium truncate flex-1 mr-2 pl-8">
            {view.url}
          </p>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <X className="h-4 w-4" />
            <span className="sr-only">Remove view</span>
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <Select value={view.type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[140px]">
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
