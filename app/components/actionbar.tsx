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
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

export default function ActionBar({
  username,
  initialAvatarUrl,
  uuid,
}: {
  username: string;
  initialAvatarUrl: string | null;
  uuid: string;
}) {
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isProfileChange, setIsProfileChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshImage = () => {
    setAvatarUrl(`user/${uuid}/avatar?t=${new Date().getTime()}`);
  };

  if (!isClient) return null;

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      const maxSizeInBytes = 12 * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        alert("ファイルサイズは12MB以下にしてください。");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("uuid", uuid);

      const res = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        refreshImage();
        setIsProfileChange(false);
      } else {
        alert("ファイルのアップロードに失敗しました。");
      }
    }
  };

  return (
    <div className="fixed top-4 right-5 z-10">
      <Drawer>
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
          className="h-full md:w-1/2 w-full mx-auto"
          style={{
            alignItems: "center",
            display: "flex",
            flexFlow: "column",
            backgroundColor: "black",
          }}
        >
          <DrawerHeader className="w-full flex justify-between items-center">
            <div>
              <DrawerClose
                style={{
                  width: "5rem",
                  height: "3rem",
                }}
              >
                <Button className="p-5" style={{ backgroundColor: "black" }}>
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    style={{ height: "3rem" }}
                  />
                </Button>
              </DrawerClose>
            </div>

            {isProfileChange ? <div></div> : (
              <div>
                <Button className="p-5" style={{ backgroundColor: "black" }}>
                  <FontAwesomeIcon
                    icon={faGear}
                    style={{ height: "3rem", width: "3rem" }}
                  />
                </Button>
              </div>
            )}
          </DrawerHeader>

          <div className="p-4 relative inline-block">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="rounded-full"
                style={{ height: "7rem", width: "7rem" }}
              />
            ) : (
              <Avatar size={"7rem"} name={uuid} variant="beam" />
            )}

            {isProfileChange ? (
              <FontAwesomeIcon
                icon={faPen}
                className="absolute top-0 right-0 bg-white p-1 rounded-full shadow  -translate-x-2/3 translate-y-2/3"
              />
            ) : null}
          </div>

          <div className="text-white p-2">@{uuid}</div>
          <Button
            onClick={() => {
              setIsProfileChange(true);
            }}
            className="p-5 bg-white text-black"
            style={{ width: "90%" }}
          >
            プロフィールを編集
          </Button>
        </DrawerContent>
        {/* {isAvatarChange ? (
          <PopoverContent
            side="top"
            sideOffset={-8}
            className="w-60 h-auto p-4"
            style={{
              alignItems: "center",
              display: "flex",
              flexFlow: "column",
            }}
          >
            <div className="p-2">
              <input
                type="file"
                id="fileInput"
                multiple
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <Button onClick={handleButtonClick}>画像をアップロード</Button>
            </div>
          </PopoverContent>
        ) : (
          <PopoverContent
            side="right"
            className="w-60 h-auto"
            style={{
              alignItems: "center",
              display: "flex",
              flexFlow: "column",
            }}
          >
            <div className="">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  className="rounded-full"
                  style={{ height: "5rem", width: "5rem" }}
                />
              ) : (
                <Avatar size={"5rem"} name={uuid} variant="beam" />
              )}
            </div>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleAvatarChange();
                }
              }}
              className="p-1"
              onClick={toggleAvatarChange}
            >
              アイコンを変更する
            </div>
            <Form action="/logout" method="post">
              <Button>ログアウト</Button>
            </Form>
          </PopoverContent> 
        )}*/}
      </Drawer>
    </div>
  );
}
