import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { completeMemo, deleteMemo, uncompleteMemo } from "~/models/memo.server"; // サーバー専用OK

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const memoId = formData.get("memoId") as string;

  if (!memoId) {
    throw new Response("memoId is required", { status: 400 });
  }

  if (intent === "complete") {
    await completeMemo(memoId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return json({ success: true, completed: true });
  }

  if (intent === "uncomplete") {
    await uncompleteMemo(memoId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return json({ success: true, uncompleted: true });
  }

  if (intent === "delete") {
    await deleteMemo(memoId);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return json({ success: true, deletedMemoId: memoId });
  }

  return json({});
};

export default function DetailActionRoute() {
  return null;
}