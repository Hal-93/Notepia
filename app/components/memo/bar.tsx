import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faLocationDot,
  faMagnifyingGlass,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
  Drawer,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from "../ui/drawer";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import Avatar from "boring-avatars";
import GroupEditModal from "../group/edit";

interface BarProps {
  handleMakeFriend?: () => void;
  handleSearchMemo: () => void;
  handleGoToCurrentLocation: () => void;
  groupeId: string;
  groupeName: string;
  userId: string;
}

const Bar = ({
  handleMakeFriend,
  handleSearchMemo,
  handleGoToCurrentLocation,
  groupeId,
  groupeName,
  userId,
}: BarProps) => {
  const [onClose, setOnClose] = useState(false);
  const closer = () => {
    setOnClose(false);
  };
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: "10px 20px",
        borderRadius: "8px",
      }}
    >
      {handleMakeFriend && (
        <>
          {onClose ? (
            <GroupEditModal
              groupId={groupeId}
              currentName={groupeName}
              currentUserId={userId}
              onClose={closer}
            />
          ) : (
            <Button
              onClick={() => {
                setOnClose(true);
              }}
              style={{
                border: "none",
                padding: "8px 12px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              className="bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faUserPlus} />
            </Button>
          )}
        </>
      )}
      <Button
        onClick={handleSearchMemo}
        style={{
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        className="bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </Button>
      <Button
        onClick={handleGoToCurrentLocation}
        style={{
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        className="bg-indigo-500 text-white rounded-full w-12 h-12 flex items-center justify-center"
      >
        <FontAwesomeIcon icon={faLocationDot} className="text-4xl" />
      </Button>
    </div>
  );
};

export default Bar;
