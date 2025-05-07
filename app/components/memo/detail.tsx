import { useEffect, useRef } from "react";
import { useFetcher } from "@remix-run/react";
import type { Memo } from "@prisma/client";
import type { Role } from "@prisma/client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";

type MemoDetailModalProps = {
  memo: Memo;
  onClose: () => void;
  actorRole?: Role;
  currentUserId: string;
};

export default function MemoDetailModal({ memo, onClose, actorRole, currentUserId }: MemoDetailModalProps) {
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


  // コメント機能
  const [comments, setComments] = useState<
    { id: string; content: string; createdAt: string; author: { id: string; name: string }; color: string }[]
  >([]);
  const [newComment, setNewComment] = useState("");

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("この付箋を削除しますか？")) return;
    const res = await fetch("/api/comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      alert("付箋の削除に失敗しました");
    }
  };

  // コメント取得
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/comments?memoId=${memo.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    })();
  }, [memo.id]);

  // コメント追加
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memoId: memo.id, content: newComment }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } else {
      alert("付箋の追加に失敗しました");
    }
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
          {/* Memo content */}
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
          {actorRole !== "VIEWER" && (
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