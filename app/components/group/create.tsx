import { useState } from "react";
import { useFetcher } from "@remix-run/react";

type GroupCreateProps = {
  currentUserId: string;
  onClose: () => void;
};

export default function GroupCreateModal({ currentUserId, onClose }: GroupCreateProps) {
  const [name, setName] = useState("");
  const fetcher = useFetcher();

  const handleSubmit = () => {
    if (name.trim() === "") {
      alert("グループ名を入力してください");
      return;
    }
    fetcher.submit(
      {
        name,
        userIds: JSON.stringify([currentUserId]),
      },
      { method: "post", action: "/group/create" }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between">
          <h2 className="text-white text-lg font-bold">グループの作成</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-red-400"
          >
            ×
          </button>
        </div>
        <label className="block mb-4">
          <span className="text-sm">グループ名 <span className="text-red-500">*</span></span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="グループ名を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        
        <label className="block mb-4">
          <span className="text-sm">追加するユーザー</span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="ユーザーを検索"
          />
        </label>
        

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2 bg-indigo-500 rounded text-white hover:bg-indigo-700"
        >
          グループを作成する
        </button>
      </div>
    </div>
  );
}