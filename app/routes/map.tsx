import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/actionbar";

export const loader = async () => {
  return json({ mapboxToken: process.env.MAPBOX_TOKEN });
};

export default function MapPage() {
  const { mapboxToken } = useLoaderData<{ mapboxToken: string }>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [currentLocation, setCurrentLocation]  = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [139.6917, 35.6895],
      zoom: 16,
      minZoom: 5,
      pitch: 45,
      antialias: true,
    });

    map.addControl(new MapboxLanguage({ defaultLanguage: "ja" }));

    map.on("load", () => {
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.terrain-rgb",
        tileSize: 512,
        maxzoom: 16,
        minzoom: 45,
      });

      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

      map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.6,
        },
      });
    });

    mapRef.current = map;
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([longitude, latitude]);

          // 現在地用のカスタムマーカー
          const customMarker = document.createElement("div");
          customMarker.style.width = "20px";
          customMarker.style.height = "20px";
          customMarker.style.backgroundColor = "#007BFF"; // 青色
          customMarker.style.borderRadius = "50%";
          customMarker.style.border = "3px solid white";
          customMarker.style.boxShadow = "0 0 5px rgba(0, 0, 255, 0.5)";

          new mapboxgl.Marker(customMarker)
            .setLngLat([longitude, latitude])
            .addTo(map);

          map.flyTo({ center: [longitude, latitude], zoom: 16 });
        },
        (error) => console.error("位置情報の取得に失敗:", error),
        { enableHighAccuracy: true }
      );
    }

    return () => map.remove();
  }, [mapboxToken]);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({ center: [139.6917, 35.6895], zoom: 12 });
    }
  };

  const handleReturnToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current?.flyTo({
        center: currentLocation,
        zoom: 14,
      });
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={mapContainerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      />
      <ActionBar onReturnToCurrentLocation={handleReturnToCurrentLocation} />
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: "10px 20px",
          borderRadius: "8px",
        }}
      >
        <button
          onClick={handleZoomIn}
          style={{
            color: "#fff",
            backgroundColor: "#333",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ボタン1
        </button>
        <button
          onClick={handleZoomOut}
          style={{
            color: "#fff",
            backgroundColor: "#333",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ボタン2
        </button>
        <button
          onClick={handleReset}
          style={{
            color: "#fff",
            backgroundColor: "#333",
            border: "none",
            padding: "8px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ボタン3
        </button>
      </div>
    </div>
  );
}
