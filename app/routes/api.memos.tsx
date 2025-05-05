import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { completeMemo, deleteMemo } from "~/models/memo.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const memoId = formData.get("memoId");
  const actionType = formData.get("action");

  if (typeof memoId !== "string" || typeof actionType !== "string") {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  try {
    if (actionType === "complete") {
      await completeMemo(memoId);
    } else if (actionType === "delete") {
      await deleteMemo(memoId);
    } else {
      return json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return json({ error: (error as Error).message || "Server error" }, { status: 500 });
  }

  return json({ success: true });
};
