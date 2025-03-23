import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import {
  getAllFollowers,
  getFollowersByTwo,
  sendFollowRequest,
} from "~/models/follow.server";
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
  const following=await getUserById(userId)

  if (!user) {
    return new Response(JSON.stringify({ status: "notfound" }));
  }
  const deplicate = await getFollowersByTwo(userId, user.id);

  if (submitFollow) {
    if (user!.id === userId || deplicate) {
      return json(
        { error: "自分自身をフォローできないか、すでにフォローしています。" },
        { status: 400 }
      );
    }
    const follow = await sendFollowRequest(user.id, userId);
    const subscriptions = await getSubscriptionByUserId(user.id);
    const payload = JSON.stringify({
      title: `${following!.name}さんからのフレンド申請`,
      body: `${following!.name}さんからのフレンド申請が届いています！`,
      icon: "/favicon.ico",
    });
    if (subscriptions) {
      const notifications = subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
        } catch (error) {
          console.error(`通知送信エラー（endpoint: ${sub.endpoint}）:`, error);
          // エラーが発生しても処理を続行
        }
      });

      await Promise.all(notifications); // 全ての通知送信処理が終わるのを待つ
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
