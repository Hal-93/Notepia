import { prisma } from "~/db.server";
import { Role, type Group, type User, type GroupMember } from "@prisma/client";

// ユーザーが所属しているグループ一覧を取得する関数
export async function getUserGroups(
  userId: string
): Promise<(Group & { role: Role })[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });
  return memberships.map((m) => ({ ...m.group, role: m.role }));
}

// グループに所属しているユーザー一覧を表示する関数
export async function getUsersByGroup(
  groupId: string
): Promise<(User & { role: Role })[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
  });
  return memberships.map((m) => ({ ...m.user, role: m.role }));
}

// グループを作成する関数
export async function createGroup(
  name: string,
  creatorId: string,
  userIds?: string[]
): Promise<Group> {
  const participantIds = Array.from(
    new Set([creatorId, ...(userIds ?? []).filter((id) => id !== creatorId)])
  );
  return prisma.group.create({
    data: {
      name,
      ownerId: creatorId,
      memberships: {
        create: participantIds.map((id) => ({
          userId: id,
          role: id === creatorId ? Role.OWNER : Role.VIEWER,
        })),
      },
    },
  });
}

// グループにユーザーを追加する関数
export async function addUserToGroup(
  groupId: string,
  userId: string
): Promise<GroupMember> {
  // Enforce maximum of 5 groups per user
  const count = await prisma.groupMember.count({ where: { userId } });
  if (count >= 5) {
    throw new Error("最大グループ参加可能数を超えています");
  }
  return prisma.groupMember.create({
    data: { groupId, userId, role: Role.VIEWER },
  });
}

// グループからユーザー削除する関数
export async function removeUserFromGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return;
  if (group.ownerId === userId) {
    // If owner leaves, delete the whole group
    await prisma.group.delete({ where: { id: groupId } });
  } else {
    // Else just remove membership
    await prisma.groupMember.deleteMany({
      where: { groupId, userId },
    });
  }
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

// 指定したユーザーのそのグループでの権限を取得する関数
export async function getUserRole(
  groupId: string,
  userId: string
): Promise<Role | null> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });
  return membership?.role ?? null;
}

// グループ内のユーザー権限を変更する関数
// 呼び出し元ユーザー（actorId）が OWNER または ADMIN でない場合はエラー
export async function updateUserRoleInGroup(
  groupId: string,
  actorId: string,
  targetUserId: string,
  newRole: Role
): Promise<GroupMember> {
  const actorMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: actorId,
        groupId,
      },
    },
  });
  if (!actorMembership) {
    throw new Error("許可がありません: グループに参加していません");
  }
  if (
    actorMembership.role !== Role.OWNER &&
    actorMembership.role !== Role.ADMIN
  ) {
    throw new Error(
      "許可がありません: 権限変更は Owner または Admin のみ可能です"
    );
  }

  const targetMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: targetUserId,
        groupId,
      },
    },
  });
  if (!targetMembership) {
    throw new Error("指定したユーザーはこのグループに参加していません");
  }

  if (actorMembership.role === Role.ADMIN) {
    if (
      targetMembership.role === Role.OWNER ||
      targetMembership.role === Role.ADMIN
    ) {
      throw new Error(
        "許可がありません: Adminは他のAdminまたはOwnerの権限を変更できません"
      );
    }
    if (newRole !== Role.EDITOR && newRole !== Role.VIEWER) {
      throw new Error(
        "許可がありません: AdminはEditorまたはViewerへの変更のみ可能です"
      );
    }
  }

  return await prisma.groupMember.update({
    where: {
      userId_groupId: {
        userId: targetUserId,
        groupId,
      },
    },
    data: {
      role: newRole,
    },
  });
}

// グループ名取得関数
export async function getGroupName(groupId: string) {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
    },
  });
  if (group) {
    return group.name;
  } else {
    return null;
  }
}

// グループに含まれているか確認する関数
export async function checkIsInGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  const group = await prisma.group.findFirst({
    where: {
      id: groupId,
      memberships: {
        some: {
          userId: userId,
        },
      },
    },
  });
  return group !== null;
}

export async function getGroupsAndMemberShips(userId: string) {
  return await prisma.group.findMany({
    where: {
      memberships: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      memberships: true,
    },
  });
}
