import { useEffect, useRef, useState } from "react";

async function reverseGeocode(
  lat: number,
  lng: number,
  token: string
): Promise<string> {
  if (!token) throw new Error("MAPBOX_TOKENエラー");

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&language=ja`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("リクエストに失敗しました");

  const data = await res.json();
  if (data.features?.length > 0) {
    const feature = data.features[0];
    const street = feature.text;
    const building = feature.properties?.address;

    let prefecture = "", city = "", ward = "";
    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith("region.")) prefecture = ctx.text;
      else if (ctx.id.startsWith("place.")) city = ctx.text;
      else if (ctx.id.startsWith("locality.")) ward = ctx.text;
    }

    const municipality = ward || city;
    const address = `${prefecture}${municipality}${street}`;
    return building ? `${address}-${building}` : address;
  }

  return "住所が見つかりませんでした";
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
  mapboxToken: string;
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
  mapboxToken,
  onClose,
  onSubmit,
}: MemoCreateProps) {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [loadingAddress, setLoadingAddress] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingAddress(true);
    reverseGeocode(lat, lng, mapboxToken)
      .then((addr) => setPlace(addr))
      .finally(() => setLoadingAddress(false));
  }, [lat, lng, mapboxToken]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSubmit = () => {
    if (title.trim() === "") {
      alert("タイトルを入力してください");
      return;
    }
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white overflow-hidden"
      >
        <div
          className="absolute top-0 left-0 right-0 h-6 rounded-t-lg"
          style={{ backgroundColor: color }}
        />

        <div className="flex justify-between items-center mb-4 pt-6">
          <h2 className="text-lg font-bold">メモの作成</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-red-400 w-8 h-8 flex items-center justify-center rounded-full text-4xl"
          >
            ×
          </button>
        </div>

        <label className="block mb-2">
          <span className="text-sm">
            メモ <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="メモのタイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm">
            場所 (省略可)
          </span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder={loadingAddress ? "住所を取得中..." : "場所を入力"}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm">内容 (省略可)</span>
          <textarea
            className="mt-1 w-full h-20 rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="メモの内容"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>

        <div className="mb-4">
          <span className="text-sm">メモの色</span>
          <div className="flex gap-2 mt-2">
            {MEMO_COLORS.map((c) => (
              <button
                key={c}
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? "border-blue-700" : "border-transparent"
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
          className="w-full py-2 bg-indigo-500 rounded text-white hover:bg-indigo-700"
        >
          メモをおく
        </button>
      </div>
    </div>
  );
}
