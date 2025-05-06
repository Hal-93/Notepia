import { Switch } from "../ui/switch";

export default function Setting({
  isSubscribed,
  toggleSubscription,
  barPosition,
  setBarPosition,
  barColor,
  setBarColor,
}: {
  isSubscribed: boolean;
  toggleSubscription: () => void;
  barPosition: "left" | "right" | "bottom";
  setBarPosition: (v: "left" | "right" | "bottom") => void;
  barColor: string;
  setBarColor: (v: string) => void;
}) {
  return (
    <div className="w-full max-h-[65vh] overflow-y-auto px-1">
      <div className="w-full p-2 rounded-lg text-white"></div>
      {/* プッシュ通知 */}
      <div className="flex items-center mb-6 bg-gray-800 p-3 rounded-md">
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
      <div className="flex items-center mb-6 bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">バー表示位置</div>
          <div className="text-gray-500 text-sm">アクションバーの位置</div>
        </div>
        <select
          value={barPosition}
          onChange={(e) =>
            setBarPosition(e.target.value as "left" | "right" | "bottom")
          }
          className="bg-gray-800 text-white p-2 rounded"
        >
          <option value="bottom">下</option>
          <option value="left">左</option>
          <option value="right">右</option>
        </select>
      </div>

      {/* テーマカラー設定 */}
      <div className="flex items-center bg-gray-800 p-3 rounded-md">
        <div className="flex-1">
          <div className="text-2xl">テーマカラー</div>
          <div className="text-gray-500 text-sm">テーマ色を選択</div>
        </div>
        <input
          type="color"
          value={barColor}
          onChange={(e) => setBarColor(e.target.value)}
          className="w-12 h-8"
        />
      </div>
    </div>
  );
}
