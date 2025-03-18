import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";

export const loader = async () => {
  return json({ mapboxToken: process.env.MAPBOX_TOKEN });
};

export default function MapPage() {
  const { mapboxToken } = useLoaderData<{ mapboxToken: string }>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [139.6917, 35.6895],
      zoom: 12,
    });

    map.addControl(new MapboxLanguage({ defaultLanguage: "ja" }));

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