import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { updateUserRoleInGroup } from "~/models/group.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const body = await request.json();
  const { groupId, targetUserId, newRole } = body as {
    groupId: string;
    targetUserId: string;
    newRole: string;
  };

  if (typeof groupId !== "string" || typeof targetUserId !== "string" || typeof newRole !== "string") {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await updateUserRoleInGroup(groupId, userId, targetUserId, newRole as any);
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 403 });
  }
};