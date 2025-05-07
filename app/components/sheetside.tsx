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
            <Button className="rounded-xl w-12 h-12 flex items-center justify-center shadow-md">
              <FontAwesomeIcon icon={faBars}></FontAwesomeIcon>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle className="text-4xl">マップ</SheetTitle>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto overflow-x-clip">
              <SheetClose asChild>
                <div className="flex">
                  <Button
                    className="flex items-center justify-start mt-3 p-4 rounded-xl hover:bg-gray-800 w-full min-h-20"
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
                </div>
              </SheetClose>

              {groups &&
                groups.map((group) => (
                  <SheetClose asChild key={group.id}>
                    <div className="flex">
                      <Button
                        className="flex items-center justify-start mt-3 p-4 rounded-xl hover:bg-gray-800 w-11/12 min-h-20"
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
                        {group.name}
                      </Button>
                      <div className="flex flex-col w-1/12 mt-3 me-1">
                        <Button
                          className="w-1/12 hover:bg-gray-800"
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
                            className="text-white w-1/12 hover:bg-gray-800"
                            onClick={() =>
                              handleOpenEditModal(group.id, group.name)
                            }
                          >
                            <FontAwesomeIcon icon={faGear} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </SheetClose>
                ))}
            </div>

            <SheetFooter className="mt-auto">
              <SheetClose asChild>
                <Button
                  className="w-full hover:bg-gray-800"
                  onClick={handleOpenModal}
                >
                  +グループを作成
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {showModal && (
        <GroupCreateModal
          currentUserId={userId}
          onClose={handleCloseModal}
          changeGroup={changeGroup}
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
