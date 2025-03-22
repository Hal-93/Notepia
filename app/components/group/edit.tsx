import { useState } from "react";
import { useFetcher } from "@remix-run/react";

type GroupEditProps = {
  groupId: string;
  currentName: string;
  currentUserId: string;
  onClose: () => void;
};

export default function GroupEditModal({
  groupId,
  currentName,
  onClose,
}: GroupEditProps) {
  const [name, setName] = useState(currentName);
  const fetcher = useFetcher();

  const handleSubmit = () => {
    if (name.trim() === "") {
      alert("グループ名を入力してください");
      return;
    }

    fetcher.submit(
      {
        intent: "rename",
        groupId,
        newName: name,
      },
      { method: "post", action: "/group/edit" }
    );
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
          <span className="text-sm">グループ名 <span className="text-red-500">*</span></span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="グループ名を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2 bg-indigo-500 rounded text-white hover:bg-indigo-700"
        >
          グループを更新する
        </button>
      </div>
    </div>
  );
}