import { Button } from "~/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faMagnifyingGlass,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

interface BarProps {
  handleMakeFriend: () => void;
  handleSearchMemo: () => void;
  handleGoToCurrentLocation: () => void;
}

const Bar = ({
    handleMakeFriend,
    handleSearchMemo,
    handleGoToCurrentLocation,
}: BarProps) => {
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
    <Button
        onClick={handleMakeFriend}
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
