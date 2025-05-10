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
import {
  faBars,
  faGear,
  faRightFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useFetcher, useLocation, useNavigate } from "@remix-run/react";
import Avatar from "boring-avatars";
import { GroupWithMembershipsAndUsers } from "~/models/group.server";
import { useState } from "react";
import GroupCreateModal from "./group/create";
import GroupEditModal from "./group/edit";

export function SheetSide({
  username,
  avatarUrl,
  uuid,
  groups,
  userId,
}: {
  username: string;
  avatarUrl: string | null;
  uuid: string;
  groups: GroupWithMembershipsAndUsers[];
  userId: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleOpenEditModal = (groupId: string, groupName: string) => {
    setEditingGroup({ id: groupId, name: groupName });
  };
  const handleCloseEditModal = () => {
    setEditingGroup(null);
  };
  const fetcher = useFetcher();

  const handleLeaveGroup = (
    groupId: string,
    groupName: string,
    ownerId: string
  ) => {
    const message =
      ownerId === userId
        ? `【警告】あなたはグループ ${groupName} のオーナーです。\nあなたが脱退することでグループが削除されますが、このグループを本当に脱退しますか？`
        : `グループ ${groupName} から脱退しますか？`;
    if (confirm(message)) {
      fetcher.submit(
        { intent: "leaveGroup", groupId },
        { method: "post", action: "/api/group/leave" }
      );
      changeGroup(null);
    }
  };

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
    <>
      <div className="grid grid-cols-2 gap-2">
        <Sheet>
          <SheetTrigger asChild>
            {/* hamburgerMenu */}
            <Button className="bg-[#1F2937] fixed mt-[16px] ml-[16px] rounded-xl w-12 h-12 flex items-center justify-center" style={{ zIndex: 1000, pointerEvents: "auto" }}>
              <FontAwesomeIcon icon={faBars}></FontAwesomeIcon>
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle className="text-3xl text-[#777777] ml-[16px] mt-[18px] md:mt-[76px]">マップ</SheetTitle>
              <SheetClose asChild>
                <button
                  className="absolute top-[16px] md:top-[76px] right-[24px] md:right-[16px] text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Close"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xl" />
                </button>
              </SheetClose>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto overflow-x-clip flex flex-col">
              <SheetClose asChild>
                <div className="flex">
                  <Button
                    className="flex items-center justify-start rounded-xl mx-[16px] hover:bg-gray-800 w-full min-h-20"
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
                    {username}
                  </Button>
                </div>
              </SheetClose>

              <SheetTitle className="text-3xl text-[#777777] ml-[16px] mt-[8px] md:mt-[12px]">グループ</SheetTitle>
              {groups &&
                groups.map((group) => (
                  <SheetClose asChild key={group.id}>
                    <div className="flex">
                      <Button
                        className="flex items-center justify-start mt-3 p-4 rounded-xl mx-[16px] hover:bg-gray-800 w-full min-h-20"
                        type="submit"
                        onClick={() => changeGroup(group.id)}
                      >
                        {group.memberships.slice(0, 3).map((user, index) => (
                          <div
                            key={user.id}
                            className="flex w-12 h-12 overflow-hidden"
                            style={{
                              marginLeft: index === 0 ? 0 : "-40px",
                              zIndex: group.memberships.length - index,
                            }}
                          >
                            {user.user.avatar ? (
                              <img
                                src={`/user/${user.user.uuid}/avatar?h=96`}
                                alt={user.user.name}
                                className="object-cover w-full h-full rounded-full"
                              />
                            ) : (
                              <Avatar
                                name={user.user.uuid}
                                size={32}
                                variant="beam"
                                className="!w-12 !h-12"
                              />
                            )}
                          </div>
                        ))}
                        <div className="truncate max-w-[104px] sm:max-w-[150px] md:max-w-[200px]">
                            {group.name}
                        </div>
                        <div className="flex flex-col w-1/12 my-3 ml-auto">
                        <Button
                          className="w-1/12 hover:bg-gray-600"
                          variant="ghost"
                          onClick={() =>
                            handleLeaveGroup(
                              group.id,
                              group.name,
                              group.ownerId
                            )
                          }
                        >
                          <FontAwesomeIcon icon={faRightFromBracket} />
                        </Button>
                        {group.ownerId === userId && (
                          <Button
                            variant="ghost"
                            className="text-white w-1/12 hover:bg-gray-600"
                            onClick={() =>
                              handleOpenEditModal(group.id, group.name)
                            }
                          >
                            <FontAwesomeIcon icon={faGear} />
                          </Button>
                        )}
                      </div>
                      </Button>
                    </div>
                  </SheetClose>
                ))}
            <SheetClose asChild className="w-full">
                <Button
                  className="w-[calc(100%-32px)] hover:bg-gray-800 mb-[34px] mt-3 mx-[16px] rounded-xl"
                  onClick={handleOpenModal}
                >
                  +グループを作成
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {showModal && (
        <GroupCreateModal
          currentUserId={userId}
          onClose={handleCloseModal}
          changeGroup={changeGroup}
          directGroupCount={groups.length}
        />
      )}
      {editingGroup && (
        <GroupEditModal
          groupId={editingGroup.id}
          currentName={editingGroup.name}
          currentUserId={userId}
          onClose={handleCloseEditModal}
        />
      )}
    </>
  );
}
