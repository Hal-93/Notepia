import { useEffect, useRef, useState } from "react";
import { Form } from "@remix-run/react";
import Avatar from "boring-avatars";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function ActionBar({
  username,
  initialAvatorUrl,
  uuid,
}: {
  username: string;
  initialAvatorUrl: string | null;
  uuid: string;
}) {
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [avatorUrl, setAvatorUrl] = useState(initialAvatorUrl);
  const [isAvatorChange, setIsAvatorChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const refreshImage = () => {
    setAvatorUrl(`user/${uuid}/avator?t=${new Date().getTime()}`);
  };

  if (!isClient) return null;

  const toggleAvatorChange = () => {
    setIsAvatorChange((x) => !x);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uuid", uuid);
      const res = await fetch(window.location.pathname, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        refreshImage();
        setIsAvatorChange(false);
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
                onClick={() => setIsAvatorChange(false)}
              >
                ✖
              </Button>
            ) : avatorUrl ? (
              <img
                src={`${avatorUrl}`}
                alt={username}
                className="rounded-full"
              />
            ) : (
              <Avatar size={"4rem"} name={uuid} variant="beam" />
            )}
          </div>
        </PopoverTrigger>
        {isAvatorChange ? (
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
              {avatorUrl ? (
                <img src={avatorUrl} alt={username} className="rounded-full" />
              ) : (
                <Avatar size={"5rem"} name={uuid} variant="beam" />
              )}
            </div>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  toggleAvatorChange();
                }
              }}
              className="p-1"
              onClick={toggleAvatorChange}
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
