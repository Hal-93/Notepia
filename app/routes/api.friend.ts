import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { getSubscriptionByUserId } from "~/models/subscription.server";
import { getUserById, getUserByUuid } from "~/models/user.server";
import { getUserId } from "~/session.server";
import webPush from "web-push";
import {
  acceptFriendRequestById,
  getAllFriend,
  getAllFriendRequests,
  rejectFriendRequestById,
  sendFriendRequest,
} from "~/models/friend.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const toUUID = formData.get("toUUID") as string;
  const fromId = formData.get("fromId") as string;
  const toUser = await getUserByUuid(toUUID);
  const fromUser = await getUserById(fromId);

  const actionType = formData.get("_action");

  if (!toUser || toUser!.id === fromId) {
    return new Response(JSON.stringify({ status: "notfound" }));
  }

  switch (actionType) {
    case "submitFriend": {
      if (toUser!.id === fromId) {
        return json(
          { error: "自分自身をフォローできないか、すでにフォローしています。" },
          { status: 400 }
        );
      }
      const follow = await sendFriendRequest(fromId, toUser.id);
      if (follow.status === "PENDING") {
        const subscriptions = await getSubscriptionByUserId(toUser.id);
        const payload = JSON.stringify({
          title: `${fromUser!.name}さんからのフレンド申請`,
          body: `${fromUser!.name}さんからのフレンド申請が届いています！`,
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
              console.error(
                `通知送信エラー（endpoint: ${sub.endpoint}）:`,
                error
              );
              // エラーが発生しても処理を続行
            }
          });

          await Promise.all(notifications); // 全ての通知送信処理が終わるのを待つ
        }
      }

      return new Response(
        JSON.stringify({
          username: toUser.name,
          uuid: toUser.uuid,
          avatar: toUser.avatar,
          status: follow.status,
        })
      );
    }

    case "rejectFriend": {
      return await rejectFriendRequestById(fromId, toUser.id);
    }

    case "acceptFriend": {
      return await acceptFriendRequestById(fromId, toUser.id);
    }

    default:
      return new Response(
        JSON.stringify({
          username: toUser.name,
          uuid: toUser.uuid,
          avatar: toUser.avatar,
        })
      );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) return null;
  const frineds = await getAllFriend(userId);
  const friendRequests = await getAllFriendRequests(userId);

  const users = await Promise.all(
    frineds.map(async (frined) => {
      const user = await getUserById(frined.toId);
      return {
        username: user!.name,
        uuid: user!.uuid,
        avatar: user!.avatar,
      };
    })
  );
  const requests = await Promise.all(
    friendRequests.map(async (frined) => {
      const user = await getUserById(frined.fromId);
      return {
        username: user!.name,
        uuid: user!.uuid,
        avatar: user!.avatar,
        id: frined.id,
        fromId: user?.id,
      };
    })
  );

  return new Response(JSON.stringify({ users, requests }));
}
