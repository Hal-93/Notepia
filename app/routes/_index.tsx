import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { getUserId } from "~/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Notepia" },
    { name: "description", content: "Welcome to Notepia" },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  return json({ isLoggedIn: Boolean(userId)})
}

export default function Index() {
  const { isLoggedIn } = useLoaderData<{ isLoggedIn: boolean}>();
  
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
          <Link to={isLoggedIn ? "/map" : "/login"}>
            <Button variant="ghost" className="w-96 py-4 text-md bg-white text-black">
              はじめる
            </Button>
          </Link>

          <p className="text-white text-center">
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