import { useState } from "react";
import { Link, redirect, json, useLoaderData, useFetcher } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";
import ActionBar from "~/components/actionbar";
import { getUserId } from "~/session.server";
import { getUserById } from "~/models/user.server";
import { createGroup, getUserGroups, removeUserFromGroup, deleteGroup, getUsersByGroup } from "~/models/group.server";
import GroupCreateModal from "~/components/group/create";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import GroupEditModal from "~/components/group/edit";

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
  const { userId, username, uuid, avatarUrl, groups } = useLoaderData<typeof loader>();
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
          <div className="w-full max-w-[800px] flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">グループ</h2>
            <Button
              className="rounded-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
              onClick={handleOpenModal}
            >
              + グループ作成
            </Button>
          </div>
          {groups.length > 0 ? (
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-md">
                  <Link to={`/group/${group.id}`} className="flex items-center gap-4 flex-1 hover:text-gray-300">
                    <div className="flex items-center">
                      {group.users.slice(0, 3).map((user, index) => (
                        <img
                          key={user.id}
                          src={`https://notepia.fly.dev/user/${user.uuid}/avatar`}
                          alt={user.name}
                          className="rounded-full border-2 border-black object-cover w-8 h-8"
                          style={{ marginLeft: index === 0 ? 0 : "-10px", zIndex: group.users.length - index }}
                        />
                      ))}
                      {group.users.length > 3 && (
                        <div className="ml-2 text-sm text-gray-300">
                          +{group.users.length - 3}
                        </div>
                      )}
                    </div>
                    <span>{group.name}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-white mr-2"
                    onClick={() => handleOpenEditModal(group.id, group.name)}
                  >
                    <FontAwesomeIcon icon={faGear} />
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleLeaveGroup(group.id, group.name)}
                  >
                    脱退
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">参加しているグループがありません。</p>
          )}
        </section>
      </main>

      {showModal && <GroupCreateModal currentUserId={userId} onClose={handleCloseModal} />}
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