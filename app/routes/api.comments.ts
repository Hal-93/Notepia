import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { createComment, getCommentsByMemo, deleteComment } from "~/models/comment.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const memoId = url.searchParams.get("memoId");
  if (!memoId) {
    return json({ comments: [] });
  }
  const comments = await getCommentsByMemo(memoId);
  return json({ comments });
};

export const action: ActionFunction = async ({ request }) => {
  if (request.method === "DELETE") {
    const { commentId } = await request.json();
    if (typeof commentId !== "string") {
      return json({ error: "Invalid payload" }, { status: 400 });
    }
    await deleteComment(commentId);
    return json({ success: true });
  }
  const authorId = await requireUserId(request);
  const { memoId, content } = await request.json();
  if (typeof memoId !== "string" || typeof content !== "string") {
    return json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    const comment = await createComment(memoId, authorId, content);
    return json({ comment });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};