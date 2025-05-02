"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faXmark, faLandmark, faPlane, faTrain, faUtensils, faCartShopping } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// Define suggestion type
interface Suggestion {
  mapbox_id: string;
  name?: string;
  full_address?: string;
  place_formatted?: string;
  center?: number[];
  poi_category?: string[];
  context?: { postcode?: { name: string } };
  geometry?: { coordinates?: number[] };
}

export interface MapBoxPlace {
  id: string;
  place_name: string;
  full_address?: string;
  center: [number, number];
  place_type: string[];
  postcode?: string;
  zoom?: number;
}

interface MapBoxSearchProps {
  api: string;
  onSelect?: (place: MapBoxPlace) => void;
}


export const MapBoxSearch: React.FC<MapBoxSearchProps> = ({ api, onSelect }) => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<MapBoxPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const sessionToken = React.useMemo(() => uuidv4(), []);

  useEffect(() => {
    if (query.length < 1) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest` +
          `?q=${encodeURIComponent(query)}` +
          `&language=ja` +
          `&limit=7` +
          `&session_token=${sessionToken}` +
          `&country=JP` +
          `&access_token=${api}`
        );
        const data = await response.json();
        const raw = (data.suggestions ?? []) as Suggestion[];
        // Exclude entire non-building categories
        const deny = ["レストラン", "幼稚園", "ショップ", "カフェ", "ホテル"];
        const filtered = raw.filter(f =>
          !(f.poi_category ?? []).some(cat => deny.includes(cat))
        );
        setPredictions(
          filtered.map(f => ({
            id: f.mapbox_id,
            place_name: f.name ?? f.full_address ?? f.place_formatted ?? "",
            full_address: f.full_address,
            // placeholder center; real coords fetched on selection
            center: [0, 0] as [number, number],
            place_type: f.poi_category ?? [],
            postcode: f.context?.postcode?.name,
          }))
        );
      } catch (error) {
        console.error("Error fetching predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchPredictions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, api, sessionToken]);

  const getIconForCategory = (types: string[]): IconDefinition => {
    if (types.includes("トラベル>観光名所")) return faLandmark;
    if (types.includes("トラベル>鉄道")) return faTrain;
    if (types.includes("トラベル>空港")) return faPlane;
    if (types.includes("レストラン")) return faUtensils;
    if (types.includes("ショップ")) return faCartShopping;
    return faMapMarkerAlt;
  };


  const handleSelect = async (place: MapBoxPlace) => {
    // Fallback geocoding sequence: full_address → postcode → place_name
    let coords: [number, number] | undefined;
    const queries: (string | undefined)[] = [
      place.full_address,
      place.postcode,
      place.place_name
    ];
    for (const q of queries) {
      if (!q) continue;
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            q
          )}.json?access_token=${api}&limit=1&country=JP`
        );
        const data = await res.json();
        const feat = data.features?.[0];
        if (feat && Array.isArray(feat.center) && feat.center.length === 2) {
          coords = [feat.center[0], feat.center[1]];
          break;
        }
      } catch (err) {
        console.error(`Geocoding error for "${q}":`, err);
      }
    }
    if (!coords) {
      console.error("Failed to geocode with full_address, postcode, or place_name");
      coords = place.center; // fallback
    }
    if (onSelect) {
      onSelect({ ...place, center: coords, zoom: place.zoom ?? 16 });
    }
    setQuery(place.place_name);
    setPredictions([]);
    setShowDropdown(false);
  };

  const clearQuery = () => {
    setQuery("");
    setPredictions([]);
    setShowDropdown(false);
  };

  const displayedPredictions = predictions.slice(0, 8);

  return (
    <div className="w-full max-w-md relative z-50 mx-auto pr-16">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          placeholder="建物名で検索"
          className="w-full px-6 py-2 pr-16 bg-white text-black border border-gray-300 rounded-full shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="検索クリア"
          >
            <FontAwesomeIcon icon={faXmark}/>
          </button>
        )}
      </div>
  
      {showDropdown && (
        <div className="absolute mt-1 w-full bg-white text-black border border-gray-200 rounded-md shadow-lg">
          {loading ? (
            <div className="p-2 text-black">読み込み中...</div>
          ) : displayedPredictions.length === 0 ? (
            <div className="p-2 text-gray-400">検索結果が見つかりませんでした</div>
          ) : (
            displayedPredictions.map((place) => (
              <button
                key={place.id}
                className="w-full text-left p-2 text-black hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSelect(place)}
              >
                <FontAwesomeIcon icon={getIconForCategory(place.place_type)} className="mr-2" />
                {place.place_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};