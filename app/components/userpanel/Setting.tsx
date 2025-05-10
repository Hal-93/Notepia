import { Switch } from "../ui/switch";

export default function Setting({
  isSubscribed,
  toggleSubscription,
  barPosition,
  setBarPosition,
  barColor,
  setBarColor,
  tutorialEnabled,
  toggleTutorial,
  mapQuality,
  setMapQuality,
}: {
  isSubscribed: boolean;
  toggleSubscription: () => void;
  barPosition: "left" | "right" | "bottom";
  setBarPosition: (v: "left" | "right" | "bottom") => void;
  barColor: string;
  setBarColor: (v: string) => void;
  tutorialEnabled: boolean;
  toggleTutorial: () => void;
  mapQuality: "low" | "high";
  setMapQuality: (v: "low" | "high") => void;
}) {
  return (
    <div className="w-full max-h-[65vh] overflow-y-auto space-y-6 mt-3">

  {/* 通知セクション */}
  <div className="p-2 rounded-lg">
    <h2 className="mb-2 text-[#777777] font-bold text-lg">通知</h2>
    <div className="flex items-center rounded-md">
      <div className="flex-1">
        <div className="text-xl font-bold">プッシュ通知</div>
      </div>
      <Switch
        checked={isSubscribed}
        onClick={toggleSubscription}
        className="h-10 w-16"
      />
    </div>
  </div>

  {/* カスタマイズセクション */}
  <div className="p-2 rounded-lg">
    <h2 className="mb-2 text-[#777777] font-bold text-lg">カスタマイズ</h2>

    <div className="flex items-center mb-4 rounded-md">
      <div className="flex-1">
        <div className="text-xl font-bold">バー表示位置</div>
      </div>
      <select
        value={barPosition}
        onChange={(e) =>
          setBarPosition(e.target.value as "left" | "right" | "bottom")
        }
        className="bg-gray-800 text-white p-2 rounded w-[64px]"
      >
        <option value="left">左</option>
        <option value="bottom">下</option>
        <option value="right">右</option>
      </select>
    </div>

    <div className="flex items-center mb-4 rounded-md">
      <div className="flex-1">
        <div className="text-xl font-bold">テーマカラー</div>
      </div>
      <input
        type="color"
        value={barColor}
        onChange={(e) => setBarColor(e.target.value)}
        className="w-[64px] h-8"
      />
    </div>

    <div className="flex items-center mb-2 rounded-md">
      <div className="flex-1">
        <div className="text-xl font-bold">マップ表示品質</div>
      </div>
      <select
        value={mapQuality}
        onChange={(e) => {
          const v = e.target.value as "low" | "high";
          setMapQuality(v);
          window.dispatchEvent(new CustomEvent("user-settings-updated", {
            detail: { map: v }
          }));
        }}
        className="bg-gray-800 text-white p-2 rounded w-[64px]"
      >
        <option value="high">高</option>
        <option value="low">低</option>
      </select>
    </div>
  </div>

  {/* デバッグセクション */}
  <div className="p-2 rounded-lg">
    <h2 className="mb-2 text-[#777777] font-bold text-lg">デバッグ</h2>
    <div className="flex items-center mb-2 rounded-md">
      <div className="flex-1">
        <div className="text-xl font-bold">初回チュートリアル</div>
      </div>
      <Switch
        checked={tutorialEnabled}
        onClick={toggleTutorial}
        className="h-10 w-16"
      />
    </div>
  </div>

</div>
  );
}
