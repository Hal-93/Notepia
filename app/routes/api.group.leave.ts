import { ActionFunction, json } from "@remix-run/node";
import { removeUserFromGroup } from "~/models/group.server";
import { getUserId } from "~/session.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (!userId) throw new Response("認証されていません", { status: 401 });

  if (intent === "leaveGroup") {
    const groupId = formData.get("groupId") as string;
    await removeUserFromGroup(groupId, userId);
    return json({ success: true });
  }
  return null;
};
