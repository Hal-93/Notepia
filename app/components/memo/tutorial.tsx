import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent } from "~/components/ui/drawer";

const pages = [
  {
    title: "ようこそ Notepia へ",
    content:
      "Notepiaの操作方法のチュートリアルです。マップ上での操作方法をスワイプして確認しましょう。\n \nNotepiaではユーザーの位置情報を使用しますが、これは現在地を表示する目的のみで使用し、Notepiaがこの情報を保存することはありません。",
    media: { type: "image", src: "/Notepia-light.svg", width: "90%" },
  },
  {
    title: "メモの作成",
    content:
      "地図上でダブルクリックするとその地点にメモを作成できます。タイトル・内容を入力し、色を選択して保存してください。",
    media: { type: "video", src: "/tutorial/create.mp4" },
  },
  {
    title: "検索とリスト",
    content:
      "画面上部の検索バーで場所を検索したり、サイドバーから絞り込みやメモ一覧を表示できます。",
    media: { type: "image", src: "/images/tutorial3.png" },
  },
];

export default function TutorialCarousel({ onClose }: { onClose: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
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

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const onScroll = () => {
      const pageWidth = el.clientWidth;
      const idx = Math.round(el.scrollLeft / pageWidth);
      setCurrentIndex(idx);
    };
    el.addEventListener("scroll", onScroll);
    const timeoutId = setTimeout(onScroll, 0);
    return () => {
      clearTimeout(timeoutId);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <Drawer open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="mx-auto h-[80vh] w-full max-w-md bg-black text-white rounded-lg shadow-lg p-4 overflow-hidden z-[9999]">
        <div
          ref={modalRef}
          className="relative w-full h-full"
        >
          <div
            ref={scrollContainerRef}
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
                    style={{ width: page.media.width, height: "auto" }}
                  />
                )}
                {page.media?.type === "video" && (
                  <video
                    src={page.media.src}
                    loop
                    autoPlay
                    muted
                    className="w-full object-contain mb-4 rounded"
                    style={{ width: page.media.width || "100%", height: "auto" }}
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
