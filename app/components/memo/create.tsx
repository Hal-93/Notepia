import { useEffect, useState } from "react";

async function reverseGeocode(lat: number, lng: number, token: string): Promise<string> {
  if (!token) {
    throw new Error("MAPBOX_TOKEN が設定されていません");
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Reverse geocoding リクエストに失敗しました");
  }
  const data = await res.json();
  if (data.features && data.features.length > 0) {
    const fullAddress: string = data.features[0].place_name;
    const parts = fullAddress.split(",");
    if (parts.length < 2) return fullAddress;

    const firstPart = parts[0].trim();
    const prefecturePart = parts[1].trim();

    const prefectureMapping: Record<string, string> = {
      "Tokyo Prefecture": "東京都",
      "Osaka Prefecture": "大阪府",
      "Hokkaido": "北海道",
      "Kyoto Prefecture": "京都府",
      "Kanagawa Prefecture": "神奈川県",
      "Saitama Prefecture": "埼玉県",
      "Chiba Prefecture": "千葉県",
      "Aichi Prefecture": "愛知県",
      "Hyogo Prefecture": "兵庫県",
      "Fukuoka Prefecture": "福岡県",
    };

    const prefecture = prefectureMapping[prefecturePart] || prefecturePart;

    const firstParts = firstPart.split(" ");
    if (firstParts.length < 3) return fullAddress;

    const buildingNumber = firstParts[0];
    const street = firstParts[1].replace("番", "");
    const municipality = firstParts.slice(2).join(" ");
    return `${prefecture}${municipality}${street}-${buildingNumber}`;
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

  useEffect(() => {
    setLoadingAddress(true);
    reverseGeocode(lat, lng, mapboxToken)
      .then((addr) => setPlace(addr))
      .finally(() => setLoadingAddress(false));
  }, [lat, lng]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-black rounded-lg shadow-lg p-4 text-white">
        <div className="flex justify-between items-center h-3" style={{ backgroundColor: color }}>
        </div><br/>
        <div className="flex justify-between">
          <h2 className="text-white text-lg font-bold">メモの作成</h2>
          <button type="button" onClick={onClose} className="text-white hover:text-red-400">
            ×
          </button>
        </div>
        <label className="block mb-2">
          <span className="text-sm">メモ <span className="text-red-500">*</span></span>
          <input
            type="text"
            className="mt-1 w-full rounded bg-gray-800 border border-gray-500 p-2"
            placeholder="メモのタイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block mb-2">
          <span className="text-sm">場所 <span className="text-red-500">*</span></span>
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