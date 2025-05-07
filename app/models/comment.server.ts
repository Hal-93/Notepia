import { prisma } from "~/db.server";
import type { Comment as CommentModel, User } from "@prisma/client";

// メモにコメントを追加
export async function createComment(
  memoId: string,
  authorId: string,
  content: string
): Promise<CommentModel & { author: User }> {
  const colors = [
    "#ffffff",
    "#ffcccc",
    "#ffe8cc",
    "#ffffcc",
    "#ccffcc",
    "#ccffff",
    "#ccccff",
    "#f3f3f3",
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return prisma.comment.create({
    data: {
      memoId,
      authorId,
      content,
      color,
    },
    include: {
      author: true,
    },
  });
}

// メモに紐づくコメントを取得
export async function getCommentsByMemo(
  memoId: string
): Promise<(CommentModel & { author: User })[]> {
  return prisma.comment.findMany({
    where: { memoId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}

// コメント内容を更新
export async function updateComment(
  commentId: string,
  content: string
): Promise<CommentModel> {
  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
}

// コメントを削除
export async function deleteComment(
  commentId: string
): Promise<CommentModel> {
  return prisma.comment.delete({
    where: { id: commentId },
  });
}
