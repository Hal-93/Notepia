import { useState } from "react";
import {
  Link,
  redirect,
  json,
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import ActionBar from "~/components/actionbar";
import { getUserId } from "~/session.server";
import { getUserById, updateUserAvatar } from "~/models/user.server";
import {
  createGroup,
  getUserGroups,
  removeUserFromGroup,
  deleteGroup,
  getUsersByGroup,
} from "~/models/group.server";
import GroupCreateModal from "~/components/group/create";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import GroupEditModal from "~/components/group/edit";
import { uploadFile } from "~/utils/minio.server";
import sharp from "sharp";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const { getUsersMemo } = await import("~/models/memo.server");
  const memos = await getUsersMemo(userId);

  const user = await getUserById(userId);
  const groups = await getUserGroups(userId);

  const groupsWithUsers = await Promise.all(
    groups.map(async (group) => ({
      ...group,
      users: await getUsersByGroup(group.id),
    }))
  );

  return json({
    userId,
    username: user?.name,
    uuid: user?.uuid,
    avatarUrl: user?.avatar || null,
    memos,
    groups: groupsWithUsers,
    mapboxToken: process.env.MAPBOX_TOKEN,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const file = formData.get("file") as File;
    const uuid = formData.get("uuid") as string;
    if (file) {
      const userId = (await getUserId(request)) as string;
      if (!userId) {
        return json({ error: "エラーが発生しました。" }, { status: 500 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const pngBuffer = await sharp(buffer).png().toBuffer();
        const metadata = { "Content-Type": "image/png" };
        await uploadFile(pngBuffer, `${uuid}.png`, metadata);
        await updateUserAvatar(userId, `user/${uuid}/avatar`);
  
        return json(
          { message: "アイコンをアップロードしました。" },
          { status: 200 }
        );
      } catch (error) {
        return json({ error: "エラーが発生しました。" }, { status: 500 });
      }
    }

  if (!userId) throw new Response("認証されていません", { status: 401 });

  if (intent === "leaveGroup") {
    const groupId = formData.get("groupId") as string;
    await removeUserFromGroup(groupId, userId);

    const updatedGroup = await getUserGroups(userId);
    const group = updatedGroup.find((g) => g.id === groupId);
    if (!group || group.users.length === 0) {
      await deleteGroup(groupId);
    }

    return json({ success: true });
  }

  const name = formData.get("name") as string;
  const userIds = JSON.parse(formData.get("userIds") as string) as string[];
  const group = await createGroup(name, [userId, ...userIds]);
  return json({ group });
};

export default function Home() {
  const { userId, username, uuid, avatarUrl, groups, vapidPublicKey } =
    useLoaderData<typeof loader>();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const fetcher = useFetcher();

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleOpenEditModal = (groupId: string, groupName: string) => {
    setEditingGroup({ id: groupId, name: groupName });
  };
  const handleCloseEditModal = () => {
    setEditingGroup(null);
  };

  const handleLeaveGroup = (groupId: string, groupName: string) => {
    if (confirm(`グループ ${groupName} から脱退しますか？`)) {
      fetcher.submit({ intent: "leaveGroup", groupId }, { method: "post" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-10 pt-10">
        <h1 className="text-4xl font-bold">ホーム</h1>
        <ActionBar
          username={username!}
          uuid={uuid!}
          initialAvatarUrl={avatarUrl}
          publicKey={vapidPublicKey}
        />
      </header>

      <main className="flex-1 px-[40px] py-5 flex flex-col">
      <h2 className="md:text-[1.7vw] text-lg font-bold py-5 ">マイマップ</h2>
        <section className="w-full h-[200px] overflow-hidden rounded-xl shadow-lg border border-gray-700">
          <Link to="/mymap">
              <img
                className="object-cover  w-full h-full"
                src="/mymapbg.jpeg"
                alt="My Map"
              />
          </Link>
        </section>

        <section className="w-full">
          <div className="w-full max-w-[800px] items-center justify-between pt-2">
            <h2 className="md:text-[1.7vw] text-lg font-bold py-3">グループ</h2>
            {groups.length === 0 && (
      <Button
        className="rounded-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
        onClick={handleOpenModal}
      >
        + グループ作成
      </Button>
    )}
          </div>
          {groups.length > 0 ? (
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 space-y-2 md:space-y-0 overflow-x-auto whitespace-nowrap py-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="relative flex flex-col justify-between bg-gray-800 px-4 py-3 rounded-md md:h-[30vh] md:w-[20vw]"
                >
                  <Link
                    to={`/group/${group.id}`}
                    className="flex flex-col hover:text-gray-300"
                  >
                    <span className="text-md truncate w-full block">{group.name}</span>
                    <div className="flex mt-2">
                      {group.users.slice(0, 3).map((user, index) => (
                        <img
                          key={user.id}
                          src={`/user/${user.uuid}/avatar`}
                          alt={user.name}
                          className="rounded-full border-2 border-black object-cover w-8 h-8"
                          style={{
                            marginLeft: index === 0 ? 0 : "-20px",
                            zIndex: group.users.length - index,
                          }}
                        />
                      ))}
                      {group.users.length > 3 && (
                        <div className="ml-2 text-sm text-gray-300">
                          +{group.users.length - 3}
                        </div>
                      )}
                    </div>
                    
                  </Link>

                  <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-white w-[10vh]"
                    onClick={() => handleOpenEditModal(group.id, group.name)}
                  >
                    <FontAwesomeIcon icon={faGear} />
                  </Button>
                  <Button
                    className="w-[10vh]"
                    variant="destructive"
                    onClick={() => handleLeaveGroup(group.id, group.name)}
                  >
                    脱退
                  </Button>
                </div>
                </div>
              ))}

              <Button className="w-full md:w-auto flex items-center justify-center bg-gray-700 px-6 py-4 rounded-md md:min-w-[200px] md:h-[30vh] bg-transparent border border-4 border-dotted text-lg" 
              onClick={handleOpenModal}>
                  + グループ作成
                </Button>
            </div>
          ) : (
            <p className="text-gray-400 pt-2">参加しているグループがありません。</p>
          )}
        </section>
      </main>

      {showModal && (
        <GroupCreateModal currentUserId={userId} onClose={handleCloseModal} />
      )}
      {editingGroup && (
        <GroupEditModal
          groupId={editingGroup.id}
          currentName={editingGroup.name}
          currentUserId={userId}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
}
