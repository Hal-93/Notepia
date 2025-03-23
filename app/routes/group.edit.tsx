import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { addUserToGroup, updateGroupName } from "~/models/group.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const groupId = formData.get("groupId") as string;

  if (!groupId) {
    return json({ error: "groupId is required" }, { status: 400 });
  }

  if (intent === "rename") {
    const newName = formData.get("newName") as string;
    if (!newName) {
      return json({ error: "グループ名が必要です" }, { status: 400 });
    }
    await updateGroupName(groupId, newName);
    return json({ success: true });
  }

  
  if (intent === "addUsers") {
    const userIds = JSON.parse(formData.get("userIds") as string) as string[];

    for (const userId of userIds) {
      await addUserToGroup(groupId, userId);
    }

    return json({ success: true });
  }

  if (intent === "updateGroup") {
    const newName = formData.get("newName") as string;
    const userIds = JSON.parse(formData.get("userIds") as string) as string[];
  
    if (!newName) {
      return json({ error: "グループ名が必要です" }, { status: 400 });
    }
  
    await updateGroupName(groupId, newName);
  
    for (const userId of userIds) {
      await addUserToGroup(groupId, userId);
    }
  
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
};