import { useEffect, useState } from "react";
import { Form } from "@remix-run/react";
import Avatar from "boring-avatars";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function ActionBar({
  username,
  avatorUrl,
  uuid,
}: {
  username: string;
  avatorUrl: string | null;
  uuid: string;
}) {
  const [isClient, setIsClient] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="fixed top-4 right-5">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div>
            {isOpen ? (
              <Button
                variant="ghost"
                className="rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition"
                style={{ height: "4rem", width: "4rem" }}
              >
                ✖
              </Button>
            ) : avatorUrl ? (
              <img src={avatorUrl} alt={username} />
            ) : (
              <Avatar size={"4rem"} name={uuid} variant="beam" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-60 h-auto p-4"
          style={{ alignItems: "center", display: "flex", flexFlow: "column" }}
        >
          <div className="p-1">
            {avatorUrl ? (
              <img src={avatorUrl} alt={username} />
            ) : (
              <Avatar size={"5rem"} name={uuid} variant="beam" />
            )}
          </div>
          <div>アイコンを変更する</div>
          <Form action="/logout" method="post">
            <Button>ログアウト</Button>
          </Form>
        </PopoverContent>
      </Popover>
    </div>
  );
}
