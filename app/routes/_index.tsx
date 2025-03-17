import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react"
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [
    { title: "Notepia" },
    { name: "description", content: "Welcome to Notepia" },
  ];
};

export default function Index() {
  return (
<div
      className="flex h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('https://moocs.cyberhub.jp/images/chub.png')" }}
    >
      <div className="flex flex-col items-center gap-12 bg-white/60 dark:bg-black/40 p-8 rounded-xl shadow-lg max-w-md">
        <header className="flex flex-col items-center gap-6">
          <div className="h-[144px] w-[434px]">
            <img
              src="/notepia.png"
              alt="notepia"
              className="block w-full dark:hidden"
            />
          </div>
        </header>

        <nav className="flex flex-col items-center gap-4">
          <Link to="/login">
            <Button variant="default" className="w-64 py-4 text-lg">
              はじめる
            </Button>
          </Link>

          <p className="text-gray-700 dark:text-gray-200 text-center">
            すでに Notepia アカウントをお持ちですか？
          </p>

          <p className="text-indigo-700 font-semibold">
            <Link to="/login">ログイン</Link>
          </p>
        </nav>
      </div>
    </div>
  );
}
