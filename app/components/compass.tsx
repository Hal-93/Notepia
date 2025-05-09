// components/Compass.tsx
import { useEffect, useRef, useState } from "react";

interface CompassProps {
  map: mapboxgl.Map | null;
}

export default function Compass({ map }: CompassProps) {
  const [bearing, setBearing] = useState(0);
   // 初期状態で非表示に
  const [isVisible, setIsVisible] = useState(false);
  const compassRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!map) return;
    
    setIsVisible(false);

    const handleRotate = () => {
      const newBearing = map.getBearing();
      setBearing(newBearing);

      // マップが動いている場合、コンパスを表示
      setIsVisible(true);

      // 北を向いたときに0.5秒後に非表示
      if (Math.abs(newBearing) < 0.1) {
        setTimeout(() => setIsVisible(false), 500);
      }
    };

    // 初期状態で北を向いていれば、そのタイミングで非表示を即時に反映
    const initialBearing = map.getBearing();
    if (Math.abs(initialBearing) < 0.1) {
      setIsVisible(false);
    }

    map.on("rotate", handleRotate);

    return () => {
      map.off("rotate", handleRotate);
    };
  }, [map]);

  const resetNorth = () => {
    if (map) {
      map.rotateTo(0, { duration: 300 });
      setIsVisible(true);
    }
  };

  return (
    <div
      className={`fixed mt-[132px] md:mt-[76px] right-4 z-5 w-[48px] h-[48px] rounded-[16px] bg-black flex items-center justify-center cursor-pointer transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={resetNorth}
    >
      <img
        ref={compassRef}
        src="/compass.svg"
        alt="Compass"
        className="w-8 h-8 transition-transform duration-200"
        style={{ transform: `rotate(${-bearing}deg)` }}
      />
    </div>
  );
}
