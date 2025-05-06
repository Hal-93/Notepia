import Avatar from "boring-avatars";
import { useState, useEffect } from "react";
import type { Role } from "@prisma/client";
import { Button } from "../ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan } from "@fortawesome/free-solid-svg-icons";

interface UserProfileProps {
  username: string;
  avatarUrl: string | null;
  uuid: string;
  role?: Role;
  onEdit?: () => void;
  actorRole?: Role;
  onRoleChange?: (newRole: Role) => void;
  groupId: string;
  actorId: string;
  userId: string;
}

export default function UserProfile({
  username,
  avatarUrl,
  uuid,
  role,
  actorRole,
  onRoleChange,
  groupId,
  actorId,
  userId,
}: UserProfileProps) {
  const [currentRole, setCurrentRole] = useState<Role | undefined>(role);
  const [isFriendState, setIsFriendState] = useState<boolean>(false);
  useEffect(() => {
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        setIsFriendState(data.friendIds.includes(userId));
      });
  }, [userId]);

  const handleSendFriend = async () => {
    /*
    *
    *    ここを実装
    * 
    */
  };

  const canChangeRole =
    userId !== actorId && (
      (actorRole === "OWNER" && currentRole !== "OWNER") ||
      (actorRole === "ADMIN" && currentRole !== "OWNER" && currentRole !== "ADMIN")
    );
  return (
    <div className="rounded-lg p-6 text-white w-full max-w-sm mx-auto">
      <div className="flex items-center mb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <Avatar size={64} name={uuid} variant="beam" />
        )}
        <div className="ml-4 flex-1">
          <h2 className="text-2xl font-bold">{username}</h2>
          <div className="flex flex-col text-gray-400 space-y-2">
            <span className="mr-2">@{uuid}</span>
            {currentRole && (
              <>
                <span className={`ml-2 inline-flex items-center max-w-max px-1 py-0.5 bg-gray-700 text-xs rounded ${
                  currentRole === "OWNER"
                  ? "text-yellow-300"
                  : currentRole === "ADMIN"
                  ? "text-blue-400"
                  : currentRole === "EDITOR"
                  ? "text-green-400"
                  : "text-gray-500"
              }`}>
                {currentRole}
                </span>
                {canChangeRole && (
                  <div className="relative mt-2">
                    <select
                      value={currentRole}
                      onChange={async (e) => {
                        const newRole = e.target.value as Role;
                        const res = await fetch("/api/group", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ groupId, targetUserId: userId, newRole }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setCurrentRole(newRole);
                          onRoleChange?.(newRole);
                        } else {
                          alert(`権限変更に失敗しました: ${data.error}`);
                        }
                      }}
                      className="block w-full h-10 pl-3 pr-8 bg-gray-700 border border-gray-600 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                    >
                      {actorRole === "OWNER" && (
                        <option value="ADMIN">ADMIN</option>
                      )}
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-4 w-4 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-4 flex justify-end items-center space-x-4">
            {canChangeRole && (
              <Button
                variant="ghost"
                className="text-red-500"
                onClick={async () => {
                  if (confirm("このユーザーをグループからキックしますか？")) {
                    const res = await fetch("/api/group", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        intent: "kick",
                        groupId,
                        targetUserId: userId,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      window.location.reload();
                    } else {
                      alert(`キックに失敗しました: ${data.error}`);
                    }
                  }
                }}
              >
                <FontAwesomeIcon icon={faBan} className="w-4 h-4" />
              </Button>
            )}
            {userId !== actorId && (
              isFriendState ? (
                <Button className="text-gray-400">フレンド登録済み</Button>
              ) : (
                <Button className="bg-indigo-500 hover:bg-indigo-600" onClick={handleSendFriend}>
                  フレンド申請
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}