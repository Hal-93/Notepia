import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/map");
  return null;
};

export default function Index() {
  return (
    <div className="h-screen grid md:grid-cols-3">
      {/* 左カラム */}
      <div className="relative bg-cover bg-center md:bg-[#141920] flex flex-col justify-end">
        {/* スマホ時だけのグラデーション背景 */}
        <div
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0, 0, 0, 0.85) 100%), url('/backimage.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* コンテンツ */}
        <nav className="relative flex flex-col items-center md:h-screen md:w-full md:pt-10 z-10 justify-center">
          <img
            src="/Notepia-light.svg"
            alt="Notepia"
            className="w-full px-10 h-[70vh] md:w-90px md:h-[100vh] md:px-[10vw]"
          />

          <Link to={"/join"} className="w-full flex justify-center">
            <Button
              variant="ghost"
              className="w-full md:w-[80%] bg-white text-black text-md mx-10"
            >
              はじめる
            </Button>
          </Link>

          {/*
          <Link to="/auth/google">
            <Button
              variant="outline"
              className="disabled w-[80vw] md:w-[28vw] border border-gray-300 text-black text-md mt-4 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faGoogle} className="mr-2" />
              Googleアカウントで始める
            </Button>
          </Link>
          */}

          <p className="text-white mt-3 md:mt-4 md:font-semibold font-bold">
            または
          </p>
          <p className="text-indigo-700 md:font-semibold font-extrabold mt-0 mb-[80px]">
            <Link to="/login" className="flex items-center justify-center">
              すでにアカウントをお持ちですか？
            </Link>
          </p>
        </nav>
      </div>


      {/* 右カラム */}
      <div
        className="hidden md:block col-span-2 bg-cover bg-center"
        style={{ backgroundImage: "url('/backimage.png')" }}
      ></div>
    </div>
  );
}
