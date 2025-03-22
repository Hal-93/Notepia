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

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await getUserId(request);
    if (!userId) throw redirect("/login");
  
    const groupId = params.id;
    if (!groupId) throw new Response("グループIDが指定されていません", { status: 400 });
  
    const { getMemosByGroup } = await import("~/models/memo.server");
    const groupMemos = await getMemosByGroup(groupId);
  
    const user = await getUserById(userId);
    if (!user) throw redirect("/login");
  
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) throw new Response("サーバー設定エラー", { status: 500 });
  
    return json({
      mapboxToken,
      memos: groupMemos,
      userId,
      username: user.name,
      uuid: user.uuid,
      avatarUrl: user.avatar,
      groupId,
    });
};

export const action: ActionFunction = async ({ request, params }) => {
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
    const groupId = params.id;

    const { createMemo } = await import("~/models/memo.server");
    const memo = await createMemo({
      title,
      content,
      place,
      createdById,
      latitude: lat,
      longitude: lng,
      color,
      groupId,
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
    groupId,
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
      style: "mapbox://styles/so03jp/cm8k8mtga018g01so5gl9b8w1",
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
  
      memos.forEach((memo: Memo) => {
        if (memo.latitude != null && memo.longitude != null) {
          const markerEl = document.createElement("div");
          markerEl.style.width = "20px";
          markerEl.style.height = "20px";
          markerEl.style.backgroundColor = memo.completed ? "#888888" : memo.color || "#ffffff";
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
            popupContent.style.backgroundColor = memo.color || "#ffffff";
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
  
    // 🔽 ここから追加: ダブルクリックでモーダルを表示する
    map.on("dblclick", (e: mapboxgl.MapMouseEvent) => {
      const coordinates = e.lngLat;
  
      // 仮のマーカーを設置
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
  
    // 🔽 現在地を取得・表示する処理を追加
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([longitude, latitude]);
  
          const currentLocationMarker = document.createElement("div");
          currentLocationMarker.style.width = "20px";
          currentLocationMarker.style.height = "20px";
          currentLocationMarker.style.backgroundColor = "#007BFF";
          currentLocationMarker.style.borderRadius = "50%";
          currentLocationMarker.style.border = "3px solid white";
          currentLocationMarker.style.boxShadow = "0 0 5px rgba(0, 0, 255, 0.5)";
  
          new mapboxgl.Marker(currentLocationMarker)
            .setLngLat([longitude, latitude])
            .addTo(map);
  
          map.flyTo({ center: [longitude, latitude], zoom: 14 });
        },
        (error) => {
          console.error("位置情報の取得に失敗しました:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  
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
      action: `/group/${groupId}`,
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
