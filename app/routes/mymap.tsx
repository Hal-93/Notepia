import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import mapboxgl, { Marker } from "mapbox-gl";
// import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
} from "@fortawesome/free-solid-svg-icons";

import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/actionbar";
import MemoCreateModal from "~/components/memo/create";
import MemoDetailModal from "~/components/memo/detail";
import { getUserId } from "~/session.server";
import Bar from "~/components/memo/bar";
import { Button } from "~/components/ui/button";
import { Memo } from "@prisma/client";
import { getUserById, updateUserAvatar, updateUserName } from "~/models/user.server";
import sharp from "sharp";
import { uploadFile } from "~/utils/minio.server";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import "~/popup.css";
import { MapBoxSearch } from "~/components/searchbar";


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
  const username = formData.get("username") as string;
  if (username && file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      updateUserName(userId!, username);
      const pngBuffer = await sharp(buffer).png().toBuffer();
      const metadata = { "Content-Type": "image/png" };
      await uploadFile(pngBuffer, `${uuid}.png`, metadata);
      await updateUserAvatar(userId!, `/user/${uuid}/avatar`);
      return json({ message: "更新しました。" }, { status: 200 });
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }
  if (username) {
    try {
      updateUserName(userId!, username);
      return json({ message: "更新しました。" }, { status: 200 });
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }

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
      await updateUserAvatar(userId, `/user/${uuid}/avatar`);

      return json(
        { message: "アイコンをアップロードしました。" },
        { status: 200 }
      );
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
    vapidPublicKey,
  } = useLoaderData<typeof loader>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fetcher = useFetcher();
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalLat, setModalLat] = useState(35.684);
  const [modalLng, setModalLng] = useState(139.759);
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const memoMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = mapboxToken;

    const getMapStyle = () => {
      const hours = new Date().getHours();
    
      if (hours >= 20 && hours < 0) {
        return "mapbox://styles/so03jp/cm8q4hwxg00bs01rc8u2iemed"; // Night
      }
      else if (hours >= 0 && hours < 4) {
        return "mapbox://styles/so03jp/cm8q4hwxg00bs01rc8u2iemed"; // Night
      }
      else if (hours >= 4 && hours < 8) {
        return "mapbox://styles/so03jp/cm8q4cycp00d201rd9i026h1g"; // Dawn
      }
      else if (hours >= 8 && hours < 16) {
        return "mapbox://styles/so03jp/cm8q4fqii00cp01sneoqucgne"; // Day
      }
      else {
        return "mapbox://styles/so03jp/cm8qukfop00f701sn2kmtf5ov"; // Dusk
      }
    };
    

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      center: [139.759, 35.684],
      zoom: 16,
      minZoom: 5,
      pitch: 45,
      antialias: true,
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
      <div className="fixed top-6 left-5">
        <Form action="/home">
          <Button><FontAwesomeIcon icon={faHouse} />ホームに戻る</Button>
        </Form>
      </div>
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
      <ActionBar
        username={username!}
        uuid={uuid!}
        initialAvatarUrl={avatarUrl}
        publicKey={vapidPublicKey}
        userId={userId}
      />
      <Bar
        handleSearchMemo={handleSearchMemo}
        handleGoToCurrentLocation={handleGoToCurrentLocation}
        userId={userId}
        groupeId="defaultGroupId"
        groupeName="defaultGroupName"
      />

      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="h-[80vh] bg-black text-white">
          <DrawerHeader>
            <DrawerTitle>メモを検索</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <Input
              placeholder="メモのタイトル"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            />

            {/* 黒基調のタブコンポーネント */}
            <Tabs defaultValue="incomplete" className="mt-4">
              <TabsList className="flex space-x-2 bg-black border-b border-gray-600">
                <TabsTrigger 
                  value="incomplete" 
                  className="px-4 py-2 text-white focus:outline-none transition-all data-[state=active]:bg-gray-800 data-[state=active]:text-blue-400"
                >
                  未完了
                </TabsTrigger>
                <TabsTrigger 
                  value="complete" 
                  className="px-4 py-2 text-white focus:outline-none transition-all data-[state=active]:bg-gray-800 data-[state=active]:text-blue-400"
                >
                  完了済み
                </TabsTrigger>
              </TabsList>

              {/* 未完了タブ */}
              <TabsContent value="incomplete">
                <ScrollArea className="h-[50vh] pr-2 mt-2">
                  {filteredMemos.filter((m) => !m.completed).length === 0 ? (
                    <div className="text-gray-500 text-sm">未完了のメモはありません。</div>
                  ) : (
                    <ul className="space-y-2">
                      {filteredMemos
                        .filter((memo) => !memo.completed)
                        .map((memo) => (
                          <li
                            key={memo.id}
                            role="button"
                            tabIndex={0}
                            className="p-3 rounded text-black cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundColor: memo.color || "#ffffff" }}
                            onClick={() => jumpToMemo(memo)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                jumpToMemo(memo);
                              }
                            }}
                          >
                            {memo.title}
                          </li>
                        ))}
                    </ul>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* 完了済みタブ */}
              <TabsContent value="complete">
                <ScrollArea className="h-[50vh] pr-2 mt-2">
                  {filteredMemos.filter((m) => m.completed).length === 0 ? (
                    <div className="text-gray-500 text-sm">完了済みのメモはありません。</div>
                  ) : (
                    <ul className="space-y-2">
                      {filteredMemos
                        .filter((memo) => memo.completed)
                        .map((memo) => (
                          <li
                            key={memo.id}
                            role="button"
                            tabIndex={0}
                            className="p-3 rounded text-black cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundColor: memo.color || "#ffffff" }}
                            onClick={() => jumpToMemo(memo)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                jumpToMemo(memo);
                              }
                            }}
                          >
                            {memo.title}
                          </li>
                        ))}
                    </ul>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
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