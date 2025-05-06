import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faGear,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "boring-avatars";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from "../ui/dialog";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { getPushEndpoint, handleSubscribe } from "~/utils/pushNotification";
import { Form } from "@remix-run/react";
import { Label } from "../ui/label";
import Setting from "./Setting"
import ProfileSection from "./ProfileSection";
import FriendSection from "./FriendSection";

export default function ActionBar({
  username,
  initialAvatarUrl,
  uuid,
  publicKey,
  userId,
}: {
  username: string;
  initialAvatarUrl: string | null;
  uuid: string;
  publicKey: string;
  userId: string;
}) {
  useEffect(() => {
    getUsers();
  }, []);
  async function getUsers() {
    const response = await fetch("/api/friend", {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error("Failed to check subscription status");
    }
    const data = await response.json();
    const usersArray = data.users.map((user) => ({
      username: user.username,
      uuid: user.uuid,
      avatar: user.avatar,
    }));
    const requests = data.requests;
    setFriendRequests(requests);
    setFollowingUsers(usersArray);
  }
  async function handleGetUser(toUUID: string) {
    const formData = new FormData();
    formData.append("toUUID", toUUID!);
    formData.append("fromId", userId);

    const response = await fetch("/api/friend", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to check subscription status");
    }
    setFollowingUser(null);
    const data = await response.json();
    if (data.status !== "notfound") setFollowingUser(data);
  }

  async function handleFriend(toUUID: string) {
    const formData = new FormData();
    formData.append("toUUID", toUUID);
    formData.append("_action", "submitFriend");
    formData.append("fromId", userId);

    const response = await fetch("/api/friend", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to send friend request");
    }

    const data = await response.json();
    if (data.status == "ACCEPTED") {
      const newUsers = [data, ...(follwingUsers || [])];
      setFollowingUsers(newUsers); // 状態を更新
    }
    setFollowingUser(null);
  }

  async function handleAccept(fromId: string) {
    const formData = new FormData();
    formData.append("toUUID", uuid);
    formData.append("_action", "acceptFriend");
    formData.append("fromId", fromId);

    const response = await fetch("/api/friend", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to send friend request");
    }

    const data = await response.json();
    
    if (data.status == "ACCEPTED") {
      await getUsers()
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== data.id)
      );
    }
  }

  async function handleReject(fromId: string) {
    const formData = new FormData();
    formData.append("toUUID", uuid);
    formData.append("_action", "rejectFriend");
    formData.append("fromId", fromId);

    const response = await fetch("/api/friend", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to send friend request");
    }

    const data = await response.json();
    if (data.status === "REJECTED") {
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== data.id)
      );
    }
  }

  const [isFriend, setIsFriend] = useState(false);
  const [toId, setToId] = useState("");
  const [follwingUser, setFollowingUser] = useState<{
    username: string;
    uuid: string;
    avatar: string;
  } | null>(null);
  const [follwingUsers, setFollowingUsers] = useState<
    { username: string; uuid: string; avatar: string; status: string }[]
  >([]);
  const [friendRequests, setFriendRequests] = useState<
    {
      id: string;
      fromId: string;
      toId: string;
      status: string;
      createdAt: Date;
    }[]
  >([]);

  const [isClient, setIsClient] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isProfileChange, setIsProfileChange] = useState(false);
  const [isSetting, setIsSetting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [uname, setUname] = useState(username);
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [barPosition, setBarPosition] = useState<"left" | "right" | "bottom">(
    "bottom"
  );
  const [barColor, setBarColor] = useState<string>("#4F46E5");
  // Track when initial settings load completes
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load saved user settings on mount
  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/user-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.bar) setBarPosition(data.bar);
        if (data.theme) setBarColor(data.theme);
        setSettingsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Persist user settings when changed
  useEffect(() => {
    if (!settingsLoaded) return;
    async function saveSettings() {
      await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bar: barPosition, theme: barColor }),
      });
      // Notify Bar component to update immediately
      window.dispatchEvent(
        new CustomEvent("user-settings-updated", {
          detail: { bar: barPosition, theme: barColor },
        })
      );
    }
    saveSettings();
  }, [barPosition, barColor, settingsLoaded]);

  async function checkSubscription() {
    const endpoint = await getPushEndpoint();
    const formData = new FormData();
    formData.append("endpoint", endpoint!);

    const response = await fetch("/api/checksubscription", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to check subscription status");
    }

    if (!("Notification" in window)) {
      console.error("This browser does not support notifications.");
      return "unsupported";
    }

    const permission = Notification.permission;
    if (permission === "granted") {
      const data = await response.json();
      setIsSubscribed(data.isSubscribed);
    } else {
      setIsSubscribed(false);
    }
  }

  useEffect(() => {
    checkSubscription();
  }, []);

  const toggleSubscription = async () => {
    await setIsSubscribed((x) => !x);
    await handleSubscribe(publicKey);
    await checkSubscription();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewUrl(reader.result as string); // プレビューを設定
      };

      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    const formData = new FormData();
    if (selectedFile) {
      const maxSizeInBytes = 12 * 1024 * 1024; // 12MB
      if (selectedFile.size > maxSizeInBytes) {
        alert("ファイルサイズは12MB以下にしてください。");
        return;
      }

      formData.append("file", selectedFile);
      formData.append("uuid", uuid);
    }
    formData.append("username", uname);

    try {
      const res = await fetch("api/profile", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedAvatar) {
          refreshImage();
        }
        setIsProfileChange(false);
        alert("保存しました。");
        setSelectedFile(null);
      } else {
        alert("保存に失敗しました。");
      }
    } catch (error) {
      alert("エラーが発生しました: " + error);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshImage = () => {
    setAvatarUrl(`/user/${uuid}/avatar?t=${new Date().getTime()}`);
  };

  if (!isClient) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("コピーに失敗しました:", err);
    }
  };

  return (
    <>
      <div className="fixed top-4 right-5 z-50">
        <button onClick={() => setOpen(true)}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="rounded-full w-12 h-12 object-cover"
            />
          ) : (
            <Avatar size="3rem" name={uuid} variant="beam" />
          )}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
        style={{ zIndex: 99999 }}>
          <div
            ref={modalRef}
            className="relative w-full max-w-md h-[40rem] bg-black rounded-lg shadow-lg p-6 text-white flex flex-col"
          >
            {isProfileChange || isFriend || isSetting ? (
              <button
                onClick={() => {
                  setIsProfileChange(false);
                  setIsFriend(false);
                  setIsSetting(false);
                }}
                className="absolute top-4 left-4 text-white hover:text-red-400"
                aria-label="戻る"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-3xl" />
              </button>
            ) : (
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 left-4 text-white text-5xl hover:text-red-400"
                aria-label="閉じる"
              >
                &times;
              </button>
            )}

            <div className="flex flex-col justify-between h-full pt-10">
              <div className="overflow-y-auto pb-4">
                {isFriend ? (
                  <FriendSection
                    toId={toId}
                    follwingUser={follwingUser}
                    friendRequests={friendRequests}
                    follwingUsers={follwingUsers}
                    setToId={setToId}
                    handleFriend={handleFriend}
                    handleGetUser={handleGetUser}
                    handleAccept={handleAccept}
                    handleReject={handleReject}
                  />
                ) : isSetting ? (
                  <Setting
                    isSubscribed={isSubscribed}
                    toggleSubscription={toggleSubscription}
                    barPosition={barPosition}
                    setBarPosition={setBarPosition}
                    barColor={barColor}
                    setBarColor={setBarColor}
                  />
                ) : (
                  <ProfileSection
                    uuid={uuid}
                    username={username}
                    avatarUrl={avatarUrl}
                    previewUrl={previewUrl}
                    uname={uname}
                    isProfileChange={isProfileChange}
                    copied={copied}
                    fileInputRef={fileInputRef}
                    setUname={setUname}
                    handleFileChange={handleFileChange}
                    handleCopy={handleCopy}
                    handleUpload={handleUpload}
                    setIsProfileChange={setIsProfileChange}
                  />
                )}
              </div>

              {!isProfileChange && !isFriend && !isSetting && (
                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full bg-white text-black hover:bg-gray-400"
                    onClick={() => setIsProfileChange(true)}
                  >
                    プロフィールを編集
                  </Button>
                  <Button
                    className="w-full bg-indigo-500 hover:bg-indigo-700 text-black"
                    onClick={() => setIsFriend(true)}
                  >
                    フレンド
                  </Button>
                  <Button
                    className="w-full bg-indigo-500 hover:bg-indigo-700 text-black"
                    onClick={() => setIsSetting(true)}
                  >
                    設定
                  </Button>
                  <Form method="post" action="/logout" className="w-full">
                    <Button
                      type="submit"
                      className="w-full bg-red-500 hover:bg-red-700 text-white"
                    >
                      ログアウト
                    </Button>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
