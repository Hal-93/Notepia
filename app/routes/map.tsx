import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/actionbar";
import MemoCreateModal from "~/components/memo/create";
import { getUserId } from "~/session.server";
import type { Memo } from "@prisma/client";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  const { getUsersMemo } = await import("~/models/memo.server");
  const memos = userId ? await getUsersMemo(userId) : [];
  return json({ mapboxToken: process.env.MAPBOX_TOKEN, memos, userId });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const createdById = formData.get("createdById") as string;
  const color = formData.get("color") as string;

  const { createMemo } = await import("~/models/memo.server");
  const memo = await createMemo({
    title,
    content,
    createdById,
    latitude: lat,
    longitude: lng,
    color,
  });

  return json({ memo });
};

export default function MapPage() {
  const { mapboxToken, memos, userId } = useLoaderData<{
    mapboxToken: string;
    memos: Memo[];
    userId?: string;
  }>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fetcher = useFetcher();

  const [showModal, setShowModal] = useState(false);
  const [modalLat, setModalLat] = useState(0);
  const [modalLng, setModalLng] = useState(0);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v10",
      center: [139.6917, 35.6895],
      zoom: 12,
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
        maxzoom: 14,
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

      memos.forEach((memo) => {
        if (memo.latitude != null && memo.longitude != null) {
          const markerEl = document.createElement("div");
          markerEl.style.width = "20px";
          markerEl.style.height = "20px";
          markerEl.style.backgroundColor = memo.color || "#ffffff";
          markerEl.style.borderRadius = "50%";
          markerEl.style.border = "3px solid white";
          markerEl.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.5)";

          new mapboxgl.Marker(markerEl)
            .setLngLat([memo.longitude, memo.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<p>${memo.title}</p><p>${memo.content}</p>`
              )
            )
            .addTo(map);
        }
      });
    });

    map.doubleClickZoom.disable();

    map.on("dblclick", (e: mapboxgl.MapMouseEvent) => {
      const coordinates = e.lngLat;

      const customMarker = document.createElement("div");
      customMarker.style.width = "20px";
      customMarker.style.height = "20px";
      customMarker.style.backgroundColor = "#007BFF";
      customMarker.style.borderRadius = "50%";
      customMarker.style.border = "3px solid white";
      customMarker.style.boxShadow = "0 0 5px rgba(0, 0, 255, 0.5)";

      const marker = new mapboxgl.Marker(customMarker)
        .setLngLat(coordinates)
        .addTo(map);

      tempMarkerRef.current = marker;
      setModalLat(coordinates.lat);
      setModalLng(coordinates.lng);
      setShowModal(true);
    });

    mapRef.current = map;
    return () => map.remove();
  }, [mapboxToken, memos]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };
  const handleReset = () => {
    mapRef.current?.easeTo({ center: [139.6917, 35.6895], zoom: 12 });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  };

  const handleSubmitMemo = (memoData: {
    title: string;
    content: string;
    place: string;
    color: string;
    lat: number;
    lng: number;
  }) => {
    if (!userId) {
      console.error("ユーザーIDが取得できませんでした。");
      return;
    }
    const formData = new FormData();
    formData.append("title", memoData.title);
    formData.append("content", memoData.content);
    formData.append("lat", memoData.lat.toString());
    formData.append("lng", memoData.lng.toString());
    formData.append("createdById", userId);
    formData.append("color", memoData.color);
    fetcher.submit(formData, { method: "post", action: "/map" });
  
    if (tempMarkerRef.current) {
      const markerEl = tempMarkerRef.current.getElement();
      markerEl.style.backgroundColor = memoData.color;
      markerEl.style.boxShadow = `0 0 5px ${memoData.color}`;
      tempMarkerRef.current = null;
    }
    setShowModal(false);
  
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [memoData.lng, memoData.lat],
        zoom: mapRef.current.getZoom(),
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
      <ActionBar />
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
          ズームイン
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
          ズームアウト
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
          マップリセット
        </button>
      </div>
      {showModal && (
        <MemoCreateModal
          lat={modalLat}
          lng={modalLng}
          onClose={handleCloseModal}
          onSubmit={handleSubmitMemo}
        />
      )}
    </div>
  );
}