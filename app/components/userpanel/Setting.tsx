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
    <div className="w-full max-h-[65vh] overflow-y-auto px-1">
      <div className="w-full p-2 rounded-lg text-white"></div>
      {/* プッシュ通知 */}
      <div className="flex items-center mb-3 bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">プッシュ通知</div>
          <div className="text-gray-500 text-sm">
            プッシュ通知の有無を切り替え
          </div>
        </div>
        <Switch
          checked={isSubscribed}
          onClick={toggleSubscription}
          className="h-10 w-16"
        />
      </div>

      {/* バー位置設定 */}
      <div className="flex items-center mb-3 bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">バー表示位置</div>
          <div className="text-gray-500 text-sm">アクションバーの位置</div>
        </div>
        <select
          value={barPosition}
          onChange={(e) =>
            setBarPosition(e.target.value as "left" | "right" | "bottom")
          }
          className="bg-gray-800 text-white p-2 rounded w-14"
        >
          <option value="left">左</option>
          <option value="bottom">下</option>
          <option value="right">右</option>
        </select>
      </div>

      {/* テーマカラー設定 */}
      <div className="flex items-center mb-3 bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">テーマカラー</div>
          <div className="text-gray-500 text-sm">テーマ色を選択</div>
        </div>
        <input
          type="color"
          value={barColor}
          onChange={(e) => setBarColor(e.target.value)}
          className="w-14 h-8"
        />
      </div>

      {/* マップ負荷設定 */}
      <div className="flex items-center mb-3 bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">マップ表示品質</div>
          <div className="text-gray-500 text-sm">負荷設定を選択</div>
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
          className="bg-gray-800 text-white p-2 rounded w-14"
        >
          <option value="high">高</option>
          <option value="low">低</option>
        </select>
      </div>
      {/* チュートリアル設定 */}
      <div className="flex items-center mb-3 bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">初回チュートリアル</div>
          <div className="text-gray-500 text-sm">初回チュートリアルが完了したかどうか</div>
        </div>
        <Switch
          checked={tutorialEnabled}
          onClick={toggleTutorial}
          className="h-10 w-16"
        />
      </div>
    </div>
  );
}
