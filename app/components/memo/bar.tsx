import { Button } from "~/components/ui/button";

interface BarProps {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleGoToCurrentLocation: () => void;
}

const Bar = ({
  handleZoomIn,
  handleZoomOut,
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
      <button
        onClick={handleZoomIn}
        style={{
          color: "#fff",
          backgroundColor: "#333",
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ズームイン
      </button>
      <button
        onClick={handleZoomOut}
        style={{
          color: "#fff",
          backgroundColor: "#333",
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ズームアウト
      </button>
      <button
        onClick={handleGoToCurrentLocation}
        style={{
          color: "#fff",
          backgroundColor: "#333",
          border: "none",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        現在地
      </button>
    </div>
  );
};

export default Bar;
