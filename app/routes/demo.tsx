import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ActionBar from "~/components/userpanel/actionbar";
import DemoCreateModal from "~/components/memo/democreate";
import { MapBoxSearch } from "~/components/searchbar";
import Bar from "~/components/memo/bar";
import Compass from "~/components/compass";
import { Button } from "~/components/ui/button";
import type { Memo } from "@prisma/client";
import type { User } from "@prisma/client";
import UserSearch from "~/components/usersearch";
import Avatar from "boring-avatars";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import MemoList from "~/components/memo/memolist";
import DemoDetailModal from "~/components/memo/demodetail";
import TutorialLauncher from "~/components/memo/tutorial-launcher";

type Role = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

const dummyGroupUsers: (User & { role: Role })[] = [
  {
    id: "1",
    name: "山田太郎",
    uuid: "taro",
    avatar: null,
    role: "OWNER",
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "taro@example.com",
    theme: "light",
    bar: "",
  },
  {
    id: "2",
    name: "鈴木花子",
    uuid: "hanako",
    avatar: null,
    role: "ADMIN",
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "hanako@example.com",
    theme: "light",
    bar: "",
  },
  {
    id: "3",
    name: "佐藤次郎",
    uuid: "jiro",
    avatar: null,
    role: "EDITOR",
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "jiro@example.com",
    theme: "light",
    bar: "",
  },
  {
    id: "4",
    name: "田中美沙",
    uuid: "misa",
    avatar: null,
    role: "VIEWER",
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "misa@example.com",
    theme: "light",
    bar: "",
  },
  {
    id: "5",
    name: "Demo",
    uuid: "demo",
    avatar: null,
    role: "EDITOR",
    createdAt: new Date(),
    updatedAt: new Date(),
    email: "demo@example.com",
    theme: "light",
    bar: "",
  },
];

export const loader: LoaderFunction = () => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) throw new Response("MAPBOX_TOKEN 未設定", { status: 500 });
  return json({ mapboxToken: token });
};

export default function DemoMapPage() {
  const { mapboxToken } = useLoaderData<{ mapboxToken: string }>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newMemoPos, setNewMemoPos] = useState<{ lat: number; lng: number } | null>(null);
  const [currentUserRole] = useState<Role>("EDITOR");
  const [showGroupDetail, setShowGroupDetail] = useState(false);

  // Sort members by role for display
  const roleOrder: Record<Role, number> = {
    OWNER: 0,
    ADMIN: 1,
    EDITOR: 2,
    VIEWER: 3,
  };
  const sortedMembers = [...dummyGroupUsers].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role]
  );

