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
    const response = await fetch("/api/follow", {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error("Failed to check subscription status");
    }
    const data = await response.json();
    const usersArray = data.users.map((user) => ({
      username: user.username,
      uuid: user.fId,
      avatar: user.avatar,
    }));
    setFollowingUsers(usersArray);
  }
  async function handleGetUser(fId: string) {
    const formData = new FormData();
    formData.append("followingId", fId!);
    formData.append("userId", userId);

    const response = await fetch("/api/follow", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Failed to check subscription status");
    }
    const data = await response.json();
    if (data.status !== "notfound") setFollowingUser(data);
  }

  async function handleFollw(uuid: string) {
    const formData = new FormData();
    formData.append("followingId", uuid!);
    formData.append("submitFollow", "true");
    formData.append("userId", userId);

    const response = await fetch("/api/follow", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to send friend request");
    }

    const data = await response.json();
    const newUsers = [data, ...(follwingUsers || [])];
    setFollowingUsers(newUsers); // 状態を更新
    setFollowingUser(null);

    console.log("Updated following users:", newUsers);
  }
  const [isFollow, setIsFollow] = useState(false);
  const [fId, setFId] = useState("");
  const [follwingUser, setFollowingUser] = useState<{
    username: string;
    uuid: string;
    avatar: string;
  } | null>(null);
  const [follwingUsers, setFollowingUsers] = useState<
    { username: string; uuid: string; avatar: string; status: string }[]
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
        <DrawerTrigger asChild>
          {avatarUrl ? (
            <img
              src={`${avatarUrl}`}
              alt={username}
              className="rounded-full"
              style={{ height: "4rem", width: "4rem" }}
            />
          ) : (
            <Avatar size={"4rem"} name={uuid} variant="beam" />
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
              {isProfileChange || isSetting || isFollow ? (
                <FontAwesomeIcon
                  onClick={() => {
                    setIsProfileChange(false);
                    setIsSetting(false);
                    setIsFollow(false);
                  }}
                  icon={faChevronLeft}
                  style={{ height: "3rem", width: "5rem", color: "white" }}
                />
              ) : (
                <DrawerClose
                  style={{
                    width: "5rem",
                    height: "3rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{ height: "3rem", color: "white" }}
                  />
                </DrawerClose>
              )}
            </div>

            {isProfileChange || isSetting ? (
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
          {isFollow ? (
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
                  value={fId}
                  onChange={(e) => setFId(e.target.value)}
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
                      onClick={() => handleFollw(uuid)}
                      className="ml-auto p-2 bg-indigo-500 text-white rounded-md"
                    >
                      フレンド申請
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => handleGetUser(uuid)}
                  className="w-full mt-4 p-3 bg-indigo-500 text-white rounded-md text-lg"
                >
                  検索
                </Button>

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
                        <Button
                          onClick={() => handleFollw(user.uuid)}
                          className="bg-indigo-500 text-white p-2 rounded-md"
                        >
                          フレンド申請
                        </Button>
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
                <div className="text-white" style={{ fontSize: "2rem" }}>
                  通知
                </div>
                <div className="text-gray-500" style={{ fontSize: "1rem" }}>
                  通知の有無を切り替えられます。
                </div>
              </div>
              <div className="p-7">
                <Switch
                  checked={isSubscribed}
                  onClick={toggleSubscription}
                  className="relative inline-flex items-center h-10 w-16 bg-gray-200 rounded-full p-1"
                ></Switch>
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
              <p className="text-white">フォロワー0 フォロー0</p>
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
                    className="p-5 mt-5 bg-white text-black bg-indigo-500"
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
                      setIsFollow(true);
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
