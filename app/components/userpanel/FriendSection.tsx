import Avatar from "boring-avatars";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
type User = { uuid: string; username: string; avatar: string };

type Props = {
  toId: string;
  follwingUser: User | null;
  friendRequests: any[];
  follwingUsers: any[];
  isAdd: boolean;
  setToId: (v: string) => void;
  handleFriend: (uuid: string) => void;
  handleGetUser: (id: string) => void;
  handleAccept: (id: string) => void;
  handleReject: (id: string) => void;
  handleRemove: (id: string) => void;
};

export default function FriendSection({
  toId,
  follwingUser,
  friendRequests,
  follwingUsers,
  isAdd,
  setToId,
  handleFriend,
  handleGetUser,
  handleAccept,
  handleReject,
  handleRemove,
}: Props) {
  return (
    <div className="w-full max-h-[65vh]  px-1">
      <div className="w-full p-2 rounded-lg text-white">
        {isAdd && (
          <>
            <h2 className="text-2xl text-center mb-4">フレンド追加</h2>

            <Label htmlFor="username" className="text-white text-lg">
              ユーザーID
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full text-white h-14 bg-gray-800 p-2 text-xl rounded-md"
            />

            {follwingUser && (
              <div className="p-2 mt-3 flex border rounded-md items-center bg-gray-800">
                {follwingUser.avatar ? (
                  <img
                    src={follwingUser.avatar + "?h=128"}
                    alt={follwingUser.username}
                    className="rounded-full h-16 w-16"
                  />
                ) : (
                  <Avatar size="4rem" name={follwingUser.uuid} variant="beam" />
                )}
                <div className="ml-4 text-xl">{follwingUser.username}</div>
                {!follwingUsers.some((u) => u.uuid === follwingUser.uuid) && (
                  <Button
                    onClick={() => handleFriend(follwingUser.uuid)}
                    className="ml-auto p-2 bg-indigo-500 text-white rounded-md"
                  >
                    フレンド申請
                  </Button>
                )}
              </div>
            )}

            <Button
              onClick={() => handleGetUser(toId)}
              className="w-full mt-4 p-3 bg-indigo-500 text-white rounded-md text-lg"
            >
              検索
            </Button>
          </>
        )}
        {friendRequests?.length > 0 && (
          <>
            <h3 className="text-2xl text-center mt-6">フレンドリクエスト</h3>
            {friendRequests.map((user) => (
              <div
                key={user.uuid}
                className="p-3 mt-3 flex items-center justify-between border rounded-md bg-gray-800"
              >
                <div className="flex items-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar + "?h=128"}
                      alt={user.username}
                      className="rounded-full h-12 w-12"
                    />
                  ) : (
                    <Avatar size="3rem" name={user.uuid} variant="beam" />
                  )}
                  <div className="ml-4">
                    <div className="text-xl">{user.username}</div>
                    <div className="text-gray-500 text-sm">@{user.uuid}</div>
                  </div>
                </div>
                <Button
                  onClick={() => handleAccept(user.fromId)}
                  className="ml-auto p-2 bg-green-600 text-white rounded-md"
                >
                  承認
                </Button>
                <Button
                  onClick={() => handleReject(user.fromId)}
                  className="ml-2 p-2 bg-red-500 text-white rounded-md"
                >
                  拒否
                </Button>
              </div>
            ))}
          </>
        )}

        <h3 className="text-2xl text-center mt-6">フレンド一覧</h3>
        <div className=" max-h-96">
          {follwingUsers.length > 0 ? (
            follwingUsers.map((user) => (
              <div
                key={user.uuid}
                className="p-3 mt-3 flex items-center justify-between border rounded-md bg-gray-800"
              >
                <div className="flex items-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar + "?h=128"}
                      alt={user.username}
                      className="rounded-full h-12 w-12"
                    />
                  ) : (
                    <Avatar size="3rem" name={user.uuid} variant="beam" />
                  )}
                  <div className="ml-4">
                    <div className="text-xl">{user.username}</div>
                    <div className="text-gray-500 text-sm">@{user.uuid}</div>
                  </div>
                </div>
                <div className="ml-auto pr-1">
                  {user.status === "PENDING" && "承認待ち"}
                </div>
                <Popover >
                  <PopoverTrigger className="hover:text-red-400">
                    <FontAwesomeIcon icon={faXmark}></FontAwesomeIcon>
                  </PopoverTrigger>
                  <PopoverContent className="z-[9999] w-auto pointer-events-auto bg-black border-black">
                    <Button
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(user.uuid);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className=" bg-red-600 text-white rounded-md"
                    >
                      フレンド削除
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            ))
          ) : (
            <div className="text-center mt-3">フレンドがまだいません。</div>
          )}
        </div>
      </div>
    </div>
  );
}
