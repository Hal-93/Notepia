import { json } from "@remix-run/node";
import { ActionFunction } from "@remix-run/node";
import { updateGroupName } from "~/models/group.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const groupId = formData.get("groupId") as string;
  const newName = formData.get("newName") as string;

  if (intent === "rename" && groupId && newName) {
    await updateGroupName(groupId, newName);
    return json({ success: true });
  }

  return json({ success: false }, { status: 400 });
};