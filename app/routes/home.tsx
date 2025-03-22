import { useState } from "react";
import { Link, redirect, json, useLoaderData } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import ActionBar from "~/components/actionbar";
import { getUserId } from "~/session.server";
import { getUserById } from "~/models/user.server";
import { createGroup, getUserGroups } from "~/models/group.server";
import GroupCreateModal from "~/components/group/create";
import type { Group } from "@prisma/client";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return redirect("/login");

  const { getUsersMemo } = await import("~/models/memo.server");
  const memos = await getUsersMemo(userId);

  const user = await getUserById(userId);
  const groups = await getUserGroups(userId);

  return json({
    userId,
    username: user?.name,
    uuid: user?.uuid,
    avatarUrl: user?.avatar || null,
    memos,
    groups,
    mapboxToken: process.env.MAPBOX_TOKEN,
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const userIds = JSON.parse(formData.get("userIds") as string) as string[];

  if (!name) {
    return json({ error: "グループ名が必要です" }, { status: 400 });
  }
  if (!userId) {
    throw new Response("認証されていません", { status: 401 });
  }

  const group = await createGroup(name, [userId, ...userIds]);
  return json({ group });
};

export default function Home() {
  const { userId, username, uuid, avatarUrl, groups } = useLoaderData<typeof loader>();
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 pt-6">
        <h1 className="text-4xl font-bold">ホーム</h1>
        <ActionBar username={username!} uuid={uuid!} initialAvatarUrl={avatarUrl} />
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col items-center space-y-10">
        <section className="w-full max-w-[800px]">
          <h2 className="text-xl font-bold mb-3">マイマップ</h2>
          <Link to="/mymap">
            <div className="aspect-[3/2] overflow-hidden rounded-xl shadow-lg border border-gray-700">
              <img
                className="object-cover w-full h-full"
                src="https://tk.ismcdn.jp/mwimgs/4/6/1200w/img_46d920c8a05067bf52c9e11fa205e8ad356700.jpg"
                alt="My Map"
              />
            </div>
          </Link>
        </section>

        <section className="w-full max-w-[800px]">
          <h2 className="text-xl font-bold mb-3">グループ</h2>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group: Group) => ( // <-- ここで型を指定
                <Link key={group.id} to={`/group/${group.id}`}>
                  <div className="px-4 py-3 rounded-md bg-gray-800 hover:bg-gray-700 transition">
                    {group.name}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">参加しているグループがありません。</p>
          )}
        </section>
      </main>

      <div className="fixed bottom-6 right-6">
        <Button
          className="rounded-full py-6 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          onClick={handleOpenModal}
        >
          + グループ作成
        </Button>
      </div>

      {showModal && (
        <GroupCreateModal
          currentUserId={userId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}