useEffect(() => {
  let isMounted = true;

  const defaultMemos: Memo[] = [
    {
      id: "1746680490853",
      title: "買い物",
      place: "東京駅",
      content: "これはダミーメモです",
      color: "#ffe8cc",
      completed: false,
      latitude: 35.681260554815026,
      longitude: 139.76667028279445,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: "demo",
      groupId: "demo",
    },
  ];
  // Load any existing memos
  let storedMemos: Memo[] = [];
  try {
    const raw = localStorage.getItem("demo-memos");
    storedMemos = raw ? JSON.parse(raw) : [];
  } catch {
    storedMemos = [];
  }
  // Ensure default memo always present
  const hasDefault = storedMemos.some(m => m.id === defaultMemos[0].id);
  const combined = hasDefault ? storedMemos : [...defaultMemos, ...storedMemos];
  localStorage.setItem("demo-memos", JSON.stringify(combined));

  if (isMounted) { 
    setMemos(combined);
  }

  return () => {
    isMounted = false;
  };
}, []);
  useEffect(() => {
    localStorage.setItem("demo-memos", JSON.stringify(memos));
    setFilteredMemos(searchQuery ? memos.filter(m => m.title.includes(searchQuery)) : memos);
  }, [memos, searchQuery]);

  // init map
  useEffect(() => {
    if (mapRef.current) return;
    // Dynamic map style based on time of day
    const getMapStyle = () => {
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
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: getMapStyle(),
      center: [139.7, 35.6],
      zoom: 10,
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
    });
    map.on("dblclick", e => {
      setNewMemoPos({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });
    mapRef.current = map;
  }, [mapboxToken]);

  // render markers with group-style popups
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    // remove existing markers
    document.querySelectorAll(".memo-marker").forEach(el => el.remove());
    const markers: mapboxgl.Marker[] = [];

    memos.forEach(memo => {
      if (memo.latitude == null || memo.longitude == null) return;
      // marker element
      const el = document.createElement("div");
      el.className = "memo-marker";
      el.style.width = "20px";
      el.style.height = "20px";
      const bgColor = memo.completed ? "#000000" : memo.color || "#ffffff";
      el.style.backgroundColor = bgColor;
      el.style.borderRadius = "50%";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 5px rgba(0,0,0,0.5)";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([memo.longitude, memo.latitude])
        .addTo(map);

      // click to open detail
      el.addEventListener("click", e => {
        e.stopPropagation();
        setSelectedMemo(memo);
        setShowDetail(true);
      });

      // only show popups for incomplete memos
      if (!memo.completed) {
        const popupContent = document.createElement("div");
        popupContent.style.backgroundColor = bgColor;
        popupContent.style.padding = "8px";
        popupContent.style.cursor = "pointer";
        popupContent.innerHTML = `<b>${memo.title}</b>`;
        popupContent.addEventListener("click", e => {
          e.stopPropagation();
          setSelectedMemo(memo);
          setShowDetail(true);
        });

        const popupClass = `popup-color-${bgColor.replace("#","")}`;
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

      markers.push(marker);
    });

    // toggle popups on zoom
    const handleZoomEnd = () => {
      markers.forEach(m => {
        const p = m.getPopup();
        if (!p) return;
        if (map.getZoom() >= 10) {
          p.addTo(map);
        } else {
          p.remove();
        }
      });
    };
    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("zoomend", handleZoomEnd);
      markers.forEach(m => { m.getPopup()?.remove(); m.remove(); });
    };
  }, [memos]);

  const handleSearchMemo = () => setIsDrawerOpen(true);
  const handleGroupDetail = () => setShowGroupDetail(true);
  const jumpToMemo = (memo: Memo) => {
    mapRef.current?.flyTo({ center: [memo.longitude!, memo.latitude!], zoom: 16 });
    setIsDrawerOpen(false);
  };
  const handleAddMemo = (memoData: any) => {
    setMemos([...memos, memoData]);
    setNewMemoPos(null);
  };

  return (
    <>

    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>


      {/* search bar */}
        <div className="fixed flex-nowrap flex items-center z-20 w-full md:ml-[-64px]">
          <MapBoxSearch
            api={mapboxToken}
            onSelect={p =>
              jumpToMemo({
                id: Date.now().toString(),
                createdAt: new Date(),
                updatedAt: new Date(),
                title: p.place_name,
                color: "#ffffff",
                content: "",
                completed: false,
                place: null,
                latitude: p.center[1],
                longitude: p.center[0],
                createdById: "demo",
                groupId: null,
              })
            }
          />
          <h2
              className={`hidden md:flex ml-[76px] md:ml-[0px] mt-[16px] text-4xl h-[48px] items-center font-bold truncate max-w-[60vw] md:max-w-[50vw] ${
                (() => {
                  const hours = new Date().getHours();
                  return hours >= 20 || hours < 4 ? "text-white" : "text-black";
                })()
              }`}
            >
            Demo
          </h2> 
        </div> 

        <div className="fixed flex-nowrap flex items-center z-[5]">
            <h2
              className={`md:hidden ml-[16px] mt-[18px] text-4xl h-[48px] font-bold truncate max-w-[60vw] ${
                (() => {
                  const hours = new Date().getHours();
                  return hours >= 20 || hours < 4 ? "text-white" : "text-black";
                })()
              }`}
            >
            Demo
          </h2>
        </div>

        <div className="mx-[16px] items-center mt-[128px] md:ml-[16px]">
          <div className="md:hidden w-[calc(100%-32px)] fixed flex-1 bg-red-800 text-white py-2 px-4 rounded-md text-center md:text-left text-sm md:text-base z-[50]">
            デモ版ではNotepiaのごく一部の機能を試すことができます。全ての機能を使うには{" "}
            <Link to="/start">
              <Button className="bg-cyan-500 hover:bg-cyan-600">無料でアカウント作成</Button>
            </Link>
          </div>
        </div>

        {/* ActionBar: 常に右上 */}
        <div className="fixed top-4 right-4 z-30 w-12 h-12 items-center justify-center" style={{ pointerEvents: "auto" }}>
          <ActionBar
            mode="demo"
            username="Demo"
            uuid="demo"
            initialAvatarUrl={null}
            publicKey=""
            userId="demo"
          />
        </div>

        {/* 1150px以下で左寄せ */}
          <div className="hidden md:flex fixed z-20 top-4 right-0 mr-[80px] md-max:top-[72px] md-max:left-[16px] md-max:right-auto">
            <div className="max-h-[48px] bg-red-800 text-white py-2 px-4 rounded-md flex items-center text-sm md:text-base whitespace-nowrap">
              デモ版では一部機能のみ体験できます。全機能を使うには：
              <Link to="/start" className="ml-2">
                <Button className="bg-cyan-500 hover:bg-cyan-600">無料でアカウント作成</Button>
              </Link>
            </div>
          </div>


          {/* Compass */}
          <div className="xs:mt-[96px] mt-[76px] md:mt-[0px]">
          <Compass map={mapRef.current} />
          </div>
        <TutorialLauncher />

      </div>
      <div ref={mapContainerRef} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }} />

      <Bar handleGroupDetail={handleGroupDetail} handleSearchMemo={handleSearchMemo} handleGoToCurrentLocation={() => {}} userId="demo" groupeId="demo" groupeName="Demo" />
      {newMemoPos && (
        <DemoCreateModal
          lat={newMemoPos.lat}
          lng={newMemoPos.lng}
          mapboxToken={mapboxToken}
          onClose={() => setNewMemoPos(null)}
          onSubmit={handleAddMemo}
        />
      )}
      <Drawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        <DrawerContent className="mx-auto h-[70vh] bg-black text-white w-full max-w-[768px] z-[1100]"><DrawerHeader><DrawerTitle>メモを検索</DrawerTitle></DrawerHeader>
          <MemoList searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} filteredMemos={filteredMemos} jumpToMemo={jumpToMemo} actorRole="VIEWER" />
        </DrawerContent>
      </Drawer>
      {selectedMemo && showDetail && <DemoDetailModal memo={selectedMemo} onClose={() => setShowDetail(false)} actorRole={currentUserRole} currentUserId="demo" />}
      <Drawer open={showGroupDetail} onClose={() => setShowGroupDetail(false)}>
        <DrawerContent className="mx-auto h-[70vh] w-full max-w-[768px] bg-black text-white px-4 pb-4 z-[1100]">
          <DrawerHeader>
            <DrawerTitle>メンバーリスト</DrawerTitle>
          </DrawerHeader>
          {/* Owner/Admin */}
          {(currentUserRole === "OWNER" || currentUserRole === "ADMIN") && (
            <div className="px-4 pt-4">
              <UserSearch
                currentUserId="demo"
                selectedUsers={dummyGroupUsers}
                onUserAdd={() => {
                  alert("デモ版ではこの機能は使用できません");
                }}
              />
            </div>
          )}
          {/* All roles */}
          <ScrollArea className="w-full h-[80vh] pr-2 mt-2">
            <ul className="w-full space-y-2">
              {sortedMembers.map((user) => (
                <li key={user.id}>
                  <Button
                    onClick={() => {
                      alert("デモ版ではメンバーの詳細を表示できません");
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
                        <Avatar size={64} name={String(user.uuid)} variant="beam" />
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
    
    </>
  );
}
