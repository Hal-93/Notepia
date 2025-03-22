import { prisma } from "~/db.server";
import type { Memo } from "@prisma/client";

// 全てのメモを取得する関数
export async function getAllMemos(): Promise<Memo[]> {
  return await prisma.memo.findMany();
}

// ユーザーが作成したメモを全て取得する関数
export async function getMemosByUser(userId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: { createdById: userId },
  });
}

// ユーザー個人メモを全て取得する関数
export async function getUsersMemo(userId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: {
      createdById: userId,
      groupId: null,
    },
  });
}

// ユーザーの完了していない個人メモを全て取得する関数
export async function getNotCompletedUsersMemo(userId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: {
      createdById: userId,
      groupId: null,
      completed: false,
    },
  });
}

// グループのメモを全て取得する関数
export async function getMemosByGroup(groupId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: {
      groupId: groupId,
    },
  });
}

// グループの完了していないメモを全て取得する関数
export async function getNotCompletedMemosByGroup(groupId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: {
      groupId: groupId,
      completed: false,
    },
  });
}



// 特定のメモを取得する関数
export async function getMemoById(memoId: string): Promise<Memo | null> {
  return await prisma.memo.findUnique({
    where: {
      id: memoId,
    },
  });
}

// メモを作成する関数
export async function createMemo(data: {
  title: string;
  content: string;
  place: string;
  createdById: string;
  groupId?: string;
  latitude?: number;
  longitude?: number;
  color: string;
}): Promise<Memo> {
  return await prisma.memo.create({
    data: {
      title: data.title,
      content: data.content,
      place: data.place,
      createdBy: { connect: { id: data.createdById } },
      group: data.groupId ? { connect: { id: data.groupId } } : undefined,
      latitude: data.latitude,
      longitude: data.longitude,
      color: data.color,
    },
  });
}

// メモを削除する関数
export async function deleteMemo(memoId: string): Promise<Memo> {
  return await prisma.memo.delete({
    where: { id: memoId },
  });
}

// メモを更新する関数
export async function updateMemo(
  memoId: string,
  data: { content?: string; completed?: boolean; latitude?: number; longitude?: number }
): Promise<Memo> {
  return await prisma.memo.update({
    where: { id: memoId },
    data,
  });
}

// ユーザーの完了したメモ一覧を取得する関数
export async function getCompletedMemosByUser(userId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: {
      createdById: userId,
      completed: true,
    },
  });
}

// メモを完了にする関数
export async function completeMemo(memoId: string): Promise<Memo> {
  return await prisma.memo.update({
    where: { id: memoId },
    data: { completed: true },
  });
}