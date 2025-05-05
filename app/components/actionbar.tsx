import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faGear,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import Avatar from "boring-avatars";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { getPushEndpoint, handleSubscribe } from "~/utils/pushNotification";
import { Form } from "@remix-run/react";
import { Label } from "./ui/label";

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
    <div className="fixed top-4 right-5 z-10">
      <Drawer>
        <DrawerTitle></DrawerTitle>
        <DrawerDescription></DrawerDescription>
        <DrawerTrigger>
          {avatarUrl ? (
            <img
              src={`${avatarUrl}`}
              alt={username}
              className="rounded-full w-12 h-12"
            />
          ) : (
            <Avatar size={"3rem"} name={uuid} variant="beam" />
          )}
        </DrawerTrigger>
        <DrawerContent
          className="h-full lg:w-1/2 w-full mx-auto"
          style={{
            alignItems: "center",
            display: "flex",
            flexFlow: "column",
            backgroundColor: "black",
          }}
        >
          <DrawerHeader className="w-full flex justify-between items-center">
            <div>
              {isProfileChange || isSetting || isFriend ? (
                <button
                  style={{
                    width: "5rem",
                    height: "3rem",
                  }}
                >
                  <FontAwesomeIcon
                    onClick={() => {
                      setIsProfileChange(false);
                      setIsSetting(false);
                      setIsFriend(false);
                    }}
                    icon={faChevronLeft}
                    style={{ height: "2rem", width: "5rem", color: "white" }}
                  />
                </button>
              ) : (
                <DrawerClose
                  style={{
                    width: "5rem",
                    height: "3rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{ height: "2rem", color: "white" }}
                  />
                </DrawerClose>
              )}
            </div>

            {isProfileChange || isSetting || isFriend ? (
              <div className="p-5"></div>
            ) : (
              <div>
                <Button
                  className="p-5"
                  style={{ backgroundColor: "black" }}
                  onClick={() => {
                    setIsSetting(true);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faGear}
                    style={{ height: "2rem", width: "2rem" }}
                  />
                </Button>
              </div>
            )}
          </DrawerHeader>
          {isFriend ? (
            <div className="min-h-screen w-full flex justify-center  bg-black">
              <div className="w-full p-6 rounded-lg shadow-lg text-white">
                <h2 className="text-2xl text-center mb-4">フレンド追加</h2>

                <Label htmlFor="username" className="text-white text-lg">
                  ユーザーID
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full text-white h-14 bg-gray-800 p-2 text-xl rounded-md"
                />

                {follwingUser && (
                  <div className="p-2 mt-3 text-white flex border rounded-md items-center">
                    {follwingUser.avatar ? (
                      <img
                        src={follwingUser.avatar}
                        alt={follwingUser.username}
                        className="rounded-full h-16 w-16"
                      />
                    ) : (
                      <Avatar
                        size="4rem"
                        name={follwingUser.uuid}
                        variant="beam"
                      />
                    )}
                    <div className="ml-4 text-xl">{follwingUser.username}</div>
                    <Button
                      onClick={() => handleFriend(follwingUser.uuid)}
                      className="ml-auto p-2 bg-indigo-500 text-white rounded-md"
                    >
                      フレンド申請
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => handleGetUser(toId)}
                  className="w-full mt-4 p-3 bg-indigo-500 text-white rounded-md text-lg"
                >
                  検索
                </Button>

                <div className="overflow-y-auto max-h-96">
                  {friendRequests?.length ? (
                    <>
                      <h3 className="text-2xl text-center mt-6">
                        フレンドリクエスト
                      </h3>
                      {friendRequests.map((user) => (
                        <div
                          key={user.uuid}
                          className="p-3 mt-3 flex items-center justify-between border rounded-md bg-gray-800"
                        >
                          <div className="flex items-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.username}
                                className="rounded-full h-12 w-12"
                              />
                            ) : (
                              <Avatar
                                size="3rem"
                                name={user.uuid}
                                variant="beam"
                              />
                            )}
                            <div className="ml-4">
                              <div className="text-xl">{user.username}</div>
                              <div className="text-gray-500 text-sm">
                                @{user.uuid}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAccept(user.fromId)}
                            className="ml-auto p-2 bg-green-600 text-white rounded-md"
                          >
                            承認
                          </Button>
                          <Button
                            onClick={() => handleReject(user.fromId)}
                            className="ml-2 p-2 bg-red-500 text-white rounded-md"
                          >
                            拒否
                          </Button>
                        </div>
                      ))}
                    </>
                  ) : null}
                </div>

                <h3 className="text-2xl text-center mt-6">フレンド一覧</h3>
                <div className="overflow-y-auto max-h-96">
                  {follwingUsers?.length ? (
                    follwingUsers.map((user) => (
                      <div
                        key={user.uuid}
                        className="p-3 mt-3 flex items-center justify-between border rounded-md bg-gray-800"
                      >
                        <div className="flex items-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="rounded-full h-12 w-12"
                            />
                          ) : (
                            <Avatar
                              size="3rem"
                              name={user.uuid}
                              variant="beam"
                            />
                          )}
                          <div className="ml-4">
                            <div className="text-xl">{user.username}</div>
                            <div className="text-gray-500 text-sm">
                              @{user.uuid}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center mt-3">
                      フレンドがまだいません。
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : isSetting ? (
            <div className="flex">
              <div className="p-4 flex flex-col">
                {/* 通知設定 */}
                <div className="flex items-center p-4">
                  <div className="flex-1">
                    <div className="text-white text-2xl">プッシュ通知</div>
                    <div className="text-gray-500">
                      プッシュ通知の有無を切り替え
                    </div>
                  </div>
                  <Switch
                    checked={isSubscribed}
                    onClick={toggleSubscription}
                    className="relative inline-flex items-center h-10 w-16 bg-gray-200 rounded-full p-1"
                  />
                </div>

                {/* Bar表示位置設定 */}
                <div className="flex items-center p-4">
                  <div className="flex-1">
                    <div className="text-white text-2xl">バー表示位置</div>
                    <div className="text-gray-500">アクションバーの位置</div>
                  </div>
                  <select
                    value={barPosition}
                    onChange={(e) => setBarPosition(e.target.value as any)}
                    className="bg-gray-800 text-white p-2 rounded"
                  >
                    <option value="bottom">下</option>
                    <option value="left">左</option>
                    <option value="right">右</option>
                  </select>
                </div>

                {/* Barボタンカラー設定 */}
                <div className="flex items-center p-4">
                  <div className="flex-1">
                    <div className="text-white text-2xl">テーマカラー</div>
                    <div className="text-gray-500">テーマ色を選択</div>
                  </div>
                  <input
                    type="color"
                    value={barColor}
                    onChange={(e) => setBarColor(e.target.value)}
                    className="w-12 h-8 p-0 border-0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 relative inline-block">
                {isProfileChange && (
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    ref={fileInputRef}
                    className="opacity-0 absolute w-0 h-0"
                    onChange={handleFileChange}
                  />
                )}

                {previewUrl ? (
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <img
                      src={previewUrl}
                      alt={username}
                      className="rounded-full"
                      style={{ height: "7rem", width: "7rem" }}
                    />
                  </label>
                ) : avatarUrl ? (
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="rounded-full"
                      style={{ height: "7rem", width: "7rem" }}
                    />
                  </label>
                ) : (
                  <label htmlFor="fileInput" className="cursor-pointer">
                    <Avatar size="7rem" name={uuid} variant="beam" />
                  </label>
                )}

                {isProfileChange ? (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute top-0 right-0 bg-white p-1 rounded-full shadow  -translate-x-2/3 translate-y-2/3"
                  />
                ) : null}
              </div>

              {isProfileChange ? (
                <div className="flex flex-col">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={uname}
                    onChange={(e) => setUname(e.target.value)} // 状態更新のためのハンドラー
                    style={{ width: "90%" }}
                    className="text-white bg-gray-800 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="text-white text-2xl">{uname}</div>
              )}

              <div>
                <button className="text-white p-2 rounded" onClick={handleCopy}>
                  @{uuid}
                </button>
                {copied && (
                  <span className="ml-2 text-green-400">コピーしました！</span>
                )}
              </div>
              <br />
              {isProfileChange ? (
                <div
                  className="w-full "
                  style={{
                    alignItems: "center",
                    display: "flex",
                    flexFlow: "column",
                  }}
                >
                  <Button
                    onClick={() => {
                      setIsProfileChange(true);
                      handleUpload();
                    }}
                    className="p-5 mt-5 text-black bg-indigo-500"
                    style={{ width: "90%" }}
                  >
                    保存
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setIsProfileChange(true);
                    }}
                    className="p-5 bg-white hover:bg-gray-400 text-black"
                    style={{ width: "90%" }}
                  >
                    プロフィールを編集
                  </Button>
                  <Button
                    onClick={() => {
                      setIsFriend(true);
                    }}
                    className="p-5 mt-5 bg-indigo-500 hover:bg-indigo-700 text-black"
                    style={{ width: "90%" }}
                  >
                    フレンド
                  </Button>
                  <Form
                    method="post"
                    action="/logout"
                    className="w-full pt-5 flex justify-center"
                  >
                    <Button
                      type="submit"
                      className="p-5 bg-red-500 hover:bg-red-700 text-white"
                      style={{ width: "90%" }}
                    >
                      ログアウト
                    </Button>
                  </Form>
                </>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
