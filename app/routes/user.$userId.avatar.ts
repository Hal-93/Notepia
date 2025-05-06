import { LoaderFunction } from "@remix-run/node";
import { getFile } from "~/utils/minio.server";
import sharp from "sharp";

export const loader: LoaderFunction = async ({ params, request }) => {
  const { userId } = params;
  const url = new URL(request.url);
  const height = url.searchParams.get("h");
  try {
    const fileBuffer = await getFile(`${userId}.png`);
    let image = sharp(fileBuffer);

    if (height) {
      image = image.resize({
        height: height ? parseInt(height, 10) : undefined,
        fit: "inside",
      });
    }

    const resizedBuffer = await image.toBuffer();
    return new Response(resizedBuffer, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    return new Response("404 Not Found", { status: 404 });
  }
};
