import { LoaderFunction } from "@remix-run/node";
import { getFile } from "~/minio.server";

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
    return new Response("Not Found", { status: 404 });
  }
};
