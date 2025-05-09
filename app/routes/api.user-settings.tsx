import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserId, requireUserId } from "~/session.server";
import {
  getUserTheme,
  getUserBar,
  updateUserTheme,
  updateUserBar,
  getUserTutorial,
  updateUserTutorial,
  getUserMap,
  updateUserMap,
} from "~/models/user.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const theme = await getUserTheme(userId);
  const bar = await getUserBar(userId);
  const tutorial = await getUserTutorial(userId);
  const map = await getUserMap(userId);
  return json({ theme, bar, tutorial, map });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  let body: Record<string, any> = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(formData) as Record<string, any>;
  }
  const { theme, bar, tutorial, map } = body as {
    theme?: string;
    bar?: "left" | "right" | "bottom";
    tutorial?: string;
    map?: string;
  };
  const responseData: { theme?: string; bar?: string; tutorial?: string; map?: string } = {};

  if (typeof theme === "string") {
    await updateUserTheme(userId, theme);
    responseData.theme = theme;
  }
  if (typeof bar === "string") {
    await updateUserBar(userId, bar);
    responseData.bar = bar;
  }
  if (typeof tutorial === "string") {
    await updateUserTutorial(userId, tutorial);
    responseData.tutorial = tutorial;
  }
  if (typeof map === "string") {
    await updateUserMap(userId, map);
    responseData.map = map;
  }

  return json(responseData);
};

export type UserSettingsResponse = {
  theme: string | null;
  bar: "left" | "right" | "bottom" | null;
  tutorial: string | null;
  map: string | null;
};