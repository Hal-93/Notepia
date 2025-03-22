import { useEffect, useRef, useState } from "react";
import { Form } from "@remix-run/react";
import Avatar from "boring-avatars";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
  const [isAvatarChange, setIsAvatarChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshImage = () => {
    setAvatarUrl(`user/${uuid}/avatar?t=${new Date().getTime()}`);
  };

  if (!isClient) return null;

  const toggleAvatarChange = () => {
    setIsAvatarChange((x) => !x);
  };

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
        setIsAvatarChange(false);
      } else {
        alert("ファイルのアップロードに失敗しました。");
      }
    }
  };

  return (
    <div className="fixed top-4 right-5 z-10">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div>
            {isOpen ? (
              <Button
                variant="ghost"
                className="rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition"
                style={{ height: "4rem", width: "4rem" }}
                onClick={() => setIsAvatarChange(false)}
              >
                ✖
              </Button>
            ) : avatarUrl ? (
              <img
                src={`${avatarUrl}`}
                alt={username}
                className="rounded-full"
              />
            ) : (
              <Avatar size={"4rem"} name={uuid} variant="beam" />
            )}
          </div>
        </PopoverTrigger>
        {isAvatarChange ? (
          <PopoverContent
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
            className="w-60 h-auto p-4"
            style={{
              alignItems: "center",
              display: "flex",
              flexFlow: "column",
            }}
          >
            <div className="">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} className="rounded-full" />
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
        )}
      </Popover>
    </div>
  );
}
