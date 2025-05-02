import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faNoteSticky,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
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

  const [position, setPosition] = useState<'left' | 'right' | 'bottom'>('bottom');
  const [buttonColor, setButtonColor] = useState<string>('#4F46E5');
  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/user-settings");
      if (res.ok) {
        const data = await res.json();
        if (data.bar) setPosition(data.bar);
        if (data.theme) setButtonColor(data.theme);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { bar?: string; theme?: string };
      if (detail.bar) setPosition(detail.bar as 'left' | 'right' | 'bottom');
      if (detail.theme) setButtonColor(detail.theme);
    };
    window.addEventListener("user-settings-updated", handler);
    return () => {
      window.removeEventListener("user-settings-updated", handler);
    };
  }, []);

  const positionStyle: React.CSSProperties = React.useMemo(() => {
    switch (position) {
      case 'left':
        return { bottom: '50%', left: '20px', transform: 'translateY(50%)' };
      case 'right':
        return { bottom: '50%', right: '20px', transform: 'translateY(50%)' };
      case 'bottom':
      default:
        return { bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
    }
  }, [position]);
  const buttonStyle: React.CSSProperties = React.useMemo(() => ({
    backgroundColor: buttonColor,
    color: '#ffffff',
  }), [buttonColor]);

  const buttonClass = "rounded-full w-12 h-12 flex items-center justify-center shadow-md";

  const closer = () => {
    setOnClose(false);
  };
  return (
    <div
      style={{
        position: 'fixed',
        display: 'flex',
        flexDirection: position === 'bottom' ? 'row' : 'column',
        gap: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '12px',
        borderRadius: '8px',
        zIndex: 1000,
        ...positionStyle,
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
              className={buttonClass}
              style={buttonStyle}
            >
              <FontAwesomeIcon icon={faUserPlus} />
            </Button>
          )}
        </>
      )}
      <Button
        onClick={handleSearchMemo}
        className={buttonClass}
        style={buttonStyle}
      >
        <FontAwesomeIcon icon={faNoteSticky} />
      </Button>
      <Button
        onClick={handleGoToCurrentLocation}
        className={buttonClass}
        style={buttonStyle}
      >
        <FontAwesomeIcon icon={faLocationDot} className="text-4xl" />
      </Button>
    </div>
  );
};

export default Bar;
