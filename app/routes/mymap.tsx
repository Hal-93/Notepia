import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/actionbar";
import MemoCreateModal from "~/components/memo/create";
import MemoDetailModal from "~/components/memo/detail";
import { getUserId } from "~/session.server";
import Bar from "~/components/memo/bar";
import { Button } from "~/components/ui/button";
import { Memo } from "@prisma/client";
import { getUserById, updateUserAvatar } from "~/models/user.server";
import sharp from "sharp";
import { uploadFile } from "~/utils/minio.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");
  const { getUsersMemo } = await import("~/models/memo.server");
  const memos = userId ? await getUsersMemo(userId) : [];
  const user = await getUserById(userId!);
  const uuid = user?.uuid;
  const username = user?.name;
  const avatarUrl = user?.avatar as string | null;
  return json({
    mapboxToken: process.env.MAPBOX_TOKEN,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY!,
    memos,
    userId,
    username,
    uuid,
    avatarUrl,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const uuid = formData.get("uuid") as string;
  if (file) {
    const userId = (await getUserId(request)) as string;
    if (!userId) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const pngBuffer = await sharp(buffer).png().toBuffer();
      const metadata = { "Content-Type": "image/png" };
      await uploadFile(pngBuffer, `${uuid}.png`, metadata);
      await updateUserAvatar(userId, `user/${uuid}/avatar`);

      return json({ message: "アイコンをアップロードしました。" }, { status: 200 });
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  } else {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const place = formData.get("place") as string;
    const lat = parseFloat(formData.get("lat") as string);
    const lng = parseFloat(formData.get("lng") as string);
    const createdById = formData.get("createdById") as string;
    const color = formData.get("color") as string;

    const { createMemo } = await import("~/models/memo.server");
    const memo = await createMemo({
      title,
      content,
      place,
      createdById,
      latitude: lat,
      longitude: lng,
      color,
    });

    return json({ memo });
  }
};

export default function MapPage() {
  const {
    mapboxToken,
    memos,
    userId,
    username,
    uuid,
    avatarUrl,
  } = useLoaderData<typeof loader>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fetcher = useFetcher();

  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalLat, setModalLat] = useState(0);
  const [modalLng, setModalLng] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);

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

      memos.forEach((memo: Memo) => {
        if (memo.latitude != null && memo.longitude != null) {
          const markerEl = document.createElement("div");
          markerEl.style.width = "20px";
          markerEl.style.height = "20px";

          const bgColor = memo.completed ? "#000000" : memo.color || "#ffffff";
          markerEl.style.backgroundColor = bgColor;
          markerEl.style.borderRadius = "50%";
          markerEl.style.border = "3px solid white";
          markerEl.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.5)";

          const marker = new mapboxgl.Marker(markerEl)
            .setLngLat([memo.longitude, memo.latitude])
            .addTo(map);

          marker.getElement().addEventListener("click", (e) => {
            e.stopPropagation();
            setSelectedMemo(memo);
            setShowDetail(true);
          });

          if (!memo.completed) {
            const popupContent = document.createElement("div");
            popupContent.style.backgroundColor = bgColor;
            popupContent.style.padding = "8px";
            popupContent.style.cursor = "pointer";
            popupContent.innerHTML = `<b>${memo.title}</b>`;

            popupContent.addEventListener("click", (e) => {
              e.stopPropagation();
              setSelectedMemo(memo);
              setShowDetail(true);
            });

            marker.setPopup(
              new mapboxgl.Popup({
                offset: 25,
                closeOnClick: false,
                closeButton: false,
              }).setDOMContent(popupContent)
            );

            marker.togglePopup();
          }
        }
      });
    });

    map.doubleClickZoom.disable();
    mapRef.current = map;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([longitude, latitude]);
          const customMarker = document.createElement("div");
          customMarker.style.width = "20px";
          customMarker.style.height = "20px";
          customMarker.style.backgroundColor = "#007BFF"; // 青
          customMarker.style.borderRadius = "50%";
          customMarker.style.border = "3px solid white";
          customMarker.style.boxShadow = "0 0 5px rgba(0, 0, 255, 0.5)";

          new mapboxgl.Marker(customMarker)
            .setLngLat([longitude, latitude])
            .addTo(map);
        },
        (error: GeolocationPositionError) => {
          console.error("Geolocation error:", error);
        }
      );
    }

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
  const handleGoToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current?.flyTo({
        center: currentLocation,
        zoom: 14,
      });
    }
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
    formData.append("place", memoData.place);
    formData.append("lat", memoData.lat.toString());
    formData.append("lng", memoData.lng.toString());
    formData.append("createdById", userId);
    formData.append("color", memoData.color);
    fetcher.submit(formData, {
      method: "post",
      action: "/mymap",
      preventScrollReset: true,
    });
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
      <div className="fixed top-4 left-5">
        <Form action="/home">
          <Button>ホームに戻る</Button>
        </Form>
      </div>
      <ActionBar username={username!} uuid={uuid!} initialAvatarUrl={avatarUrl} />
      <Bar
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleGoToCurrentLocation={handleGoToCurrentLocation}
      />
      {showModal && (
        <MemoCreateModal
          lat={modalLat}
          lng={modalLng}
          mapboxToken={mapboxToken}
          onClose={handleCloseModal}
          onSubmit={handleSubmitMemo}
        />
      )}
      {showDetail && selectedMemo && (
        <MemoDetailModal
          memo={selectedMemo}
          onClose={() => {
            setShowDetail(false);
            setSelectedMemo(null);
          }}
        />
      )}
    </div>
  );
}
