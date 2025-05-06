import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { getUsersByGroup, getUserRole } from "~/models/group.server";
import { useRevalidator } from "@remix-run/react";
import mapboxgl, { Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/userpanel/actionbar";
import MemoCreateModal from "~/components/memo/create";
import MemoDetailModal from "~/components/memo/detail";
import { MapBoxSearch } from "~/components/searchbar";
import { getUserId } from "~/session.server";
import Bar from "~/components/memo/bar";
import { Button } from "~/components/ui/button";
import { Memo } from "@prisma/client";
// Client-side role type
type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
import type { User } from "@prisma/client";
import UserSearch from "~/components/usersearch";

import Avatar from "boring-avatars";
import { ScrollArea } from "~/components/ui/scroll-area";
import UserProfile from "~/components/group/userprofile";

type LoaderData = {
  vapidPublicKey: string;
  mapboxToken: string;
  memos: Memo[];
  userId: string;
  username: string;
  uuid: string;
  avatarUrl: string | null;
  groupId: string;
  groupUsers: (User & { role: Role })[];
  currentUserRole: Role;
};
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
import toastr from "toastr";
import "toastr/build/toastr.css";
import { useAtom } from "jotai/react";
import { bearingAtom, locationAtom, zoomAtom } from "~/atoms/locationAtom";

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

  const groupUsers = await getUsersByGroup(groupId);
  const currentUserRole = await getUserRole(groupId, userId);

  // グループ所属チェック
  if (!groupUsers.some((u) => u.id === userId)) {
    throw redirect(`/mymap`);
  }

  return json<LoaderData>({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY!,
    mapboxToken,
    memos: groupMemos,
    userId,
    username: user.name,
    uuid: user.uuid,
    avatarUrl: user.avatar,
    groupId,
    groupUsers,
    currentUserRole,
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
    groupUsers,
    currentUserRole,
  } = useLoaderData<LoaderData>();
  // 権限順にソート: OWNER, ADMIN, EDITOR, VIEWER
  const roleOrder: Record<string, number> = {
    OWNER: 0,
    ADMIN: 1,
    EDITOR: 2,
    VIEWER: 3,
  };
  const sortedMembers = [...groupUsers].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role]
  );
  const revalidator = useRevalidator();

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

  const [showGroupDetailModal, setShowGroupDetailModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(
    null
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);

  const [location, setLocation] = useAtom(locationAtom);
  const [zoom, setZoom] = useAtom(zoomAtom);
  const [bearing, setBearing] = useAtom(bearingAtom);

  const handleMoveEnd = (map: mapboxgl.Map) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bearing = map.getBearing();
    setZoom(zoom);
    setLocation([center.lng, center.lat]);
    setBearing(bearing);
  };

  // Click outside to close profile modal
  useEffect(() => {
    if (!showProfileModal) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        profileModalRef.current &&
        !profileModalRef.current.contains(e.target as Node)
      ) {
        setShowProfileModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileModal]);

  // Click outside to close group modal
  useEffect(() => {
    if (!showGroupDetailModal) return;
    function handleClickOutside(event: MouseEvent) {
      if (showProfileModal) return;
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowGroupDetailModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showGroupDetailModal, showProfileModal]);

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
      center: location,
      bearing: bearing,
      zoom: zoom,
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

    map.on("moveend", () => {
      handleMoveEnd(map);
    });

    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition((position) => {
    //     const { latitude, longitude } = position.coords;
    //     map.flyTo({
    //       center: [longitude, latitude],
    //       zoom: 16,
    //     });
    //   });
    // }

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

    // Only allow non-VIEWERs to create memos by double-clicking
    const handleDblClick = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      if (currentUserRole === "VIEWER") {
        toastr.warning("メモの作成権限がありません");
        return;
      }
      const coordinates = e.lngLat;
      setModalLat(coordinates.lat);
      setModalLng(coordinates.lng);
      setShowModal(true);
    };
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("dblclick", handleDblClick);
    };
  }, [memos, setModalLat, setModalLng, setShowModal, currentUserRole]);

  const handleGroupDetail = () => {
    setShowGroupDetailModal(true);
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 16,
          });
        }
      });
    }
  };

  const handleAddMember = async (targetUserId: string) => {
    const res = await fetch("/api/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "add",
        groupId,
        targetUserId,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(`メンバー追加に失敗しました: ${data.error}`);
    }
    revalidator.revalidate();
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
    <>
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

        <div className="fixed top-4 inset-x-5 flex-nowrap flex items-center gap-2 z-50">
          <Form action="/home" className="flex-none">
            <Button className="rounded-full w-12 h-12 flex items-center justify-center shadow-md">
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
          <div className="flex-none flex-shrink-0 w-12 h-12 flex items-center justify-center">
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
          handleGroupDetail={handleGroupDetail}
          handleSearchMemo={handleSearchMemo}
          handleGoToCurrentLocation={handleGoToCurrentLocation}
          userId={userId}
          groupeId={groupId}
          groupeName={"Group Name"}
        />

        <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <DrawerContent className="mx-auto h-[70vh] bg-black text-white w-full max-w-[768px] z-[1100]">
            <DrawerHeader>
              <DrawerTitle>メモを検索</DrawerTitle>
            </DrawerHeader>
            <MemoList
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filteredMemos={filteredMemos}
              jumpToMemo={jumpToMemo}
              actorRole={currentUserRole}
            />
          </DrawerContent>
        </Drawer>

        {showModal && currentUserRole !== "VIEWER" && (
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
            actorRole={currentUserRole}
          />
        )}
        <Drawer
          open={showGroupDetailModal}
          onOpenChange={(open: boolean) => {
            if (!showProfileModal) {
              setShowGroupDetailModal(open);
            }
          }}
        >
          <DrawerContent className="mx-auto h-[70vh] w-full max-w-[768px] bg-black text-white px-4 pb-4 z-[1100]">
            <DrawerHeader>
              <DrawerTitle>メンバーリスト</DrawerTitle>
            </DrawerHeader>
            {/* Owner/Admin */}
            {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
              <div className="px-4 pt-4">
                <UserSearch
                  currentUserId={userId}
                  selectedUsers={groupUsers}
                  onUserAdd={(user) => handleAddMember(user.id)}
                />
              </div>
            )}
            {/* All roles */}
            <ScrollArea className="w-full h-[80vh] pr-2 mt-2">
              <ul className="w-full space-y-2">
                {sortedMembers.map((user: User & { role: Role }) => (
                  <li key={user.id}>
                    <Button
                      onClick={() => {
                        setSelectedProfileUser(user);
                        setShowProfileModal(true);
                      }}
                      className="block w-full h-18 flex items-center justify-start gap-8 px-4 bg-gray-900 hover:bg-gray-800 rounded text-left [&_svg]:w-16 [&_svg]:h-16"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="flex-shrink-0 rounded-full object-cover w-16 h-16"
                        />
                      ) : (
                        <div className="flex-shrink-0">
                          <Avatar size={64} name={user.uuid} variant="beam" />
                        </div>
                      )}
                      <div className="flex flex-col text-left">
                        <p className="text-lg font-medium text-white flex items-center">
                          {user.name}
                        </p>
                        <p className="text-md text-gray-400">
                          @{user.uuid}
                          <span
                            className={`ml-2 px-2 py-1 bg-gray-700 text-xs rounded ${
                              user.role === "OWNER"
                                ? "text-yellow-300"
                                : user.role === "ADMIN"
                                ? "text-blue-400"
                                : user.role === "EDITOR"
                                ? "text-green-400"
                                : "text-gray-500"
                            }`}
                          >
                            {user.role}
                          </span>
                        </p>
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>

      {showProfileModal && selectedProfileUser && (
        <div
          role="dialog"
          aria-modal="true"
          tabIndex={0}
          className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setShowProfileModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              setShowProfileModal(false);
            }
          }}
        >
          <div
            ref={profileModalRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="bg-gray-900 relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="absolute top-2 right-2 text-white hover:text-red-400 w-8 h-8 flex items-center justify-center rounded-full text-4xl"
            >
              ×
            </button>
            <UserProfile
              username={selectedProfileUser.name}
              avatarUrl={selectedProfileUser.avatar}
              uuid={selectedProfileUser.uuid}
              role={selectedProfileUser.role}
              actorRole={currentUserRole}
              groupId={groupId}
              actorId={userId}
              userId={selectedProfileUser.id}
              onRoleChange={async (newRole) => {
                const res = await fetch("/api/group", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    groupId,
                    targetUserId: selectedProfileUser.id,
                    newRole,
                  }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  alert(`権限変更に失敗しました: ${data.error}`);
                }
                revalidator.revalidate();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
