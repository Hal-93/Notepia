import Avatar from "boring-avatars";
import { Button } from "./ui/button";

interface UserProfileProps {
  username: string;
  avatarUrl: string | null;
  uuid: string;
  onEdit?: () => void;
}

export default function UserProfile({
  username,
  avatarUrl,
  uuid,
}: UserProfileProps) {
  return (
    <div className="rounded-lg p-6 text-white w-full max-w-sm mx-auto">
      <div className="flex items-center mb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <Avatar size={64} name={uuid} variant="beam" />
        )}
        <div className="ml-4 flex-1">
          <h2 className="text-2xl font-bold">{username}</h2>
          <div className="flex items-center text-gray-400">
            <span className="mr-2">@{uuid}</span>
          </div>
        </div>
        <Button>
            フレンド申請
        </Button>
      </div>
    </div>
  );
}