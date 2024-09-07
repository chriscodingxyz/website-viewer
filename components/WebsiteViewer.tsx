// "use client";

// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { PlusCircle, X, Globe, Trash2, Star } from "lucide-react";
// import WebsiteView from "./WebsiteView";

// export type ViewType = "desktop" | "tablet" | "mobile";

// export interface View {
//   id: number;
//   url: string;
//   type: ViewType;
// }

// export default function WebsiteViewer() {
//   const [url, setUrl] = useState("");
//   const [views, setViews] = useState<View[]>([]);
//   const [nextId, setNextId] = useState(1);
//   const [history, setHistory] = useState<string[]>([]);
//   const [favorites, setFavorites] = useState<string[]>(() => {
//     // Initialize favorites from localStorage
//     const storedFavorites = localStorage.getItem("favorites");
//     return storedFavorites ? JSON.parse(storedFavorites) : [];
//   });

//   useEffect(() => {
//     // Only update localStorage when favorites change
//     localStorage.setItem("favorites", JSON.stringify(favorites));
//   }, [favorites]);

//   useEffect(() => {
//     localStorage.setItem("favorites", JSON.stringify(favorites));
//   }, [favorites]);

//   const addView = () => {
//     if (url) {
//       const formattedUrl = formatUrl(url);
//       setViews((prevViews) => [
//         { id: nextId, url: formattedUrl, type: "desktop" },
//         ...prevViews,
//       ]);
//       setNextId(nextId + 1);
//       setHistory((prev) => Array.from(new Set([formattedUrl, ...prev])));
//       setUrl("");
//     }
//   };

//   const addAllViews = () => {
//     if (url) {
//       const formattedUrl = formatUrl(url);
//       setViews((prevViews) => [
//         { id: nextId, url: formattedUrl, type: "desktop" },
//         { id: nextId + 1, url: formattedUrl, type: "tablet" },
//         { id: nextId + 2, url: formattedUrl, type: "mobile" },
//         ...prevViews,
//       ]);
//       setNextId(nextId + 3);
//       setHistory((prev) => Array.from(new Set([formattedUrl, ...prev])));
//       setUrl("");
//     }
//   };

//   const removeView = (id: number) => {
//     setViews(views.filter((view) => view.id !== id));
//   };

//   const changeViewType = (id: number, type: ViewType) => {
//     setViews(views.map((view) => (view.id === id ? { ...view, type } : view)));
//   };

//   const removeFromHistory = (urlToRemove: string) => {
//     setHistory((prev) => prev.filter((item) => item !== urlToRemove));
//   };

//   const clearAllViews = () => {
//     setViews([]);
//   };

//   const formatUrl = (inputUrl: string) => {
//     let formattedUrl = inputUrl.trim();
//     if (
//       !formattedUrl.startsWith("http://") &&
//       !formattedUrl.startsWith("https://")
//     ) {
//       formattedUrl = "https://" + formattedUrl;
//     }
//     if (
//       formattedUrl.includes("localhost") &&
//       formattedUrl.startsWith("https://")
//     ) {
//       formattedUrl = formattedUrl.replace("https://", "http://");
//     }
//     return formattedUrl;
//   };

//   const addToFavorites = (url: string) => {
//     if (!favorites.includes(url)) {
//       setFavorites((prev) => [...prev, url]);
//     }
//   };

//   const removeFromFavorites = (url: string) => {
//     setFavorites((prev) => prev.filter((item) => item !== url));
//   };

