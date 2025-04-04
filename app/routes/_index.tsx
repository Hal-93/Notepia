import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/home");
  return null;
};

export default function Index() {
  return (
    <div className="h-screen grid md:grid-cols-3">
      {/* 左カラム */}
      <div className="relative bg-cover bg-center md:bg-black flex flex-col justify-end">
        {/* スマホ時だけのグラデーション背景 */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0, 0, 0, 0.85) 100%), url('/backgroundMobile.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* コンテンツ */}
        <nav className="relative flex flex-col items-center justify-center md:h-screen z-10">
          <img
            src="/Notepia-light.svg"
            alt="Notepia"
            className="w-[80vw] md:w-40 h-auto md:mb-40 mb-[300px]"
          />

          <Link to={"/join"}>
            <Button
              variant="ghost"
              className="w-[80vw] md:w-[28vw] bg-white text-black text-md"
            >
              はじめる
            </Button>
          </Link>

          <p className="text-white mt-2 md:mt-4 px-3 md:font-semibold font-bold">
            すでに Notepia のアカウントをお持ちですか？
          </p>
          <p className="text-indigo-700 md:font-semibold font-extrabold mt-0 mb-[80px]">
            <Link to="/login">ログイン</Link>
          </p>
        </nav>
      </div>

      {/* 右カラム */}
      <div
        className="hidden md:block col-span-2 bg-cover bg-center"
        style={{ backgroundImage: "url('/background.jpeg')" }}
      ></div>
    </div>
  );
}
