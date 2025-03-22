import { useEffect, useState } from "react";

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  return `緯度:${lat.toFixed(4)}, 経度:${lng.toFixed(4)} の住所`;
}

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

type MemoCreateProps = {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (memoData: {
    title: string;
    place: string;
    content: string;
    color: string;
    lat: number;
    lng: number;
  }) => void;
};

export default function MemoCreateModal({
  lat,
  lng,
  onClose,
  onSubmit,
}: MemoCreateProps) {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    setLoadingAddress(true);
    reverseGeocode(lat, lng)
      .then((addr) => setPlace(addr))
      .finally(() => setLoadingAddress(false));
  }, [lat, lng]);

  const handleSubmit = () => {
    onSubmit({
      title,
      place,
      content,
      color,
      lat,
      lng,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">メモの作成</h2>
          <button onClick={onClose} className="text-white hover:text-red-400">
            ×
          </button>
        </div>
        <label className="block mb-2">
          <span className="text-sm">タイトル</span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block mb-2">
          <span className="text-sm">場所</span>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
              placeholder="場所を入力"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          {loadingAddress && (
            <p className="text-xs text-gray-400 mt-1">住所を取得中...</p>
          )}
        </label>
        <label className="block mb-2">
          <span className="text-sm">メモ</span>
          <textarea
            className="mt-1 w-full h-20 rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="メモの内容"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        <div className="mb-4">
          <span className="text-sm">メモのカラー</span>
          <div className="flex gap-2 mt-2">
            {MEMO_COLORS.map((c) => (
              <button
                key={c}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? "border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2 bg-red-600 rounded text-white hover:bg-red-500"
        >
          メモをおく
        </button>
      </div>
    </div>
  );
}