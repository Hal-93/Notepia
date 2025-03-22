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
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { getPushEndpoint, handleSubscribe } from "~/utils/pushNotification";
import { Form } from "@remix-run/react";

export default function ActionBar({
  username,
  initialAvatarUrl,
  uuid,
  publicKey,
}: {
  username: string;
  initialAvatarUrl: string | null;
  uuid: string;
  publicKey: string;
}) {
  const [isClient, setIsClient] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isProfileChange, setIsProfileChange] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      const res = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        refreshImage();
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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
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
              {isProfileChange || isSetting ? (
                <Button
                  onClick={() => {
                    setIsProfileChange(false);
                    setIsSetting(false);
                  }}
                  className="p-5"
                  style={{
                    backgroundColor: "black",
                    width: "5rem",
                    height: "2rem",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{ height: "3rem" }}
                  />
                </Button>
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

          {isSetting ? (
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
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                )}
                {previewUrl ? (
                  <button
                    onClick={handleButtonClick}
                    className="p-0 border-0 bg-transparent"
                    style={{ display: "inline-flex" }}
                  >
                    <img
                      src={previewUrl}
                      alt={username}
                      className="rounded-full cursor-pointer"
                      style={{ height: "7rem", width: "7rem" }}
                    />
                  </button>
                ) : avatarUrl ? (
                  <button
                    onClick={handleButtonClick}
                    className="p-0 border-0 bg-transparent"
                    style={{ display: "inline-flex" }}
                  >
                    <img
                      src={avatarUrl}
                      alt={username}
                      className="rounded-full cursor-pointer"
                      style={{ height: "7rem", width: "7rem" }}
                    />
                  </button>
                ) : (
                  <Avatar size="7rem" name={uuid} variant="beam" />
                )}

                {isProfileChange ? (
                  <FontAwesomeIcon
                    icon={faPen}
                    className="absolute top-0 right-0 bg-white p-1 rounded-full shadow  -translate-x-2/3 translate-y-2/3"
                  />
                ) : null}
              </div>
              <div className="text-white " style={{ fontSize: "2rem" }}>
                {username}
              </div>
              <div className="text-white p-2">@{uuid}</div>
              {isProfileChange ? (
                <div
                  className="w-full "
                  style={{
                    alignItems: "center",
                    display: "flex",
                    flexFlow: "column",
                  }}
                >
                  <div className="p-0 ali" style={{ width: "90%" }}>
                    <Label htmlFor="email" className="text-white">
                      ユーザー名
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="username"
                      autoComplete="username"
                      required
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      //ref={emailRef}
                      className="w-full text-white"
                      //aria-invalid={actionData?.errors?.email ? true : undefined}
                      aria-describedby="username-error"
                    />
                    {/*actionData?.errors?.email && (
                <p className="text-red-600 text-sm" id="email-error">
                  {actionData.errors.email}
                </p>
              )*/}
                  </div>
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
                    className="p-5 bg-white text-black"
                    style={{ width: "90%" }}
                  >
                    プロフィールを編集
                  </Button>
                  <Form
                    method="post"
                    action="/logout"
                    className="w-full pt-5 flex justify-center"
                  >
                    <Button
                      type="submit"
                      className="p-5 bg-red-500 text-white"
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
