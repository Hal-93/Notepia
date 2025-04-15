import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import Avatar from "boring-avatars";
import UserSearchCL from "../search_user_cl";

type GroupCreateProps = {
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

export default function GroupCreateModalCL({ currentUserId, onClose }: GroupCreateProps) {
  const [name, setName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const fetcher = useFetcher();

  const handleSubmit = () => {
    if (name.trim() === "") {
      alert("グループ名を入力してください");
      return;
    }

    const userIds = [currentUserId, ...selectedUsers.map((u) => u.id)];

    fetcher.submit(
      {
        name,
        userIds: JSON.stringify(userIds),
      },
      { method: "post", action: "/group/create" }
    );
    onClose();
  };

  const handleUserAdd = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="window active">
        <div className="title-bar">
          <div className="title-bar-text">グループを作成する</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body">
        <label className="block mb-4">
          <span className="text-sm">
            グループ名 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2 text-black"
            placeholder="グループ名を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <UserSearchCL
          currentUserId={currentUserId}
          selectedUsers={selectedUsers}
          onUserAdd={handleUserAdd}
        />

        {selectedUsers.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-300 mb-1">追加済み</p>
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
          className="w-full text-white"
        >
          グループを作成する
        </button>
        </div>
      </div>
    </div>
  );
}