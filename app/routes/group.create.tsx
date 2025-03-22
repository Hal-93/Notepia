import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { getUserId } from "~/session.server";
import { createGroup } from "~/models/group.server";

export const action: ActionFunction = async ({ request }) => {
    const userId = await getUserId(request);
  
    if (!userId) {
      throw new Response("認証されていません", { status: 401 });
    }
  
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const userIds = JSON.parse(formData.get("userIds") as string) as string[];
  
    const group = await createGroup(name, [userId, ...userIds]);
  
    return json({ group });
  };