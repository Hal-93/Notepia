import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";

type GroupCreateProps = {
  currentUserId: string;
  onClose: () => void;
  changeGroup?: (groupId: string) => void;
};
type GroupCreateResponse = { groupId: string };

export default function GroupCreateModal({
  onClose,
  changeGroup,
}: GroupCreateProps) {
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const fetcher = useFetcher<GroupCreateResponse>();

  const handleSubmit = () => {
    if (!agreed) {
      alert("グループ作成前にチェックボックスを承認してください");
      return;
    }
    if (name.trim() === "") {
      alert("グループ名を入力してください");
      return;
    }

    fetcher.submit({ name }, { method: "post", action: "/group/create" });
  };
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.groupId) {
      changeGroup?.(fetcher.data.groupId);
      onClose();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between mb-4">
          <h2 className="text-white text-lg font-bold">グループの作成</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-red-400 text-2xl"
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

        <label className="flex items-start space-x-2 text-xs text-gray-400 mb-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <span className="leading-tight">
            グループを作成すると、あなたはこのグループのオーナーになります。
            <br />
            あなたがこのグループを脱退するとグループは破棄されます。
          </span>
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!agreed}
          className={`w-full mt-6 py-2 rounded text-white ${
            agreed
              ? "bg-indigo-500 hover:bg-indigo-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          グループを作成する
        </button>
      </div>
    </div>
  );
}
