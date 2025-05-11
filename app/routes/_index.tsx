import { Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { MetaFunction } from "@remix-run/node";
import { Button } from "react-day-picker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export const meta: MetaFunction = () => {
  return [
    { title: "Notepia - 記憶と場所を結ぶ地図メモアプリ" },
    { name: "description", content: "Notepiaは、個人やグループで場所にメモを置ける革新的な地図メモアプリです。" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "theme-color", content: "#000000" },
    { property: "og:title", content: "Notepia - 記憶と場所を結ぶ地図メモアプリ" },
    { property: "og:description", content: "場所にメモを残し、友人やチームと共有。地図で記憶を可視化する新しい体験を。" },
    { property: "og:image", content: "/Notepia_url.jpg" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://notepia.cyberhub.jp/start" },
    { name: "twitter:card", content: "summary_large_image" }
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col pt-16 bg-black">
      <Header />
      <main className="relative bg-[url('/backimage.png')] bg-cover bg-center py-60 flex-1 flex flex-col items-center justify-center text-center text-white">
        <div className="absolute inset-0"></div>
        <div className="relative z-10 max-w-2xl px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">記憶と場所を結ぶ</h1>
          <p className="mb-6 text-lg md:text-xl">場所にメモを置く新感覚アプリ。</p>
          <div className="flex justify-center space-x-4">
            <Link to="/start" className="px-6 py-3 border border-white rounded-lg font-bold hover:bg-white hover:text-black">
              無料でアカウント作成
            </Link>
          </div>
        </div>
      </main>
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-6 text-center hover:shadow-lg transition">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-indigo-100 p-3">
                {/* map-pin icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v6m0-6l-2-2m2 2l2-2"/>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">簡単メモ登録</h3>
              <p className="text-gray-600">ダブルタップで地図上の好きな場所にピンを立ててメモを残せます。</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6 text-center hover:shadow-lg transition">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-3">
                {/* users icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"/>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">共有とコラボレーション</h3>
              <p className="text-gray-600">友達やチームと地図を共有し、共同でメモを編集できます。</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6 text-center hover:shadow-lg transition">
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-yellow-100 p-3">
                {/* tag icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 100 20 2.5 2.5 0 01-2.5-2.5 2.5 2.5 0 115 0 2.5 2.5 0 01-2.5 2.5h.5a10 10 0 000-20h-.5z"/>
                  <circle cx="7.5" cy="9.5" r="1.5"/>
                  <circle cx="12" cy="7" r="1.5"/>
                  <circle cx="16.5" cy="9.5" r="1.5"/>
                  <circle cx="12" cy="14.5" r="1.5"/>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">カラーで整理</h3>
              <p className="text-gray-600">カラーごとにメモを整理して素早く検索できます。</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 grid-cols-2">
            <motion.div
              className="rounded-lg overflow-hidden shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img src="/demo1-250211.png" alt="デモ画面1" className="w-full" />
            </motion.div>
            <motion.div
              className="rounded-lg overflow-hidden shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img src="/demo2-250511.png" alt="デモ画面2" className="w-full" />
            </motion.div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">プラン</h2>
          <div className="flex flex-col md:flex-row gap-8 justify-center">
            <div className="border rounded-lg p-6 bg-white flex-1">
              <h3 className="text-xl font-semibold mb-4">Free</h3>
              <p className="text-4xl font-bold mb-4">¥0</p>
              <ul className="mb-6 list-disc list-inside text-gray-600">
                <li>最大3グループへのアクセス</li>
              </ul>
              <Link
                to="/start"
                className="block w-full text-center px-4 py-2 border border-indigo-500 rounded-lg text-indigo-500 hover:bg-indigo-50"
              >
                Freeプランで始める
              </Link>
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 rounded-lg blur-lg opacity-75 animate-pulse"></div>
              <div className="relative border rounded-lg p-6 bg-white h-full">
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-purple-700 bg-clip-text text-transparent">Pro</h3>
                <p className="text-4xl font-bold mb-4">
                  ¥980<span className="text-base font-normal">/月</span>
                </p>
                <ul className="mb-6 list-disc list-inside text-gray-600">
                  <li>最大10グループへのアクセス</li>
                  <li>無制限のメモ作成</li>
                  <li>高度なテーマのカスタマイズ</li>
                </ul>
              </div>
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-600 rounded-lg blur-lg opacity-75 animate-pulse"></div>
              <div className="relative border rounded-lg p-6 bg-white h-full">
                <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Enterprise</h3>
                <p className="text-4xl font-bold mb-4">
                  ¥3,980<span className="text-base font-normal">/1ユーザーあたり/月</span>
                </p>
                <ul className="mb-6 list-disc list-inside text-gray-600">
                  <li>無制限のグループアクセス</li>
                  <li>無制限のメモ作成</li>
                  <li>社内ユーザーの管理機能</li>
                  <li>強化されたセキュリティ</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#141920] from-primary to-primary/80 px-4 py-20 text-primary-foreground md:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl text-center">
        <h2 className="text-4xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center">
          あなたの生活に
          <img src="/Notepia-light.svg" alt="Notepia logo" className="h-8 mx-2 inline-block" />
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/80">買い物のリマインド、友人との旅行の計画、使い方は無限大。</p><a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 h-11 rounded-md px-8 gap-2 bg-background text-foreground hover:bg-background/70" href="/start">無料で始める </a></div></section>
      <footer className="bg-[#1F2937] text-gray-300 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Notepia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header className={`
      fixed top-0 left-0 w-full h-16
      ${isScrolled ? 'bg-[#141920]/50 backdrop-blur-sm' : 'bg-[#141920]'}
      z-50
      transition-colors duration-300
    `} style={{ borderBottom: '0.5px solid rgb(104, 104, 104)' }}>
      <div className="container mx-auto h-full flex items-center px-4">
        <h1 className="text-xl font-bold">
          <img src="/Notepia-light.svg" alt="Notepia logo" className="h-8" />
        </h1>
        <nav className="ml-auto flex items-center space-x-4">
          <Link
            to="https://github.com/Hal-93/Notepia"
          >
            <FontAwesomeIcon icon={faGithub} className="mr-2 text-white" />
          </Link>
          
          <Link
            to="/demo"
            className="px-3 py-1 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
          >
            デモを試す
          </Link>
          <Link
            to="/start"
            className="px-3 py-1 text-sm font-medium bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors duration-200"
          >
            無料で始める
          </Link>

        </nav>
      </div>
    </header>
  );
}