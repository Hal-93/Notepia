import { prisma } from "~/db.server";
import type { Group, User } from "@prisma/client";

// ユーザーが所属しているグループ一覧を取得する関数
export async function getUserGroups(userId: string): Promise<(Group & { users: User[] })[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { groups: { include: { users: true } } },
  });
  return user?.groups || [];
}

// グループに所属しているユーザー一覧を表示する関数
export async function getUsersByGroup(groupId: string): Promise<User[]> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { users: true },
  });
  return group?.users || [];
}

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