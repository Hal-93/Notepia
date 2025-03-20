import { prisma } from "~/db.server";
import type { Follow } from "@prisma/client";

// フォローリクエスト送信関数
// フォロワー (followerId) が、フォロー対象 (followingId) に対してフォローリクエストを送信
export async function sendFollowRequest(
  followerId: string,
  followingId: string
): Promise<Follow> {
  return await prisma.follow.create({
    data: {
      followerId,
      followingId,
      status: "PENDING",
    },
  });
}

// フォローリクエスト承認関数
// 指定したフォローリクエストのIDを受け取り、そのステータスを ACCEPTED に更新
export async function acceptFollowRequestById(
  followId: string
): Promise<Follow> {
  return await prisma.follow.update({
    where: { id: followId },
    data: { status: "ACCEPTED" },
  });
}

// フォローリクエスト拒否関数
// 指定したフォローリクエストのIDを受け取り、そのステータスを REJECTED に更新
export async function rejectFollowRequestById(
  followId: string
): Promise<Follow> {
  return await prisma.follow.update({
    where: { id: followId },
    data: { status: "REJECTED" },
  });
}

// フォロー解除関数
export async function unfollow(
  followerId: string,
  followingId: string
): Promise<Follow> {
  const followRecord = await prisma.follow.findFirst({
    where: { followerId, followingId },
  });
  if (!followRecord) {
    throw new Error("フォローしていません");
  }
  return await prisma.follow.delete({
    where: { id: followRecord.id },
  });
}

// フォロワー削除関数
// 自分のフォロワーリストから特定のフォロワーを削除
export async function removeFollower(
    followingId: string,
    followerId: string
  ): Promise<Follow> {
    const followers = await getFollowers(followingId);
    const followRecord = followers.find((f) => f.followerId === followerId);
    if (!followRecord) {
      throw new Error("フォローされていません");
    }
    return await prisma.follow.delete({
      where: { id: followRecord.id },
    });
}

// フォロー中一覧取得関数
export async function getFollowing(userId: string): Promise<Follow[]> {
  return await prisma.follow.findMany({
    where: {
      followerId: userId,
      status: "ACCEPTED",
    },
  });
}

// フォロワー一覧取得関数
export async function getFollowers(userId: string): Promise<Follow[]> {
  return await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: "ACCEPTED",
    },
  });
}

// 保留中のフォローリクエスト取得関数
export async function getPendingFollowRequests(
  userId: string
): Promise<Follow[]> {
  return await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: "PENDING",
    },
  });
}