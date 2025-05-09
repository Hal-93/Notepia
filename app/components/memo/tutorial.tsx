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
        Notepiaをはじめる前に、いくつか重要な操作方法を学んでおきましょう。<br/><br />
        <div className="bg-yellow-700 rounded p-4">
        <FontAwesomeIcon icon={faExclamationTriangle} />{" "}
        Notepiaではユーザーの現在地を表示するために位置情報を利用しますが、Notepiaがユーザーの位置情報を収集し、これを他の目的で利用することはありません。
        位置情報の許可は任意ですが、拒否した場合には現在地への機能が使用できません。
        </div>
        <br/>
        <br />
        <br />
      </>
    ),
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
      "アクションバーからマップ上に設置されているメモの一覧を表示でき、メモのタイトルや色で検索をかけて絞り込むことができます。メモをクリックすればその場所へ飛ぶこともできます。\nマップ上で操作することなく完了や削除・復元もここから行えます。\n完了したメモは「完了済み」タブに表示されます。",
    media: { type: "video", src: "/tutorial/detail.mp4" },
  },
  {
    title: "プロフィールを作る",
    content:
      "まずはプロフィールを編集しましょう！\n他のNotepiaユーザーが分かるように、あなたの名前とアバターを追加してください！",
      media: { type: "image", src: "/tutorial/friend.png", width: "90%" },
  },
  {
    title: "フレンドを追加する",
    content:
      "プロフィール > フレンド一覧 > + でフレンドを追加しましょう。\n\nNotepiaでは知らないユーザーからの申請を防ぐために、ユーザーIDの完全一致でのみ検索結果がヒットします。フレンドにユーザーID(@から下の部分)を教えてもらい、検索でフレンドを見つけたら、申請を送りましょう！",
      media: { type: "image", src: "/tutorial/friend.png", width: "90%" },
  },
  {
    title: "グループを作る/参加する",
    content:
      "左上のハンバーガーメニューからグループ移動が可能です。グループを作ったり、フレンドからグループに追加してもらいましょう。\n\nグループには「OWNER」「ADMIN」「EDITOR」「VIEWER」の4つの権限があります。VIEWER(初期状態)はグループ内のメモを閲覧することができ、編集はできません。EDITORはメモの編集が可能になります。ADMINはグループのメンバーを管理することができます。OWNERは全ての権限を持ちますが、グループを脱退した場合はグループが削除されます。",
      media: { type: "image", src: "/tutorial/group.png", width: "90%" },
  },
  {
    title: "カスタマイズ",
    content:
      "マップの読み込みに時間がかかりますか？アクションバーの位置を変更したいですか？\n\nNotepiaではユーザーのための様々な設定項目を用意しています！自分好みにカスタマイズしましょう！",
    media: { type: "image", src: "/tutorial/setting.png" },
  },
  {
    title: "さぁ、始めましょう！",
    content: (
      <>
        Notepiaのチュートリアルは以上です。<br/>
        また操作方法を見たくなったら、右下の{" "}
        <FontAwesomeIcon icon={faInfoCircle} />{" "}
        からいつでも戻ってくることができます。
        <br />
        <br />
      </>
    ),
    media: { type: "image", src: "/Notepia-light.svg", width: "90%" },
  },
];

export default function TutorialCarousel({ onClose }: { onClose: () => void }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const idx = Math.round(el.scrollLeft / pageWidth);
    setCurrentIndex(idx);
  };

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

  // Navigate to next page
  const goNext = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const next = Math.min(currentIndex + 1, pages.length - 1);
    el.scrollTo({ left: next * pageWidth, behavior: "smooth" });
  };

  // Navigate to previous page
  const goPrev = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const pageWidth = el.clientWidth;
    const prev = Math.max(currentIndex - 1, 0);
    el.scrollTo({ left: prev * pageWidth, behavior: "smooth" });
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [currentIndex]);

  // Ensure videos play automatically on mobile (iOS) when page changes
  useEffect(() => {
    if (!modalRef.current) return;
    const videos = modalRef.current.querySelectorAll('video');
    videos.forEach((video) => {
      // Force muted and inline attributes at DOM level
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', 'true');
      // Attempt to play
      video.play().catch(() => {
        // swallow errors (e.g. low power mode)
      });
    });
  }, [currentIndex]);

  // Handle click on container: left half = prev, right half = next
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
            onScroll={handleScroll}
            onClick={handleContainerClick}
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
                    playsInline
                    muted
                    loop
                    preload="none"
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
