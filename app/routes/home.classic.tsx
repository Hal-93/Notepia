import { useEffect, useState } from "react";
import {
  Link,
  redirect,
  json,
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { Button } from "~/components/ui/button";

import { getUserId } from "~/session.server";
import {
  getUserById,
  updateUserAvatar,
  updateUserName,
} from "~/models/user.server";
import {
  createGroup,
  getUserGroups,
  removeUserFromGroup,
  deleteGroup,
  getUsersByGroup,
} from "~/models/group.server";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { uploadFile } from "~/utils/minio.server";
import sharp from "sharp";
import Avatar from "boring-avatars";
import GroupCreateModalCL from "~/components/group/createcl";
import GroupEditModalCL from "~/components/group/editcl";

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
  const username = formData.get("username") as string;
  if (username && file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      updateUserName(userId!, username);
      const pngBuffer = await sharp(buffer).png().toBuffer();
      const metadata = { "Content-Type": "image/png" };
      await uploadFile(pngBuffer, `${uuid}.png`, metadata);
      await updateUserAvatar(userId!, `/user/${uuid}/avatar`);
      return json({ message: "更新しました。" }, { status: 200 });
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }
  if (username) {
    try {
      updateUserName(userId!, username);
      return json({ message: "更新しました。" }, { status: 200 });
    } catch (error) {
      return json({ error: "エラーが発生しました。" }, { status: 500 });
    }
  }
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
      await updateUserAvatar(userId, `/user/${uuid}/avatar`);

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
  if (userIds) {
    const group = await createGroup(name, [userId, ...userIds]);
    return json({ group });
  }
  return null;
};

export default function HomeClassic() {
  const { userId, groups } =
    useLoaderData<typeof loader>();
  const [showModal, setShowModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const fetcher = useFetcher();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/98.css";
    link.id = "win98-css";
    document.head.appendChild(link);
    return () => {
      document.getElementById("win98-css")?.remove();
    };
  }, []);

  const handleClose = () => setIsVisible(false);
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

  useEffect(() => {
      setIsClient(true);
  }, []);
  
  if (!isClient) return null;

  return (
    <div className="flex flex-col min-h-screen bg-teal-600 text-white">

      <main className="flex-1 px-6 py-5 flex flex-col">

        <>
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">マイマップ</div>
            <div className="title-bar-controls">
            </div>
          </div>
          <div className="window-body">
          <Link to="/mymap">
            <img
              className="object-cover "
              src="https://wiki.openstreetmap.org/w/images/6/69/Baclaran_and_Pasay_Rotunda_-_in_Standard_map_layer.png"
              alt="My Map"
            />
          </Link>
          </div>
        </div>
        <br/>
        </>
        {isVisible &&
        <div className="window" style={{ marginBottom: "1rem" }}>
          <div className="title-bar">
            <div className="title-bar-text">グループ</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close" onClick={handleClose}></button>
            </div>
          </div>
          <div className="window-body">
          {groups.length > 0 ? (
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 space-y-2 md:space-y-0 overflow-x-auto whitespace-nowrap py-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="window"
                >
                  <legend>{group.name}</legend>

                  <Link
                    to={`/group/${group.id}`}
                    className="flex flex-col hover:text-gray-300"
                  >
                    <div className="flex mt-2">
                      {group.users.slice(0, 3).map((user, index) => (
                        <div
                          key={user.id}
                          className="rounded-full border-2 border-black w-8 h-8 overflow-hidden"
                          style={{
                            marginLeft: index === 0 ? 0 : "-20px",
                            zIndex: group.users.length - index,
                          }}
                        >
                          {user.avatar ? (
                            <img
                              src={`/user/${user.uuid}/avatar`}
                              alt={user.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Avatar name={user.uuid} size={32} variant="beam" />
                          )}
                        </div>
                      ))}
                      {group.users.length > 3 && (
                        <div className="ml-2 text-sm text-gray-300">
                          +{group.users.length - 3}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex justify-end">
                  <button
                    className="w-[10vh]"
                    onClick={() => handleOpenEditModal(group.id, group.name)}
                  >
                    設定
                  </button>
                  <button
                    className="w-[5vh]"
                    onClick={() => handleLeaveGroup(group.id, group.name)}
                  >
                    脱退
                    <FontAwesomeIcon icon={faRightFromBracket} />
                  </button>
                </div>
                </div>
              ))}

              <button className="default" 
              onClick={handleOpenModal}>
                  + グループ作成
              </button>
            </div>
          ) : (
            <>
            <p className="text-gray-400 pt-2 pb-6">参加しているグループがありません。</p>
            <Button
              className="rounded-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
              onClick={handleOpenModal}
            >
              + グループ作成
            </Button>
            </>
          )}
          </div>
        </div>
      }

      </main>

      {showModal && (
        <GroupCreateModalCL currentUserId={userId} onClose={handleCloseModal} />
      )}
      {editingGroup && (
        <GroupEditModalCL
          groupId={editingGroup.id}
          currentName={editingGroup.name}
          currentUserId={userId}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
}
