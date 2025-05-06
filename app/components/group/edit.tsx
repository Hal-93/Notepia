import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import Avatar from "boring-avatars";
import UserSearch from "../usersearch";

type GroupEditProps = {
  groupId: string;
  currentName: string;
  currentUserId: string;
  onClose: () => void;
};

type User = {
  id: string;
  name: string;
  email: string;
  uuid: string;
  createdAt: Date;
  updatedAt: Date;
  avatar: string | null;
};

export default function GroupEditModal({
  groupId,
  currentName,
  currentUserId,
  onClose,
}: GroupEditProps) {
  const [name, setName] = useState(currentName);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const fetcher = useFetcher();

  const handleUserAdd = (user: User) => {
    if (
      user.id === currentUserId ||
      selectedUsers.some((u) => u.id === user.id)
    ) {
      return;
    }
    setSelectedUsers((prev) => [...prev, user]);
  };

  const handleSubmit = () => {
    if (name.trim() === "") {
      alert("グループ名を入力してください");
      return;
    }

    fetcher.submit(
      {
        intent: "updateGroup",
        groupId,
        newName: name,
        userIds: JSON.stringify(selectedUsers.map((u) => u.id)),
      },
      { method: "post", action: "/group/edit" }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between mb-4">
          <h2 className="text-white text-lg font-bold">グループの編集</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-red-400"
          >
            ×
          </button>
        </div>

        <label className="block mb-4">
          <span className="text-sm">
            グループ名 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="グループ名を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <UserSearch
          currentUserId={currentUserId}
          selectedUsers={selectedUsers}
          onUserAdd={handleUserAdd}
        />

        {selectedUsers.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-300 mb-1">追加済みユーザー</p>
            <ul className="space-y-2">
              {selectedUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  {u.avatar ? (
                    <img
                      src={`/user/${u.uuid}/avatar`}
                      alt={u.name}
                      className="rounded-full border-2 border-black object-cover w-8 h-8"
                    />
                  ) : (
                    <Avatar
                      size={32}
                      name={u.uuid}
                      variant="beam"
                      colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
                    />
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium">{u.name}</span>
                    <span className="text-xs text-gray-400">@{u.uuid}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full mt-6 py-2 bg-indigo-500 rounded text-white hover:bg-indigo-700"
        >
          更新
        </button>
      </div>
    </div>
  );
}