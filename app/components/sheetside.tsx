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

export function SheetSide() {
  const navigate = useNavigate();
  const location = useLocation();

  const changeGroup = (groupId: string | null) => {
    console.log("call")
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
          <div className="flex items-center mt-3 p-4 border-2">
            <SheetClose asChild>
              <Button type="submit" onClick={() => changeGroup(null)}>
                マイマップ
              </Button>
            </SheetClose>
          </div>
          <SheetFooter></SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
