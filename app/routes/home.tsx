import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import ActionBar from "~/components/actionbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center px-4 pt-6">
        <h1 className="mb-3 text-4xl font-bold">ホーム</h1>
      </header>

      <main className="px-4 pt-6 flex-1 flex flex-col items-center">
        <section className="flex flex-col">
          <h2 className="text-xl font-bold mb-3">マイマップ</h2>
          <Link to="/map">
            <div className="w-full max-w-[80vw] aspect-[3/2] overflow-hidden rounded-xl shadow-md border border-gray-700">
              <img
                className="object-cover w-full h-full"
                src="https://tk.ismcdn.jp/mwimgs/4/6/1200w/img_46d920c8a05067bf52c9e11fa205e8ad356700.jpg"
                alt="My Map"
              />
            </div>
          </Link>
        </section>
      </main>

      <footer className="mt-auto p-4 flex justify-center">
        <Button
          variant="outline"
          className="w-full max-w-[80vw] py-6 flex flex-col items-center text-xl border-white text-white bg-transparent hover:bg-white/10"
        >
          + グループ作成
        </Button>
      </footer>

      <div className="absolute top-6 right-4">
        
        <ActionBar />
      </div>
    </div>
  );
}