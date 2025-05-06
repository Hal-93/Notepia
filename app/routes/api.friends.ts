import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { getAllFriend } from "~/models/friend.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const friends = await getAllFriend(userId);
  const friendIds = friends.map((f) => f.toId);
  return json({ friendIds });
};