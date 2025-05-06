import Avatar from "boring-avatars";
import { useState } from "react";
import type { Role } from "@prisma/client";
import { Button } from "../ui/button";

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
                <span className={`ml-2 px-2 py-1 bg-gray-700 text-xs rounded ${
                  currentRole === "OWNER"
                  ? "text-yellow-300"
                  : currentRole === "ADMIN"
                  ? "text-blue-400"
                  : "text-gray-500"
              }`}>
                {currentRole}
                </span>
                {canChangeRole && (
                  <div className="mt-2">
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
                      className="mt-1 block w-full rounded bg-gray-800 border border-gray-600 p-1 text-sm text-white"
                    >
                      {actorRole === "OWNER" && (
                        <option value="ADMIN">ADMIN</option>
                      )}
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-4 text-right">
            <Button>
              フレンド申請
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}