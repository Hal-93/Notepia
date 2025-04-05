"use client";

import React, { useState, useEffect } from "react";

export interface MapBoxPlace {
  id: string;
  place_name: string;
  center: [number, number];
}

interface MapBoxSearchProps {
  api: string;
  onSelect?: (place: MapBoxPlace) => void;
}

export const MapBoxSearch: React.FC<MapBoxSearchProps> = ({ api, onSelect }) => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<MapBoxPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${api}&autocomplete=true&limit=5&country=jp`
        );
        const data = await response.json();
        setPredictions(data.features ?? []);
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
  }, [query, api]);

  const handleSelect = (place: MapBoxPlace) => {
    console.log("Selected place:", place);
    setQuery(place.place_name);
    setPredictions([]);
    if (onSelect) {
      onSelect(place);
    }
  };


  const displayedPredictions = predictions.filter((place) =>
    place.place_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full max-w-md relative z-50 mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="検索"
        className="w-full p-2 bg-black text-white border border-gray-600 rounded focus:outline-none"
      />
  
      {query.length >= 2 && (
        <div className="absolute mt-1 w-full bg-black border border-gray-600 rounded shadow-lg">
          {loading ? (
            <div className="p-2 text-white">読み込み中...</div>
          ) : displayedPredictions.length === 0 ? (
            <div className="p-2 text-gray-400">候補が見つかりませんでした</div>
          ) : (
            displayedPredictions.map((place) => (
              <button
                key={place.id}
                className="w-full text-left p-2 text-white hover:bg-gray-800 cursor-pointer"
                onClick={() => handleSelect(place)}
              >
                {place.place_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};