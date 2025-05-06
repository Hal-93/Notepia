import { useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import type { Memo } from "@prisma/client";
import type { Role } from "@prisma/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";

type MemoDetailModalProps = {
  memo: Memo;
  onClose: () => void;
  actorRole?: Role;
};

export default function MemoDetailModal({ memo, onClose, actorRole }: MemoDetailModalProps) {
  const fetcher = useFetcher();
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const memoColor = memo.color || "#ffffff";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div
          className="absolute -top-4 left-0 right-0 h-6 rounded-t-lg"
          style={{ backgroundColor: memoColor }}
        />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{memo.title}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 text-3xl"
          >
            ×
          </button>
        </div>

        <p className="mb-2">{memo.content}</p>

        <p className="mb-2 flex items-center gap-2">
          {memo.completed ? (
            <>
              <FontAwesomeIcon icon={faCheck} className="text-green-500" />
              <span className="text-green-500">完了</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTimes} className="text-red-500" />
              <span className="text-red-500">未完了</span>
            </>
          )}
        </p>

        {/* 場所情報 */}
        {memo.latitude != null && memo.longitude != null && (
          <p className="text-sm text-gray-300 mb-8">
            場所: {memo.place || "未設定"}
          </p>
        )}

      {actorRole !== "VIEWER" && !memo.completed && (
        <button
          onClick={handleComplete}
          className="absolute bottom-2 right-16 text-green-500 hover:text-green-300 text-2xl"
        >
          <FontAwesomeIcon icon={faCheck} />
        </button>
      )}

      {actorRole !== "VIEWER" && (
        <button
          onClick={handleDelete}
          className="absolute bottom-2 right-4 text-white-500 hover:text-white-300 text-2xl"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      )}
      </div>
    </div>
  );
}