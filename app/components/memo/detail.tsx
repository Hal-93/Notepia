import { useFetcher } from "@remix-run/react";
import type { Memo } from "@prisma/client";

type MemoDetailModalProps = {
  memo: Memo;
  onClose: () => void;
};

export default function MemoDetailModal({ memo, onClose }: MemoDetailModalProps) {
  const fetcher = useFetcher();

  const handleComplete = () => {
    fetcher.submit(
      { memoId: memo.id, intent: "complete" },
      { method: "post", action: "/memo/detail" }
    );
    onClose();
  };

  const handleDelete = () => {
    fetcher.submit(
      { memoId: memo.id, intent: "delete" },
      { method: "post", action: "/memo/detail" }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{memo.title}</h2>
          <button onClick={onClose} className="text-white hover:text-red-500">
            ×
          </button>
        </div>
        <p className="mb-2">{memo.content}</p>
        <p className="mb-2">{memo.completed ? "完了" : "未完了"}</p>
        {memo.latitude != null && memo.longitude != null && (
          <p className="mb-2">
            緯度: {memo.latitude.toFixed(4)}, 経度: {memo.longitude.toFixed(4)}
          </p>
        )}
        <div className="flex gap-4 mt-4">
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            完了にする
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}