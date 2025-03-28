import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { completeMemo, deleteMemo } from "~/models/memo.server"; // サーバー専用OK

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const memoId = formData.get("memoId") as string;

  if (!memoId) {
    throw new Response("memoId is required", { status: 400 });
  }

  if (intent === "complete") {
    await completeMemo(memoId);
    return json({ success: true, completed: true });
  }

  if (intent === "delete") {
    await deleteMemo(memoId);
    return json({ success: true, deletedMemoId: memoId });
  }

  return json({});
};

export default function DetailActionRoute() {
  return null;
}