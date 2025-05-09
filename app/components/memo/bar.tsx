import React, { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faNoteSticky,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

interface BarProps {
  handleGroupDetail?: () => void;
  handleSearchMemo: () => void;
  handleGoToCurrentLocation: () => void;
  groupeId: string;
  groupeName: string;
  userId: string;
}

const Bar = ({
  handleGroupDetail,
  handleSearchMemo,
  handleGoToCurrentLocation,
}: BarProps) => {

  const [position, setPosition] = useState<'left' | 'right' | 'bottom'>('bottom');
  const [buttonColor, setButtonColor] = useState<string>('#1F2937');
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
        return { top: '50%', left: '16px', transform: 'translateY(-50%)' };
      case 'right':
        return { top: '50%', right: '16px', transform: 'translateY(-50%)' };
      case 'bottom':
      default:
        return { bottom: '34px', left: '50%', transform: 'translateX(-50%)' };
    }
  }, [position]);
  const buttonStyle: React.CSSProperties = React.useMemo(() => ({
    backgroundColor: buttonColor,
    color: '#ffffff',
  }), [buttonColor]);

  const buttonClass = "rounded-[16px] w-[56px] h-[56px] flex items-center justify-center shadow-md";

  return (
    <div
      style={{
        position: 'fixed',
        display: 'flex',
        flexDirection: position === 'bottom' ? 'row' : 'column',
        gap: '12px',
        borderRadius: '8px',
        zIndex: 10,
        ...positionStyle,
      }}
    >
      {handleGroupDetail && (
        <Button
          onClick={handleGroupDetail}
          className={buttonClass}
          style={buttonStyle}
        >
          <FontAwesomeIcon icon={faUsers} />
        </Button>
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
