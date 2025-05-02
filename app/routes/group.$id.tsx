import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/actionbar";
import MemoCreateModal from "~/components/memo/create";
import MemoDetailModal from "~/components/memo/detail";
import { MapBoxSearch } from "~/components/searchbar";
import { getUserId } from "~/session.server";
import Bar from "~/components/memo/bar";
import { Button } from "~/components/ui/button";
import { Memo } from "@prisma/client";
import { getUserById } from "~/models/user.server";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import MemoList from "~/components/memo/memolist";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome } from "@fortawesome/free-solid-svg-icons";

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);
  if (!userId) throw redirect("/login");

  const groupId = params.id;
  if (!groupId)
    throw new Response("グループIDが指定されていません", { status: 400 });

  const { getMemosByGroup } = await import("~/models/memo.server");
  const groupMemos = await getMemosByGroup(groupId);

  const user = await getUserById(userId);
  if (!user) throw redirect("/login");

  const mapboxToken = process.env.MAPBOX_TOKEN;
  if (!mapboxToken) throw new Response("サーバー設定エラー", { status: 500 });

  return json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY!,
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
    vapidPublicKey,
  } = useLoaderData<typeof loader>();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fetcher = useFetcher();

  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalLat, setModalLat] = useState(0);
  const [modalLng, setModalLng] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMemos(memos);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredMemos(
        memos.filter((memo: Memo) => memo.title.toLowerCase().includes(lower))
      );
    }
  }, [searchQuery, memos]);

  const memoMarkersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    //Design マップのスタイル
    const getMapStyle = () => {
      const hours = new Date().getHours();

      if (hours >= 20 || hours < 4) {
        return "mapbox://styles/so03jp/cm9zurz3t004e01sp63ke1ngh"; // Night
      } else if (hours >= 4 && hours < 8) {
        return "mapbox://styles/so03jp/cm9zu6y0h00py01ssf79y7lkr"; // Dawn
      } else if (hours >= 8 && hours < 16) {
        return "mapbox://styles/so03jp/cm9zu55nn004a01spbkjbf94v"; // Day
      } else {
        return "mapbox://styles/so03jp/cm9zu7s4700yi01rmgn9p75xi"; // Dusk
      }
    };

    //Design マップの設定
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      center: [139.759, 35.684],
      zoom: 16,
      minZoom: 5,
      pitch: 45,
      antialias: true,
      attributionControl: false,
    });

    // map.addControl(new MapboxLanguage({ defaultLanguage: "ja" }));
    map.doubleClickZoom.disable();

    map.on("load", () => {
      if (map.getTerrain()) {
        map.setTerrain(null);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 16,
        });
      });
    }

    mapRef.current = map;
    return () => map.remove();
  }, [mapboxToken]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    memoMarkersRef.current.forEach((marker) => {
      marker.getPopup()?.remove();
      marker.remove();
    });
    memoMarkersRef.current = [];

    const newMarkers: mapboxgl.Marker[] = [];

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

          const popupClass = `popup-color-${(memo.color || "#ffffff").replace(
            "#",
            ""
          )}`;

          marker.setPopup(
            new mapboxgl.Popup({
              className: popupClass,
              offset: 25,
              closeOnClick: false,
              closeButton: false,
            }).setDOMContent(popupContent)
          );

          marker.togglePopup();
        }

        newMarkers.push(marker);
      }
    });

    memoMarkersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((marker) => {
        marker.getPopup()?.remove();
        marker.remove();
      });
      memoMarkersRef.current = [];
    };
  }, [memos]);

  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([longitude, latitude]);

          if (markerRef.current) {
            markerRef.current.setLngLat([longitude, latitude]);
          } else {
            const customMarker = document.createElement("div");
            customMarker.style.width = "20px";
            customMarker.style.height = "20px";
            customMarker.style.backgroundColor = "#007BFF";
            customMarker.style.borderRadius = "50%";
            customMarker.style.border = "3px solid white";
            customMarker.style.boxShadow = "0 0 5px rgba(0, 0, 255, 0.5)";

            markerRef.current = new mapboxgl.Marker(customMarker)
              .setLngLat([longitude, latitude])
              .addTo(map);
          }
        },
        (error) => console.error("Geolocation error:", error)
      );
    }

    map.on("dblclick", (e) => {
      const coordinates = e.lngLat;

      const customMarker = document.createElement("div");
      customMarker.style.width = "20px";
      customMarker.style.height = "20px";
      customMarker.style.backgroundColor = "#007BFF";
      customMarker.style.borderRadius = "50%";
      customMarker.style.border = "3px solid white";
      customMarker.style.boxShadow = "0 0 5px rgba(0, 0, 255, 0.5)";

      setModalLat(coordinates.lat);
      setModalLng(coordinates.lng);
      setShowModal(true);
    });

    return () => {
      map.off("dblclick", () => {});
    };
  }, [memos, setModalLat, setModalLng, setShowModal]);

  const handleMakeFriend = () => {
    /*フレンド追加機能 */
  };

  const handleSearchMemo = () => {
    setIsDrawerOpen(true);
  };

  const jumpToMemo = (memo: Memo) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [memo.longitude!, memo.latitude!],
        zoom: 18,
      });
      setIsDrawerOpen(false);
    }
  };

  const handleGoToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current?.flyTo({
        center: currentLocation,
        zoom: 16,
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
      <div className="fixed top-4 inset-x-5 flex flex-wrap items-center gap-2 z-50">
        <Form action="/home" className="flex-none">
          <Button
            onClick={handleSearchMemo}
            className="rounded-full w-12 h-12 flex items-center justify-center shadow-md"
          >
            <FontAwesomeIcon icon={faHome}></FontAwesomeIcon>
          </Button>
        </Form>
        <div className="relative flex-1 min-w-0">
          <MapBoxSearch
            api={mapboxToken}
            onSelect={(place) => {
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: place.center,
                  zoom: 16,
                  essential: true,
                });
              }
            }}
          />
        </div>
        <div className="flex-none">
          <ActionBar
            username={username!}
            uuid={uuid!}
            initialAvatarUrl={avatarUrl}
            publicKey={vapidPublicKey}
            userId={userId}
          />
        </div>
      </div>

      <Bar
        handleMakeFriend={handleMakeFriend}
        handleSearchMemo={handleSearchMemo}
        handleGoToCurrentLocation={handleGoToCurrentLocation}
        userId={userId}
        groupeId={groupId}
        groupeName={"Group Name"}
      />

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="mx-auto h-[80vh] bg-black text-white w-full max-w-[768px]">
          <DrawerHeader>
            <DrawerTitle>メモを検索</DrawerTitle>
          </DrawerHeader>
          <MemoList
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredMemos={filteredMemos}
            jumpToMemo={jumpToMemo}
          />
        </DrawerContent>
      </Drawer>

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
