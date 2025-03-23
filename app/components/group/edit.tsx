import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import UserSearch from "../search_user";

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
      selectedUsers.find((u) => u.id === user.id)
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

  // グループ名の更新
  fetcher.submit(
    {
      intent: "rename",
      groupId,
      newName: name,
    },
    { method: "post", action: "/group/edit" }
  );

  // 新しいユーザーの追加（もしあれば）
  if (selectedUsers.length > 0) {
    fetcher.submit(
      {
        intent: "addUsers",
        groupId,
        userIds: JSON.stringify(selectedUsers.map((u) => u.id)),
      },
      { method: "post", action: "/group/edit" }
    );
  }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between">
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
            <p className="text-sm text-gray-300 mb-1">追加済み</p>
            <ul className="text-sm space-y-2 pl-2">
              {selectedUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-2">
                  <img
                    src={`/user/${u.uuid}/avatar`}
                    alt={u.name}
                    className="rounded-full border-2 border-black object-cover w-8 h-8"
                  />
                  <div className="flex flex-col text-left">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">@{u.uuid}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2 mt-6 bg-indigo-500 rounded text-white hover:bg-indigo-700"
        >
          更新
        </button>
      </div>
    </div>
  );
}