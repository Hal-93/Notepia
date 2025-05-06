import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { updateUserRoleInGroup, removeUserFromGroup } from "~/models/group.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const body = await request.json();
  const { groupId, targetUserId, newRole, intent } = body as {
    groupId: string;
    targetUserId: string;
    newRole?: string;
    intent?: "updateRole" | "kick";
  };

  if (
    typeof groupId !== "string" ||
    typeof targetUserId !== "string" ||
    (intent !== "kick" && intent !== "updateRole" && intent !== undefined)
  ) {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  if (intent === "updateRole" || intent === undefined) {
    if (typeof newRole !== "string") {
      return json({ error: "newRole is required for update" }, { status: 400 });
    }
  }

  try {
    if (intent === "kick") {
      await removeUserFromGroup(groupId, targetUserId);
    } else {
      await updateUserRoleInGroup(groupId, userId, targetUserId, newRole as any);
    }
    return json({ success: true });
  } catch (error: any) {
    return json({ error: error.message }, { status: 403 });
  }
};