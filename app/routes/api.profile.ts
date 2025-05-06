import { ActionFunction, json } from "@remix-run/node";
import sharp from "sharp";
import { updateUserAvatar, updateUserName } from "~/models/user.server";
import { getUserId } from "~/session.server";
import { uploadFile } from "~/utils/minio.server";

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const uuid = formData.get("uuid") as string;
  const username = formData.get("username") as string;
  if (username && file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      updateUserName(userId!, username);
      const pngBuffer = await sharp(buffer).webp().toBuffer();
      const metadata = { "Content-Type": "image/webp" };
      await uploadFile(pngBuffer, `${uuid}.webp`, metadata);
      await updateUserAvatar(userId!, `/user/${uuid}/avatar`);
      return json(
        { message: "更新しました。", updatedAvatar: true },
        { status: 200 }
      );
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }
  if (username) {
    try {
      updateUserName(userId!, username);
      return json(
        { message: "更新しました。", updatedAvatar: false },
        { status: 200 }
      );
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }

  if (file) {
    if (!userId) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const pngBuffer = await sharp(buffer).webp().toBuffer();
      const metadata = { "Content-Type": "image/webp" };
      await uploadFile(pngBuffer, `${uuid}.webp`, metadata);
      await updateUserAvatar(userId, `/user/${uuid}/avatar`);

      return json(
        { message: "アイコンをアップロードしました。", updatedAvatar: true },
        { status: 200 }
      );
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }
};
