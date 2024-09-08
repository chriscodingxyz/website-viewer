import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
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
import { toast } from "sonner";

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
  const [viewDimensions] = useState(defaultViewDimensions);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // const captureScreenshot = async () => {
  //   setIsCapturing(true);
  //   try {
  //     const response = await axios.post(
  //       "/api/capture-screenshot",
  //       {
  //         url: view.url,
  //         width: viewDimensions[view.type].width,
  //         height: viewDimensions[view.type].height,
  //       },
  //       {
  //         responseType: "blob",
  //       }
  //     );

  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute(
  //       "download",
  //       `screenshot-${view.type}-${Date.now()}.png`
  //     );
  //     document.body.appendChild(link);
  //     link.click();
  //     link.parentNode?.removeChild(link);
  //     toast.success("Screenshot captured successfully");
  //   } catch (error) {
  //     console.error("Failed to capture screenshot:", error);
  //     toast.error("Failed to capture screenshot. Please try again.");
  //   } finally {
  //     setIsCapturing(false);
  //   }
  // };

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
