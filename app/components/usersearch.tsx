import { useEffect, useState } from "react";
import Avatar from "boring-avatars"; // ← 忘れずにインポート
import type { User } from "@prisma/client";

type UserSearchProps = {
  onUserAdd: (user: User) => void;
  currentUserId: string;
  selectedUsers: User[];
};

export default function UserSearch({ onUserAdd, currentUserId, selectedUsers }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    if (query.length > 0) {
      setLoading(true);
      fetch(`/api/search-user?uuid=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.users.filter(
            (u: User) => u.id !== currentUserId && !selectedUsers.find((s) => s.id === u.id)
          );
          setResults(filtered.slice(0, 5));
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error(err);
          }
          setLoading(false);
        });
    } else {
      setResults([]);
    }

    return () => controller.abort();
  }, [query, currentUserId, selectedUsers]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="mb-6">
      <label className="block mb-4">
        <span className="text-sm">追加するユーザー</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
          placeholder="ユーザーIDで検索"
          
        />
      </label>

      {results.length > 0 && (
        <ul className="bg-gray-900 border border-gray-700 rounded-md p-2 space-y-1">
          {results.map((user) => (
            <li key={user.id}>
              <button
                onClick={() => {
                  onUserAdd(user);
                  setQuery("");
                  setResults([]);
                }}
                className="w-full hover:bg-gray-700 px-2 py-1 rounded cursor-pointer flex items-center gap-3"
              >
                {user.avatar ? (
                  <img
                    src={`/user/${user.uuid}/avatar`}
                    alt={user.name}
                    className="rounded-full object-cover w-8 h-8"
                  />
                ) : (
                  <Avatar size={32} name={user.uuid} variant="beam" />
                )}
                <div className="flex flex-col text-left">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">@{user.uuid}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}