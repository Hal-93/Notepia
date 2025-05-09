import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserGroupCount } from "~/models/group.server";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return json({ error: "Missing userId" }, { status: 400 });
  }
  try {
    const count = await getUserGroupCount(userId);
    return json({ count });
  } catch (error) {
    return json({ error: "Failed to retrieve group count" }, { status: 500 });
  }
};