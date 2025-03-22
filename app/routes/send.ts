import { ActionFunctionArgs } from "@remix-run/node";
import webPush from "web-push";
import { getSubscriptions } from "~/models/subscription.server";

webPush.setVapidDetails(
  "mailto:contact@cyberhub.jp",
  process.env.VITE_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function action({ request }: ActionFunctionArgs) {
  const subscriptions = await getSubscriptions();

  const payload = JSON.stringify({
    title: "新しい通知",
    body: "テスト",
    icon: "/favicon.ico",
  });

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
  return null;
}
