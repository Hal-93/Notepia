import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { searchUsersByUuid } from "~/models/user.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const uuid = url.searchParams.get("uuid") || "";

  const users = await searchUsersByUuid(uuid);
  return json({ users });
};