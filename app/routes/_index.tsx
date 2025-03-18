import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [
    { title: "Notepia" },
    { name: "description", content: "Welcome to Notepia" },
  ];
};

export default function Index() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <img
        src="/background.jpeg"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover blur-sm"
      />
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">

        <img src="/notepia.png" alt="Notepia"/><br/>

        <nav className="flex flex-col items-center gap-4">
          <Link to="/login">
            <Button variant="default" className="w-64 py-4 text-lg">
              はじめる
            </Button>
          </Link>

          <p className="text-white text-center">
            すでに Notepia アカウントをお持ちですか？
          </p>
          <p className="text-indigo-300 font-semibold">
            <Link to="/login">ログイン</Link>
          </p>
        </nav>
      </div>
    </div>
  );
}