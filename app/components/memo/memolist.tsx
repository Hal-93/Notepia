import { useState, useEffect } from "react";
import type { Memo } from "@prisma/client";
import { Input } from "~/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useFetcher, useRevalidator } from "@remix-run/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTrash } from "@fortawesome/free-solid-svg-icons";

const MEMO_COLORS = [
  "#ffffff",
  "#ffcccc",
  "#ffe8cc",
  "#ffffcc",
  "#ccffcc",
  "#ccffff",
  "#ccccff",
  "#f3f3f3",
];

interface MemoListProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredMemos: Memo[];
  jumpToMemo: (memo: Memo) => void;
}

export default function MemoList({
  searchQuery,
  onSearchQueryChange,
  filteredMemos,
  jumpToMemo,
}: MemoListProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const fetcher = useFetcher<{ success: boolean }>();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.data?.success) {
      // Revalidate loader data instead of full reload
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  const handleCompleteClick = (memo: Memo) => {
    fetcher.submit(
      { memoId: memo.id, action: "complete" },
      { method: "post", action: "/api/memos" }
    );
  };

  const handleDeleteClick = (memo: Memo) => {
    fetcher.submit(
      { memoId: memo.id, action: "delete" },
      { method: "post", action: "/api/memos" }
    );
  };

  // Filter by selected color
  const displayedMemos = filteredMemos.filter(memo =>
    selectedColor ? memo.color === selectedColor : true
  );

  return (
    <div className="mx-auto w-full max-w-[768px] h-full bg-black px-4 pb-4">
      {/* 検索入力 */}
      <Input
        placeholder="メモのタイトル名で検索"
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2 mb-4"
      />

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSelectedColor(null)}
          className="w-6 h-6 rounded-full border-2 border-dashed border-gray-400"
          title="透明 (リセット)"
        />
        {MEMO_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedColor(c)}
            className={`w-6 h-6 rounded-full border-2 ${selectedColor === c ? "border-blue-400" : "border-transparent"}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <Tabs defaultValue="incomplete" className="mt-4">
        <TabsList className="flex space-x-2 bg-black ">
          <TabsTrigger
            value="incomplete"
            className="px-4 py-2 text-white focus:outline-none transition-all data-[state=active]:bg-gray-800 data-[state=active]:text-blue-400"
          >
            未完了
          </TabsTrigger>
          <TabsTrigger
            value="complete"
            className="px-4 py-2 text-white focus:outline-none transition-all data-[state=active]:bg-gray-800 data-[state=active]:text-blue-400"
          >
            完了済み
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incomplete">
          <ScrollArea className="h-[50vh] pr-2 mt-2">
            <ul className="space-y-2">
              {displayedMemos.filter((memo) => !memo.completed).length === 0 ? (
                <div className="text-gray-500 text-sm">
                  条件に合うメモがありません。
                </div>
              ) : (
                displayedMemos
                  .filter((memo) => !memo.completed)
                  .map((memo) => (
                    <li key={memo.id}>
                      <div
                        className="w-full flex justify-between items-center p-3 rounded bg-gray-900 hover:bg-gray-800 text-white transition"
                        style={{ borderLeft: `4px solid ${memo.color || '#3b82f6'}` }}
                      >
                        <button
                          type="button"
                          onClick={() => jumpToMemo(memo)}
                          className="flex-1 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {memo.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteClick(memo)}
                          className="ml-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      </div>
                    </li>
                  ))
              )}
            </ul>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="complete">
          <ScrollArea className="h-[50vh] pr-2 mt-2">
            <ul className="space-y-2">
              {displayedMemos.filter((memo) => memo.completed).length === 0 ? (
                <div className="text-gray-500 text-sm">
                  条件に合うメモがありません。
                </div>
              ) : (
                displayedMemos
                  .filter((memo) => memo.completed)
                  .map((memo) => (
                    <li key={memo.id}>
                      <div
                        className="w-full flex justify-between items-center p-3 rounded bg-gray-900 hover:bg-gray-800 text-white transition"
                        style={{ borderLeft: `4px solid ${memo.color || '#3b82f6'}` }}
                      >
                        <button
                          type="button"
                          onClick={() => jumpToMemo(memo)}
                          className="flex-1 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {memo.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(memo)}
                          className="ml-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </li>
                  ))
              )}
            </ul>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}