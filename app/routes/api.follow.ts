import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { getAllFollowers, sendFollowRequest } from "~/models/follow.server";
import { getSubscriptionByUserId } from "~/models/subscription.server";
import { getUserById, getUserByUuid } from "~/models/user.server";
import { getUserId } from "~/session.server";
import webPush from "web-push";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submitFollow = formData.get("submitFollow");
  const followingId = formData.get("followingId") as string;
  const userId = formData.get("userId") as string;
  const user = await getUserByUuid(followingId);
  const followers = await getAllFollowers(userId);

  const deplicate = hasDuplicates(followers);
  if (!user) {
    return new Response(JSON.stringify({ status: "notfound" }));
  }
  if (submitFollow) {
    if (user!.id === userId || deplicate) return;
    const follow = await sendFollowRequest(userId, user.id);
    const subscriptions = await getSubscriptionByUserId(userId);
    const payload = JSON.stringify({
      title: `${user.name}さんからのフレンド申請`,
      body: "${user.name}さんからのフレンド申請が届いています！",
      icon: "/favicon.ico",
    });
    if (subscriptions) {
      const notifications = subscriptions.map((sub) =>
        webPush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          .catch((error) => {
            console.error("通知送信エラー:", error);
          })
      );
      await Promise.all(notifications);
    }

    return new Response(
      JSON.stringify({
        username: user.name,
        uuid: user.uuid,
        avatar: user.avatar,
        status: follow.status,
      })
    );
  }
  return new Response(
    JSON.stringify({
      username: user.name,
      uuid: user.uuid,
      avatar: user.avatar,
    })
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return null;
  const followers = await getAllFollowers(userId);

  const users = await Promise.all(
    followers.map(async (follower) => {
      const user = await getUserById(follower.followerId);
      return {
        username: user!.name,
        uuid: user!.uuid,
        avatar: user!.avatar, // `null` の可能性がある場合、そのまま返す
      };
    })
  );
  return new Response(JSON.stringify({ users }));
}

const hasDuplicates = (
  followers: {
    id: string;
    createdAt: Date;
    followerId: string;
    followingId: string;
    status: string;
  }[]
): boolean => {
  const seen = new Set();

  for (const follower of followers) {
    // `followerId` と `followingId` の組み合わせで重複を確認
    const key = `${follower.followerId}-${follower.followingId}`;

    if (seen.has(key)) {
      return true; // 重複がある場合は `true` を返す
    }

    seen.add(key);
  }

  return false; // 重複がない場合は `false` を返す
};
