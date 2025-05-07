import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "@remix-run/react";
import Avatar from "boring-avatars";

export function SheetSide({
  username,
  avatarUrl,
  uuid,
}: {
  username: string;
  avatarUrl: string | null;
  uuid: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const changeGroup = (groupId: string | null) => {
    const url = new URL(
      location.pathname + location.search,
      window.location.origin
    );
    if (groupId) {
      url.searchParams.set("group", groupId);
    } else {
      url.searchParams.delete("group");
    }
    navigate(url.pathname + url.search);
  };

  const imgUrl = avatarUrl
    ? (() => {
        if (typeof window !== "undefined") {
          const url = new URL(avatarUrl, window.location.origin);
          url.searchParams.set("h", "512");
          return url.toString();
        }
      })()
    : null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="rounded-xl w-12 h-12 flex items-center justify-center shadow-md">
            <FontAwesomeIcon icon={faBars}></FontAwesomeIcon>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle className="text-4xl">マップ</SheetTitle>
          </SheetHeader>
          <SheetClose asChild>
            <Button
              className="flex items-center justify-start mt-3 p-4 rounded-xl hover:bg-gray-800 w-full min-h-20 "
              type="submit"
              onClick={() => changeGroup(null)}
            >
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={username}
                  className="rounded-full w-12 h-12 object-cover"
                />
              ) : (
                <Avatar
                  size="3rem"
                  name={uuid}
                  variant="beam"
                  className="!w-12 !h-12"
                />
              )}
              マイマップ
            </Button>
          </SheetClose>
          <SheetFooter></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
