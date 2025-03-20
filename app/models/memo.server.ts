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

// グループのメモを全て取得する関数
export async function getMemosByGroup(groupId: string): Promise<Memo[]> {
  return await prisma.memo.findMany({
    where: {
      groupId: groupId,
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
  content: string;
  createdById: string;
  groupId?: string;
  latitude?: number;
  longitude?: number;
}): Promise<Memo> {
  return await prisma.memo.create({
    data: {
      content: data.content,
      createdById: data.createdById,
      groupId: data.groupId ? data.groupId : null,
      latitude: data.latitude,
      longitude: data.longitude,
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