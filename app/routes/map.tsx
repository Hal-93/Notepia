import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import {
  getUsersByGroup,
  getUserRole,
  checkIsInGroup,
  getGroupName,
  getGroupsAndMemberShips,
  GroupWithMembershipsAndUsers,
} from "~/models/group.server";
import { getUserTutorial, getUserMap } from "~/models/user.server";
import { useRevalidator } from "@remix-run/react";
import mapboxgl, { Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import ActionBar from "~/components/userpanel/actionbar";
import MemoCreateModal from "~/components/memo/create";
import { MapBoxSearch } from "~/components/searchbar";
import { getUserId } from "~/session.server";
import Bar from "~/components/memo/bar";
import Compass from "~/components/compass";
import { Button } from "~/components/ui/button";
import { Memo } from "@prisma/client";

type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
import type { User } from "@prisma/client";
import UserSearch from "~/components/usersearch";

import Avatar from "boring-avatars";
import { ScrollArea } from "~/components/ui/scroll-area";
import UserProfile from "~/components/group/userprofile";
import MemoList from "~/components/memo/memolist";
import toastr from "toastr";
import TutorialCarousel from "~/components/memo/tutorial";
import "toastr/build/toastr.css";
import { useAtom } from "jotai/react";
import {
  bearingAtom,
  currentLocationAtom,
  locationAtom,
  zoomAtom,
} from "~/atoms/locationAtom";
import MemoDetailModal from "~/components/memo/detail";
import {
  getUsersMemo,
  getMemosByGroup,
  createMemo,
} from "~/models/memo.server";
import { SheetSide } from "~/components/sheetside";
import { getUserById } from "~/models/user.server";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import TutorialLauncher from "~/components/memo/tutorial-launcher";

type LoaderData = {
  vapidPublicKey: string;
  mapboxToken: string;
  memos: Memo[];
  userId: string;
  username: string;
  uuid: string;
  avatarUrl: string | null;
  groupId: string | null;
  groupUsers: (User & { role: Role })[] | null;
  currentUserRole: Role | null;
  groupName: string | null;
  groups: GroupWithMembershipsAndUsers[];
  tutorialFlag: string | null;
  mapQuality: string | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) throw redirect("/login");
  const user = await getUserById(userId);
  if (!user) throw redirect("/login");

  const url = new URL(request.url);
  const groupId = url.searchParams.get("group");

  let memos: Memo[] | null = [];
  let groupUsers:
    | (User & {
        role: Role;
      })[]
    | null = null;
  let currentUserRole: Role | null = null;
  let groupName = null;
  if (groupId) {
    const isInGroup = await checkIsInGroup(userId, groupId);
    if (isInGroup) {
      memos = await getMemosByGroup(groupId);
      groupUsers = await getUsersByGroup(groupId);
      currentUserRole = await getUserRole(groupId, userId);
      groupName = await getGroupName(groupId);
    } else {
      throw redirect("/map");
    }
  } else {
    memos = await getUsersMemo(userId);
  }

  const groups = await getGroupsAndMemberShips(userId);
  const tutorialFlag = await getUserTutorial(userId);
  const mapQuality = await getUserMap(userId);

  const mapboxToken = process.env.MAPBOX_TOKEN;
  if (!mapboxToken) throw new Response("サーバー設定エラー", { status: 500 });

  return json<LoaderData>({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY!,
    mapboxToken,
    memos,
    userId,
    username: user.name,
    uuid: user.uuid,
    avatarUrl: user.avatar,
    groupId,
    groupUsers,
    currentUserRole,
    groupName,
    groups,
    tutorialFlag,
    mapQuality,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return;
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const place = formData.get("place") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const createdById = formData.get("createdById") as string;
  const color = formData.get("color") as string;
  const url = new URL(request.url);
  let groupId: string | undefined = url.searchParams.get("group") ?? undefined;
  if (groupId) {
    const isInGroup = await checkIsInGroup(userId, groupId);
    if (!isInGroup) groupId = undefined;
  }

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
    groupName,
    groups,
    tutorialFlag,
    mapQuality,
  } = useLoaderData<LoaderData>();
  const roleOrder: Record<string, number> = {
    OWNER: 0,
    ADMIN: 1,
    EDITOR: 2,
    VIEWER: 3,
  };
  let sortedMembers = null;
  if (groupUsers) {
    sortedMembers = [...groupUsers].sort(
      (a, b) => roleOrder[a.role] - roleOrder[b.role]
    );
  }

  const revalidator = useRevalidator();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tempMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const fetcher = useFetcher();
  const [forceTutorial, setForceTutorial] = useState(false);

  useEffect(() => {
    if (tutorialFlag === "false") {
      fetcher.submit(
        { tutorial: "true" },
        { method: "post", action: "/api/user-settings" }
      );
      setForceTutorial(true);
      revalidator.revalidate();
    }
  }, [tutorialFlag, fetcher, revalidator]);

  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalLat, setModalLat] = useState(0);
  const [modalLng, setModalLng] = useState(0);

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
  const [currentLocation, setCurrentLocation] = useAtom(currentLocationAtom);

  const handleMoveEnd = (map: mapboxgl.Map) => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bearing = map.getBearing();
    setZoom(zoom);
    setLocation([center.lng, center.lat]);
    setBearing(bearing);
  };
  const now = new Date();
  const hour = now.getHours();
  const isNight = hour >= 16 || hour < 4;

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
      // Low-quality map uses default streets style
      if (mapQuality === "low") {
        return "mapbox://styles/mapbox/streets-v11";
      }
      // High-quality map: use time-based styles
      const hours = new Date().getHours();
      if (hours >= 20 || hours < 4) {
        return "mapbox://styles/so03jp/cmacqbau900le01sn1i4t3fze"; // Night
      } else if (hours >= 4 && hours < 8) {
        return "mapbox://styles/so03jp/cmacq38zn00j701rf2uzp8yqa"; // Dawn
      } else if (hours >= 8 && hours < 16) {
        return "mapbox://styles/so03jp/cmacq6ily00l501rf5j67an3w"; // Day
      } else {
        return "mapbox://styles/so03jp/cmacpyy7d00j501rf8zq45x3w"; // Dusk
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

    map.doubleClickZoom.disable();

    map.on("load", () => {
      if (map.getTerrain()) {
        map.setTerrain(null);
      }
      map.addControl(
        new MapboxLanguage({
          defaultLanguage: "ja",
          onlyAlphabet: false,
        })
      );
    });

    map.on("moveend", () => {
      handleMoveEnd(map);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLocation([longitude, latitude]);
      });
    }

    mapRef.current = map;
    return () => map.remove();
  }, [mapboxToken, mapQuality]);

  useEffect(() => {
    const onSettingsUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail.map || !mapRef.current) return;
      const newQuality: string = detail.map;
      let newStyle: string;
      if (newQuality === "low") {
        newStyle = "mapbox://styles/mapbox/streets-v11";
      } else {
        const hours = new Date().getHours();
        if (hours >= 20 || hours < 4) {
          newStyle = "mapbox://styles/so03jp/cmacqbau900le01sn1i4t3fze";
        } else if (hours >= 4 && hours < 8) {
          newStyle = "mapbox://styles/so03jp/cmacq38zn00j701rf2uzp8yqa";
        } else if (hours >= 8 && hours < 16) {
          newStyle = "mapbox://styles/so03jp/cmacq6ily00l501rf5j67an3w";
        } else {
          newStyle = "mapbox://styles/so03jp/cmacpyy7d00j501rf8zq45x3w";
        }
      }
      mapRef.current.setStyle(newStyle);
    };
    window.addEventListener("user-settings-updated", onSettingsUpdated);
    return () => {
      window.removeEventListener("user-settings-updated", onSettingsUpdated);
    };
  }, []);

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
          if (map.getZoom() >= 10) {
            marker.togglePopup();
          }
        }

        newMarkers.push(marker);
      }
    });

    const handleZoomEnd = () => {
      memoMarkersRef.current.forEach((m) => {
        const popup = m.getPopup();
        if (popup) {
          if (map.getZoom() >= 10) {
            popup.addTo(map);
          } else {
            popup.remove();
          }
        }
      });
    };
    map.on("zoomend", handleZoomEnd);

    memoMarkersRef.current = newMarkers;

    return () => {
      map.off("zoomend", handleZoomEnd);
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
    if (currentLocation) {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [currentLocation[0], currentLocation[1]],
          zoom: 16,
        });
      }
    } else if (navigator.geolocation) {
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
      action: `/map?group=${groupId}`,
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
      <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        />

        <div className="fixed">
          <SheetSide
            username={username}
            avatarUrl={avatarUrl}
            uuid={uuid}
            groups={groups}
            userId={userId}
          />

          {/* Search bar */}
          <div className="fixed flex-nowrap flex items-center z-20 w-full">
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
            <h2
              className={`hidden md:flex ml-[76px] md:ml-[0px] mt-[18px] text-4xl h-[48px] font-bold truncate max-w-[60vw] md:max-w-[50vw] ${
                isNight ? "text-white" : "text-black"
              }`}
            >
            {groupName ? groupName : username}
            </h2>
          </div>

          {/* mapName */}
          <div className="fixed flex-nowrap flex items-center z-[5]">
            <h2
              className={`md:hidden ml-[76px] md:ml-[calc(32vw+70px)] mt-[18px] text-4xl h-[48px] font-bold truncate max-w-[60vw] md:max-w-[50vw] ${
                isNight ? "text-white" : "text-black"
              }`}
            >
            {groupName ? groupName : username}
            </h2>
          </div>

          {/* Action bar */}
          <div className="fixed flex-none flex-shrink-0 w-12 h-12 mt-[16px] md:mt-4 right-[16px] flex items-center justify-center" style={{ zIndex: 100, pointerEvents: "auto" }}>
            <ActionBar
              username={username!}
              uuid={uuid!}
              initialAvatarUrl={avatarUrl}
              publicKey={vapidPublicKey}
              userId={userId}
            />
          </div>

            <Bar
            {...(groupId ? { handleGroupDetail } : {})}
            handleSearchMemo={handleSearchMemo}
            handleGoToCurrentLocation={handleGoToCurrentLocation}
            userId={userId}
            groupeId={groupId!}
            groupeName={"Group Name"}
          />

          <Compass map={mapRef.current} />
          <TutorialLauncher />
        </div>

        <Bar
          {...(groupId ? { handleGroupDetail } : {})}
          handleSearchMemo={handleSearchMemo}
          handleGoToCurrentLocation={handleGoToCurrentLocation}
          userId={userId}
          groupeId={groupId!}
          groupeName={"Group Name"}
        />

        <Compass map={mapRef.current} />
        {forceTutorial && (
          <TutorialCarousel onClose={() => setForceTutorial(false)} />
        )}
        <TutorialLauncher/>

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
              actorRole={currentUserRole ?? undefined}
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
            actorRole={currentUserRole ?? undefined}
            currentUserId={userId}
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
          <DrawerContent className="mx-auto h-[70vh] w-full max-w-[768px] bg-black text-white px-4 pb-4 z-[500]">
            <DrawerHeader>
              <DrawerTitle>メンバーリスト</DrawerTitle>
            </DrawerHeader>
            {/* Owner/Admin */}
            {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
              <div className="px-4 pt-4">
                <UserSearch
                  currentUserId={userId}
                  selectedUsers={groupUsers!}
                  onUserAdd={(user) => handleAddMember(user.id)}
                />
              </div>
            )}
            {/* All roles */}
            <ScrollArea className="w-full h-[80vh] pr-2 mt-2">
              <ul className="w-full space-y-2">
                {sortedMembers &&
                  sortedMembers.map((user: User & { role: Role }) => (
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
                            src={user.avatar + "?h=128"}
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
