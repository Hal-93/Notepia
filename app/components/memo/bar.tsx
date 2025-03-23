import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faLocationDot,
  faMagnifyingGlass,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
  Drawer,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from "../ui/drawer";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import Avatar from "boring-avatars";

interface BarProps {
  handleMakeFriend?: () => void;
  handleSearchMemo: () => void;
  handleGoToCurrentLocation: () => void;
  userId: string;
}

const Bar = ({
  handleMakeFriend,
  handleSearchMemo,
  handleGoToCurrentLocation,
  userId,
}: BarProps) => {
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
      uuid: user.uuid,
      avatar: user.avatar,
    }));
    setFollowingUsers(usersArray);
  }
  async function handleGetUser(uuid: string) {
    const formData = new FormData();
    formData.append("followingId", uuid!);
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
    setFollowingUser(null); // 状態をクリア

    // 状態が更新された後の確認
    console.log("Updated following users:", newUsers);
  }
  const [uuid, setUuid] = useState("");
  const [follwingUser, setFollowingUser] = useState<{
    username: string;
    uuid: string;
    avatar: string;
  } | null>(null);
  const [follwingUsers, setFollowingUsers] = useState<
    { username: string; uuid: string; avatar: string; status: string }[]
  >([]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: "10px 20px",
        borderRadius: "8px",
      }}
    >
      {handleMakeFriend && (
        <>
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                onClick={handleMakeFriend}
                style={{
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                className="bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faUserPlus} />
              </Button>
            </DrawerTrigger>
            <DrawerContent
              className="h-full lg:w-1/2 w-full mx-auto "
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
                    <FontAwesomeIcon
                      icon={faChevronLeft}
                      style={{ height: "3rem", color: "white" }}
                    />
                  </DrawerClose>
                  <DrawerTitle></DrawerTitle>
                  <DrawerDescription></DrawerDescription>
                </div>
              </DrawerHeader>
              <>
                <div className="text-white" style={{ fontSize: "2rem" }}>
                  フレンド追加
                </div>
                <div className="p-0" style={{ width: "90%" }}>
                  <Label
                    htmlFor="username"
                    className="text-white"
                    style={{ fontSize: "1.5rem" }}
                  >
                    ユーザーID
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="username"
                    autoComplete="username"
                    required
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    value={uuid} // 状態値をバインド
                    onChange={(e) => setUuid(e.target.value)}
                    className="w-full text-white h-14"
                    //aria-invalid={actionData?.errors?.email ? true : undefined}
                    aria-describedby="username-error"
                    style={{ fontSize: "2rem" }}
                  />
                  {follwingUser ? (
                    <div className="p-2 mt-3 text-white flex border rounded-md">
                      {follwingUser.avatar ? (
                        <img
                          src={`${follwingUser.avatar}`}
                          alt={follwingUser.username}
                          className="rounded-full"
                          style={{ height: "4rem", width: "4rem" }}
                        />
                      ) : (
                        <Avatar
                          size={"4rem"}
                          name={follwingUser.uuid}
                          variant="beam"
                        />
                      )}
                      <div className="p-3" style={{ fontSize: "2rem" }}>
                        {follwingUser.username}
                      </div>
                      <Button
                        onClick={() => {
                          handleFollw(uuid);
                        }}
                        className="ml-auto p-5 w-auto mt-5 bg-white text-black bg-indigo-500"
                      >
                        フレンド申請
                      </Button>
                    </div>
                  ) : null}
                  <Button
                    onClick={() => {
                      handleGetUser(uuid);
                    }}
                    className="p-5 w-full mt-5 bg-white text-black bg-indigo-500"
                  >
                    検索
                  </Button>
                </div>

                <div className="text-white p-2" style={{ fontSize: "2rem" }}>
                  フレンド一覧
                </div>
                <div className="overflow-y-auto w-full flex flex-col items-center">
                  {follwingUsers ? (
                    follwingUsers.map((user) => (
                      <div
                        key={user.uuid}
                        className="p-2 mt-3 text-white flex items-center justify-between border rounded-md w-11/12 md:w-3/4 lg:w-1/2"
                      >
                        <div className="flex items-center">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="rounded-full"
                              style={{ height: "4rem", width: "4rem" }}
                            />
                          ) : (
                            <Avatar
                              size="4rem"
                              name={user.uuid}
                              variant="beam"
                            />
                          )}
                          <div className="ml-4">
                            <div className="text-2xl">{user.username}</div>
                            <div className=" text-gray-500">@{user.uuid}</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleFollw(user.uuid)}
                          className="bg-indigo-500 text-white"
                        >
                          フレンド申請
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-white">フレンドがまだいません。</div>
                  )}
                </div>
              </>
            </DrawerContent>
          </Drawer>
        </>
      )}
      <Button
        onClick={handleSearchMemo}
        style={{
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        className="bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </Button>
      <Button
        onClick={handleGoToCurrentLocation}
        style={{
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        className="bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faLocationDot} className="text-4xl" />
      </Button>
    </div>
  );
};

export default Bar;
