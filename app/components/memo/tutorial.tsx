import React, { useEffect, useRef, useState, Fragment } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent } from "~/components/ui/drawer";

const pages = [
  {
    title: "ようこそ Notepia へ",
    content: (
      <>
        <p>ようこそ、勇敢なる探検家！🗺️</p>
        <p>Notepiaで探検を始める前に、いくつかの基本操作を伝授します！<br/><br/></p>
        <div className="bg-yellow-700 rounded p-4">
          <FontAwesomeIcon icon={faExclamationTriangle} />{" "}
          <strong>秘密のヒミツ：</strong> Notepiaは位置情報を使ってあなたを助けますが、現在地を表示するためだけにこれを使用し、勝手に他の妖精に渡したりはしないので安心してくださいね！  
        </div>
        <p className="mt-4">恐れを捨てて、冒険の第一歩を踏み出しましょう！</p>
      </>
    ),
    media: { type: "image", src: "/Notepia-light.svg", width: "90%" },
  },
  {
    title: "メモを作成",
    content:
      "🖋️ 地図はあなたの魔法のキャンバス！ダブルクリックで落書き開始！\n\nクリック後にタイトルと内容を記入し、好きな色でペタリ。完了したらマップ上にメモが出現します！",
    media: { type: "video", src: "/tutorial/memo.mp4" },
  },
  {
    title: "付箋の追加",
    content:
      "📝 メモを魔法のキャンバスに変身！\n\n地図上のメモをクリックして詳細を開き、付箋をペタリと貼りましょう。色は冒険の証——忘れたくないアイデアはどんどん重ねてOK！",
    media: { type: "video", src: "/tutorial/husen.mp4" },
  },
  {
    title: "メモリスト",
    content:
      "📜 アクションバーのメモリストボタンからあなたの作成したメモを振り返りましょう。検索機能で秘蔵メモを発掘可能！\n\nクリック一つでその地点へワープ、完了、削除、復元もチート級に簡単。完了済みは“伝説の足跡”として専用タブに格納されます。",
    media: { type: "video", src: "/tutorial/move.mp4" },
  },
  {
    title: "プロフィールを作る",
    content:
      "🛡️ 冒険者、キャラクターの錬成場へようこそ！\n\n今は『名無しの旅人』状態…早速名前とアバターを決めて、自分だけの英雄像を刻みましょう。あの人だと気づいてもらえるはず！",
      media: { type: "video", src: "/tutorial/profile.mp4" },
  },
  {
    title: "フレンドを追加する",
    content:
      "🤝 知り合いのNotepiaユーザーとフレンドになりましょう！\n\nプロフィール > フレンド一覧 > +ボタンでユーザーを検索。IDは完全一致検索なので、友達に正確なユーザーIDを聞きましょう！",
      media: { type: "video", src: "/tutorial/friend.mp4" },
  },
  {
    title: "グループを作る/参加する",
    content:
      "🏰 フレンドたちとグループを作ろう！\n\n左上のハンバーガーメニューから新たなマップへ。新しいグループを作成するか、仲間に追加してもらいましょう。権限は Viewer→Editor→Admin→Owner の4段階で、参加初期状態のViewer状態ではメモを編集できません！グループに招待された場合、閲覧専用グループでない限りはすぐにEditorに昇格してもらいましょう！",
      media: { type: "video", src: "/tutorial/group.mp4" },
  },
  {
    title: "カスタマイズ",
    content:
      "🎨 この世界はあなた色に染まる！\n\nマップの読み込みが重く感じたら軽量マップに変更できるし、バーの位置も自由自在。好みの設定を見つけて探検を快適に！",
    media: { type: "image", src: "/tutorial/setting.png" },
  },
  {
    title: "さぁ、始めましょう！",
    content: (
      <>
        <p>🎉 チュートリアルはこれで完了です！</p>
        <p>操作方法を見たくなったら、いつでも右下の{" "}
          <FontAwesomeIcon icon={faInfoCircle} />{" "}
          をタップしてここへ舞い戻れます。</p>
        <p className="mt-4">さあ、Notepiaの世界を自由に駆け巡りましょう！</p>
      </>
    ),
    media: { type: "image", src: "/Notepia-light.svg", width: "90%" },
  },
];

export default function TutorialCarousel({ onClose }: { onClose: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef<number>(0);


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

  // Navigate to next page
  const goNext = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const next = Math.min(currentIndex + 1, pages.length - 1);
    el.scrollTo({ left: next * pageWidth, behavior: "smooth" });
    setCurrentIndex(next);
  };

  // Navigate to previous page
  const goPrev = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const prev = Math.max(currentIndex - 1, 0);
    el.scrollTo({ left: prev * pageWidth, behavior: "smooth" });
    setCurrentIndex(prev);
  };

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [currentIndex]);

  // Handle swipe gesture: only one page per swipe
  const handleTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const threshold = 50; // min px to count as swipe
    if (deltaX < -threshold) {
      goNext();
    } else if (deltaX > threshold) {
      goPrev();
    }
  };
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentIndex]);

  // On mount, bind loadeddata event to all videos for autoplay
  useEffect(() => {
    if (!modalRef.current) return;
    const videos = modalRef.current.querySelectorAll('video');
    videos.forEach((video) => {
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.autoplay = true;
      video.setAttribute('webkit-playsinline', 'true');
      const onLoaded = () => {
        video.play().catch(() => {});
        video.removeEventListener('loadeddata', onLoaded);
      };
      video.addEventListener('loadeddata', onLoaded);
    });
  }, []);

  // Play the video on the current page when it becomes active
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const videos = Array.from(el.querySelectorAll('video'));
    const video = videos[currentIndex];
    if (video) {
      video.play().catch(() => {});
    }
  }, [currentIndex]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width / 2) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="mx-auto h-[75vh] w-full max-w-[768px] bg-black text-white rounded-lg shadow-lg p-4 overflow-hidden z-[100]">
        <div
          ref={modalRef}
          className="relative w-full h-full"
        >
          <div
            ref={scrollContainerRef}
            onClick={handleContainerClick}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                handleContainerClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="チュートリアル ナビゲーション"
            className="h-full flex overflow-hidden no-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              touchAction: 'none',
              overscrollBehavior: 'contain',
            }}
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
                    autoPlay
                    muted
                    playsInline
                    loop
                    preload="auto"
                    className="w-full object-contain mb-4 rounded"
                    style={{ width: page.media.width || "100%", height: "200px" }}
                  >
                    <source src={page.media.src} type="video/mp4" />
                    <track
                      kind="captions"
                      srcLang="ja"
                      label="Japanese captions"
                      default
                    />
                  </video>
                )}
                <h2 className="text-xl font-bold mb-4 text-center">{page.title}</h2>
                {typeof page.content === "string" ? (
                  page.content.split("\n\n").map((paragraph, pi) => (
                    <p key={pi} className="text-base text-gray-300 mb-4">
                      {paragraph.split("\n").map((line, li) => (
                        <Fragment key={li}>
                          {line}
                          <br />
                        </Fragment>
                      ))}
                    </p>
                  ))
                ) : (
                  <div className="text-base text-gray-300 mb-4">
                    {page.content}
                  </div>
                )}
                {idx === pages.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <Button className="bg-cyan-500"onClick={onClose}>はじめる</Button>
                  </div>
                )}
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
