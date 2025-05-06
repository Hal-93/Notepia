import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import Avatar from "boring-avatars";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

type Props = {
  uuid: string;
  username: string;
  avatarUrl: string | null;
  previewUrl: string | null;
  uname: string;
  isProfileChange: boolean;
  copied: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  setUname: (val: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCopy: () => void;
  handleUpload: () => void;
  setIsProfileChange: (val: boolean) => void;
};

export default function ProfileSection({
  uuid,
  username,
  avatarUrl,
  previewUrl,
  uname,
  isProfileChange,
  copied,
  fileInputRef,
  setUname,
  handleFileChange,
  handleCopy,
  handleUpload,
  setIsProfileChange,
}: Props) {
  return (
    <>
    <div className="flex flex-col items-center justify-center mb-6">
      <div className="p-4 relative inline-block">
        {isProfileChange && (
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            ref={fileInputRef}
            className="opacity-0 absolute w-0 h-0"
            onChange={handleFileChange}
          />
        )}
        <label htmlFor="fileInput" className="cursor-pointer">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={username}
              className="rounded-full"
              style={{ height: "7rem", width: "7rem" }}
            />
          ) : avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="rounded-full"
              style={{ height: "7rem", width: "7rem" }}
            />
          ) : (
            <Avatar size="7rem" name={uuid} variant="beam" />
          )}
        </label>
        {isProfileChange && (
          <FontAwesomeIcon
            icon={faPen}
            className="absolute top-0 right-0 bg-white p-1 rounded-full shadow  -translate-x-2/3 translate-y-2/3"
          />
        )}
      </div>

      {isProfileChange ? (
          <Input
            id="username"
            name="username"
            type="text"
            value={uname}
            onChange={(e) => setUname(e.target.value)}
            style={{ width: "90%" }}
            className="text-white bg-gray-800 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
          />
      ) : (
        <div className="text-white text-2xl">{uname}</div>
      )}

      <div>
        <button className="text-white p-2 rounded" onClick={handleCopy}>
          @{uuid}
        </button>
        {copied && (
          <span className="ml-2 text-green-400">コピーしました！</span>
        )}
      </div>
    

      <br />
      {isProfileChange && (
        <div className="w-full flex flex-col items-center">
          <Button
            onClick={() => {
              handleUpload();
            }}
            className="w-full mt-5 bg-indigo-500 hover:bg-indigo-700 text-black"
            style={{ width: "90%" }}
          >
            保存
          </Button>
        </div>
      )}
      </div>
    </>
  );
}
