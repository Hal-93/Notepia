import { ActionFunctionArgs } from "@remix-run/node";
import { isDeviceSubscribed } from "~/models/subscription.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const endpoint = formData.get("endpoint") as string;

  const isSubscribed = await isDeviceSubscribed(endpoint);
  return new Response(JSON.stringify({ isSubscribed }));
}
