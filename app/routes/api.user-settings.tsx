

import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserId, requireUserId } from "~/session.server";
import {
  getUserTheme,
  getUserBar,
  updateUserTheme,
  updateUserBar,
} from "~/models/user.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const theme = await getUserTheme(userId);
  const bar = await getUserBar(userId);
  return json({ theme, bar });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const body = await request.json();
  const { theme, bar } = body as {
    theme?: string;
    bar?: "left" | "right" | "bottom";
  };
  const responseData: { theme?: string; bar?: string } = {};

  if (typeof theme === "string") {
    await updateUserTheme(userId, theme);
    responseData.theme = theme;
  }
  if (typeof bar === "string") {
    await updateUserBar(userId, bar);
    responseData.bar = bar;
  }

  return json(responseData);
};

export type UserSettingsResponse = {
  theme: string | null;
  bar: "left" | "right" | "bottom" | null;
};