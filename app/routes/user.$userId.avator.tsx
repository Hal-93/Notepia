import { LoaderFunction } from "@remix-run/node";
import { getFile } from "~/utils/minio.server";

export const loader: LoaderFunction = async ({ params }) => {
  const { userId } = params;
  try {
    const fileBuffer = await getFile(`${userId}.png`);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    return new Response("404 Not Found", { status: 404 });
  }
};
