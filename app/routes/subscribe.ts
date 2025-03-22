import { ActionFunctionArgs, json } from "@remix-run/node";
import { getUserId } from "~/session.server";
import {
  addSubscription,
  isDeviceSubscribed,
  removeSubscription,
} from "~/models/subscription.server";

export async function action({ request }: ActionFunctionArgs) {
  const userId = (await getUserId(request)) as string;
  const subscriptionData = await request.json();
  const endpoint = subscriptionData.endpoint;
  const p256dh = subscriptionData.keys.p256dh;
  const auth = subscriptionData.keys.auth;

  const isSubscribed = await isDeviceSubscribed(endpoint);

  if (isSubscribed) {
    try {
      await removeSubscription(endpoint);
      return json({ success: true, method: "remove" });
    } catch (error) {
      console.error("Subscription 削除エラー:", error);
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } else {
    try {
      await addSubscription(endpoint, p256dh, auth, userId);
      return json({ success: true, method: "add" });
    } catch (error) {
      console.error("Subscription 保存エラー:", error);
      return json(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }
}
