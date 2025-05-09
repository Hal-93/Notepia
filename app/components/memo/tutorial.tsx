import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent } from "~/components/ui/drawer";

const pages = [
  {
    title: "ようこそ Notepia へ",
    content:
      "Notepiaの操作方法のチュートリアルです。マップ上での操作方法をスワイプして確認しましょう。\n \nNotepiaではユーザーの位置情報を使用しますが、これは現在地を表示する目的のみで使用し、Notepiaがこの情報を収集することはありません。",
    media: { type: "image", src: "/Notepia-light.svg", width: "90%" },
  },
  {
    title: "メモ",
    content:
      "地図上でダブルクリックするとその地点にメモを作成できます。タイトル・内容を入力し、色を選択して保存してください。\nメモのポップアップをクリックすると、詳細を表示することができます。付箋の追加もここから行います。",
    media: { type: "video", src: "/tutorial/create.mp4" },
  },
  {
    title: "メモリスト",
    content:
      "アクションバーからマップ上に設置されているメモの一覧を表示できます。\nメモに色をつけた場合は色ごとに検索をかけたり、メモのタイトルで検索をかけて絞り込むことができます。\nマップ上で操作することなく完了や削除・復元もここから行えます。\n完了したメモは「完了済み」タブに表示されます。",
    media: { type: "video", src: "/tutorial/detail.mp4" },
  },
  {
    title: "フレンド",
    content:
      "他のNotepiaユーザーとフレンド登録しましょう。",
    media: { type: "image", src: "/Notepia-light.svg", width: "90%" },
  },
];

export default function TutorialCarousel({ onClose }: { onClose: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Scroll handler to sync indicator on user scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const idx = Math.round(el.scrollLeft / pageWidth);
    setCurrentIndex(idx);
  };

  // Initialize indicator on mount
  useEffect(() => {
    handleScroll();
  }, []);

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <Drawer open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="mx-auto h-[70vh] w-full max-w-[768px] bg-black text-white rounded-lg shadow-lg p-4 overflow-hidden z-[100]">
        <div
          ref={modalRef}
          className="relative w-full h-full"
        >
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {pages.map((page, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-full p-6 snap-start flex flex-col justify-start"
              >
                {page.media?.type === "image" && (
                  <img
                    src={page.media.src}
                    alt=""
                    className="w-full object-contain mb-4 rounded"
                    style={{ width: "auto", height: "100px" }}
                  />
                )}
                {page.media?.type === "video" && (
                  <video
                    src={page.media.src}
                    loop
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    className="w-full object-contain mb-4 rounded"
                    style={{ width: page.media.width || "100%", height: "200px" }}
                  >
                    <track
                      kind="captions"
                      srcLang="ja"
                      label="Japanese captions"
                      default
                    />
                  </video>
                )}
                <h2 className="text-xl font-bold mb-4 text-center">{page.title}</h2>
                <p className="text-base text-gray-300">{page.content}</p>
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const el = scrollContainerRef.current;
                  if (el) {
                    const pageWidth = el.clientWidth;
                    el.scrollTo({ left: i * pageWidth, behavior: "smooth" });
                  }
                  setCurrentIndex(i);
                }}
                className={`w-2 h-2 rounded-full focus:outline-none ${i === currentIndex ? "bg-white" : "bg-gray-500"}`}
              />
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
