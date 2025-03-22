import { useEffect, useState } from "react";
import type { User } from "@prisma/client";

type UserSearchProps = {
    onUserAdd: (user: User) => void;
    currentUserId: string;
    selectedUsers: User[];
  };

export default function UserSearch({ onUserAdd }: UserSearchProps) {
  const [query, setQuery] = useState("");
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
          setResults(data.users.slice(0, 5)); // 最大5件表示
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
  }, [query]);

  return (
    <div className="mb-6">
      <label className="block mb-4">
        <span className="text-sm">追加するユーザー</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
          placeholder="ユーザーを検索（UUID）"
        />
      </label>

      {loading}

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
                className="w-full text-left hover:bg-gray-700 px-2 py-1 rounded cursor-pointer"
            >
            
             <img
                key={user.id}
                src={`https://notepia.fly.dev/user/${user.uuid}/avatar`}
                alt={user.name}
                className="rounded-full border-2 border-black object-cover w-8 h-8"
                style={{ marginLeft: "-10px" }}
            />
                @{user.uuid}
            </button>
            </li>
        ))}
        </ul>
      )}
    </div>
  );
}