//   return (
//     <div className="space-y-6">
//       <div className="space-y-2">
//         <Label htmlFor="url-input">Enter Website URL:</Label>
//         <div className="flex gap-2 flex-col lg:flex-row">
//           <Input
//             id="url-input"
//             type="text"
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//             placeholder="example.com or localhost:3000"
//             className="flex-grow"
//           />
//           <div className="flex gap-1">
//             <Button onClick={addView}>
//               <PlusCircle className="mr-2 h-4 w-4" /> Add View
//             </Button>
//             <Button onClick={addAllViews}>
//               <PlusCircle className="mr-2 h-4 w-4" /> View All
//             </Button>
//             {views.length > 0 && (
//               <Button onClick={clearAllViews} variant="destructive">
//                 <Trash2 className="mr-2 h-4 w-4" /> Clear All
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>
//       <div className="space-y-2">
//         {favorites.length > 0 && <Label>Favorites:</Label>}
//         <div className="flex flex-wrap gap-2">
//           {favorites.map((item, index) => (
//             <div
//               key={index}
//               className="flex items-center bg-gray-100 rounded-md"
//             >
//               <button
//                 onClick={() => setUrl(item)}
//                 className="text-sm text-blue-600 hover:underline px-2 py-1"
//               >
//                 {item}
//               </button>
//               <button
//                 onClick={() => removeFromFavorites(item)}
//                 className="text-gray-500 hover:text-gray-700 px-2 py-1"
//               >
//                 <X className="h-3 w-3" />
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//       {history.length > 0 && (
//         <div className="space-y-2">
//           <Label>Recent URLs:</Label>
//           <div className="flex flex-wrap gap-2">
//             {history.map((item, index) => (
//               <div
//                 key={index}
//                 className="flex items-center bg-gray-100 rounded-md"
//               >
//                 <button
//                   onClick={() => setUrl(item)}
//                   className="text-sm text-blue-600 hover:underline px-2 py-1"
//                 >
//                   {item}
//                 </button>
//                 <button
//                   onClick={() => addToFavorites(item)}
//                   className="text-gray-500 hover:text-gray-700 px-2 py-1"
//                 >
//                   <Star className="h-3 w-3" />
//                 </button>
//                 <button
//                   onClick={() => removeFromHistory(item)}
//                   className="text-gray-500 hover:text-gray-700 px-2 py-1"
//                 >
//                   <X className="h-3 w-3" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//       <div className="flex flex-wrap gap-6 justify-start">
//         {views.map((view, index) => (
//           <WebsiteView
//             key={view.id}
//             view={view}
//             onRemove={() => removeView(view.id)}
//             onTypeChange={(type) => changeViewType(view.id, type)}
//             index={views.length - index - 1}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X, Globe, Trash2, Star } from "lucide-react";
import WebsiteView from "./WebsiteView";

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
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Load favorites from localStorage on the client side
    const storedFavorites = localStorage.getItem("favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  useEffect(() => {
    // Save favorites to localStorage whenever it changes
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

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
      alert("Please enter a valid URL");
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
      alert("Please enter a valid URL");
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

  const addToFavorites = (url: string) => {
    const formattedUrl = formatUrl(url);
    if (formattedUrl && !favorites.includes(formattedUrl)) {
      setFavorites((prev) => [...prev, formattedUrl]);
    }
  };

  const removeFromFavorites = (url: string) => {
    setFavorites((prev) => prev.filter((item) => item !== url));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="url-input">Enter Website URL:</Label>
        <div className="flex gap-2 flex-col lg:flex-row">
          <Input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or localhost:3000"
            className="flex-grow"
          />
          <div className="flex gap-1">
            <Button onClick={addView} disabled={!formatUrl(url)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add View
            </Button>
            <Button onClick={addAllViews} disabled={!formatUrl(url)}>
              <PlusCircle className="mr-2 h-4 w-4" /> View All
            </Button>
            {views.length > 0 && (
              <Button onClick={clearAllViews} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {favorites.length > 0 && <Label>Favorites:</Label>}
        <div className="flex flex-wrap gap-2">
          {favorites.map((item, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-100 rounded-md"
            >
              <button
                onClick={() => setUrl(item)}
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
      {history.length > 0 && (
        <div className="space-y-2">
          <Label>Recent URLs:</Label>
          <div className="flex flex-wrap gap-2">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-md"
              >
                <button
                  onClick={() => setUrl(item)}
                  className="text-sm text-blue-600 hover:underline px-2 py-1"
                >
                  {item}
                </button>
                <button
                  onClick={() => addToFavorites(item)}
                  className="text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  <Star className="h-3 w-3" />
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
      <div className="flex flex-wrap gap-6 justify-start">
        {views.map((view, index) => (
          <WebsiteView
            key={view.id}
            view={view}
            onRemove={() => removeView(view.id)}
            onTypeChange={(type) => changeViewType(view.id, type)}
            index={views.length - index - 1}
          />
        ))}
      </div>
    </div>
  );
}
