import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";

import "./tailwind.css";
import "~/popup.css"
import { useEffect } from "react";
import { registerServiceWorker } from "./utils/pushNotification";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "manifest", href: "/manifest.json" },
];

export const meta: MetaFunction = () => {
  return [
    { property: "og:title", content: "Notepia" },
    { property: "og:description", content: "A memo app that lets you pin notes to locations on a map." },
    { property: "og:image", content: "https://notepia.fly.dev/Notepia_url.jpg" },
    { property: "og:url", content: "https://notepia.fly.dev" },
    { property: "og:type", content: "website" },
  ];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return <Outlet />;
}
