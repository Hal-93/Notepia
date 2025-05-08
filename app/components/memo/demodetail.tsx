import { useEffect, useRef } from "react";
import type { Memo } from "@prisma/client";
import type { Role } from "@prisma/client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck, faTrash, faUndo } from "@fortawesome/free-solid-svg-icons";

type MemoDetailModalProps = {
  memo: Memo;
  onClose: () => void;
  actorRole?: Role;
  currentUserId: string;
};

export default function DemoDetailModal({ memo, onClose, actorRole, currentUserId }: MemoDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const loadMemos = (): Memo[] => {
    const s = localStorage.getItem("demo-memos");
    return s ? JSON.parse(s) : [];
  };
  const saveMemos = (arr: Memo[]) => {
    localStorage.setItem("demo-memos", JSON.stringify(arr));
  };

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
    alert("デモ版ではこの機能は使用できません");
  };
  const handleDelete = () => {
    const arr = loadMemos().filter(m => m.id !== memo.id);
    saveMemos(arr);
    onClose();
  };
  const handleRestore = () => {
    const arr = loadMemos().map(m => m.id === memo.id ? { ...m, completed: false } : m);
    saveMemos(arr);
    onClose();
  };

  const memoColor = memo.color || "#ffffff";

  const [comments, setComments] = useState<
    { id: string; content: string; createdAt: string; author: { id: string; name: string }; color: string }[]
  >([]);
  const [newComment, setNewComment] = useState("");

  const loadComments = () => {
    const s = localStorage.getItem(`demo-comments-${memo.id}`);
    return s ? JSON.parse(s) : [];
  };

  useEffect(() => {
    setComments(loadComments());
  }, [memo.id]);

  const handleAddComment = () => {
    alert("デモ版ではこの機能は使用できません");
  };

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

        <div className="space-y-4">
          <div>
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
            {memo.latitude != null && memo.longitude != null && (
              <p className="text-sm text-gray-300">
                場所: {memo.place || "未設定"}
              </p>
            )}
          </div>

          {/* コメントセクション */}
          <div>
            <div className="max-h-36 overflow-y-auto space-y-2 mb-4">
              {comments.map((c) => {
                const isOwn = c.author.id === currentUserId;
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={isOwn ? 0 : undefined}
                    onClick={isOwn ? () => handleDeleteComment(c.id) : undefined}
                    onKeyDown={isOwn ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDeleteComment(c.id);
                      }
                    } : undefined}
                    className="px-3 pt-2 pb-6 text-black rounded-lg shadow inline-block mb-2 mr-2 relative max-w-max"
                    style={{
                      backgroundColor: c.color,
                      cursor: isOwn ? "pointer" : "default",
                    }}
                  >
                    <div className="whitespace-pre-wrap break-all">
                      {c.content}
                    </div>
                    <div className="text-xs text-gray-800 absolute bottom-1 right-1 whitespace-nowrap">
                      {c.author.name}
                    </div>
                  </div>
                );
              })}
            </div>
            {!memo.completed && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-gray-700 text-white p-2 rounded"
                placeholder="付箋を追加"
              />
              <button
                type="button"
                onClick={handleAddComment}
                className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded"
              >
                追加
              </button>
            </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-4">
          {actorRole !== "VIEWER" && !memo.completed && (
            <button
              onClick={handleComplete}
              className="text-green-500 hover:text-green-300 text-2xl"
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
          )}
          {actorRole !== "VIEWER" && memo.completed && (
            <button
              onClick={handleRestore}
              className="text-yellow-400 hover:text-yellow-300 text-2xl"
            >
              <FontAwesomeIcon icon={faUndo} />
            </button>
          )}
          {actorRole !== "VIEWER" && memo.completed && (
            <button
              onClick={handleDelete}
              className="text-white-500 hover:text-white-300 text-2xl"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}