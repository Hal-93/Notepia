import { prisma } from "~/db.server";
import type { Friend } from "@prisma/client";

// フォローリクエスト送信関数
// フォロワー (followerId) が、フォロー対象 (followingId) に対してフォローリクエストを送信
export async function sendFriendRequest(
  fromId: string,
  toId: string
): Promise<Friend> {
  const request = await prisma.friend.findUnique({
    where: {
      fromId_toId: {
        fromId: toId,
        toId: fromId,
      },
    },
  });
  if (request) {
    return await acceptFriendRequestById(fromId, toId);
  } else {
    return await prisma.friend.create({
      data: {
        fromId,
        toId,
        status: "PENDING",
      },
    });
  }
}

// フォローリクエスト承認関数
// 指定したフォローリクエストのIDを受け取り、そのステータスを ACCEPTED に更新
export async function acceptFriendRequestById(
  fromId: string,
  toId: string
): Promise<Friend> {
  const updatedFriend = await prisma.friend.update({
    where: {
      fromId_toId: {
        fromId,
        toId,
      },
    },
    data: { status: "ACCEPTED" },
  });

  await prisma.friend.create({
    data: {
      fromId:toId,
      toId:fromId,
      status: "ACCEPTED",
    },
  });

  return updatedFriend;
}

// フォローリクエスト拒否関数
// 指定したフォローリクエストのIDを受け取り、そのステータスを REJECTED に更新
export async function rejectFriendRequestById(
  fromId: string,
  toId: string
): Promise<Friend> {
  return await prisma.friend.update({
    where: {
      fromId_toId: {
        fromId: fromId,
        toId: toId,
      },
    },
    data: { status: "REJECTED" },
  });
}

// フォロー解除関数
export async function removeFriend(
  fromId: string,
  toId: string
): Promise<void> {
  const friendRecords = await prisma.friend.findMany({
    where: {
      OR: [
        { fromId, toId },
        { fromId: toId, toId: fromId },
      ],
    },
  });

  if (friendRecords.length === 0) {
    throw new Error("フレンドが存在しません");
  }

  // まとめて削除
  await Promise.all(
    friendRecords.map((friend) =>
      prisma.friend.delete({ where: { id: friend.id } })
    )
  );
}

// フレンド一覧取得関数
export async function getAllFriend(userId: string): Promise<Friend[]> {
  return await prisma.friend.findMany({
    where: {
      fromId: userId,
      status: "ACCEPTED",
    },
  });
}

// フレンド一覧取得関数
export async function getAllFriendWithPend(userId: string): Promise<Friend[]> {
  return await prisma.friend.findMany({
    where: {
      fromId: userId,
    },
  });
}

// 保留中のフォローリクエスト取得関数
export async function getAllFriendRequests(userId: string): Promise<Friend[]> {
  return await prisma.friend.findMany({
    where: {
      toId: userId,
      status: "PENDING",
    },
  });
}

// すでにフレンドかどうかを確認する関数
export async function isFriend(userId: string, otherId: string): Promise<boolean> {
  const record = await prisma.friend.findFirst({
    where: {
      OR: [
        { fromId: userId, toId: otherId, status: "ACCEPTED" },
        { fromId: otherId, toId: userId, status: "ACCEPTED" },
      ],
    },
  });
  return record !== null;
}
