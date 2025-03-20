import { prisma } from "~/db.server";
import type { Group } from "@prisma/client";

// グループを作成する関数
// 初期ユーザーIDの配列を渡すと、そのユーザーをグループに追加
export async function createGroup(
  name: string,
  userIds?: string[]
): Promise<Group> {
  return await prisma.group.create({
    data: {
      name,
      users: userIds ? { connect: userIds.map((id) => ({ id })) } : undefined,
    },
  });
}

// グループにユーザーを追加する関数
export async function addUserToGroup(
  groupId: string,
  userId: string
): Promise<Group> {
  return await prisma.group.update({
    where: { id: groupId },
    data: {
      users: {
        connect: { id: userId },
      },
    },
  });
}

// グループからユーザー削除する関数
export async function removeUserFromGroup(
  groupId: string,
  userId: string
): Promise<Group> {
  return await prisma.group.update({
    where: { id: groupId },
    data: {
      users: {
        disconnect: { id: userId },
      },
    },
  });
}

// グループを削除する関数
export async function deleteGroup(groupId: string): Promise<Group> {
  return await prisma.group.delete({
    where: { id: groupId },
  });
}


// グループ名を変更する関数
export async function updateGroupName(
  groupId: string,
  newName: string
): Promise<Group> {
  return await prisma.group.update({
    where: { id: groupId },
    data: { name: newName },
  });
}