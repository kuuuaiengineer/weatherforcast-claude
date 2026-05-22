"use client";

import { useState, useEffect } from "react";

type Config = {
  email: string;
  city: string;
  timeFrom: number;
  timeTo: number;
  threshold: number;
};

export default function NotifySettings({ currentCity }: { currentCity?: string }) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Config>({
    email: "",
    city: currentCity ?? "",
    timeFrom: 6,
    timeTo: 18,
    threshold: 50,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentCity) setConfig((c) => ({ ...c, city: currentCity }));
  }, [currentCity]);

  const handleSave = async () => {
    if (!config.email || !config.city) return;
    setLoading(true);
    await fetch("/api/notify-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = async () => {
    if (!config.email) return;
    await fetch(`/api/notify-settings?email=${encodeURIComponent(config.email)}`, { method: "DELETE" });
    setSaved(false);
    setConfig((c) => ({ ...c, email: "" }));
  };

  return (
    <div className="w-full max-w-2xl mt-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl border border-white/30 transition"
      >
        <span className="font-medium">🔔 雨の通知設定</span>
        <span className="text-white/60 text-sm">{open ? "▲ 閉じる" : "▼ 開く"}</span>
      </button>

      {open && (
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-2 border border-white/30 text-white space-y-4">
          <div>
            <label className="text-sm text-white/70 block mb-1">通知先メールアドレス</label>
            <input
              type="email"
              value={config.email}
              onChange={(e) => setConfig((c) => ({ ...c, email: e.target.value }))}
              placeholder="example@email.com"
              className="w-full rounded-lg px-3 py-2 text-gray-800 bg-white/90 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 block mb-1">対象都市</label>
            <input
              type="text"
              value={config.city}
              onChange={(e) => setConfig((c) => ({ ...c, city: e.target.value }))}
              placeholder="Tokyo"
              className="w-full rounded-lg px-3 py-2 text-gray-800 bg-white/90 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 block mb-1">
              チェック時間帯: {config.timeFrom}時 〜 {config.timeTo}時
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={0} max={23} value={config.timeFrom}
                onChange={(e) => setConfig((c) => ({ ...c, timeFrom: Number(e.target.value) }))}
                className="w-16 rounded-lg px-2 py-1 text-gray-800 bg-white/90 text-center"
              />
              <span>〜</span>
              <input
                type="number" min={0} max={23} value={config.timeTo}
                onChange={(e) => setConfig((c) => ({ ...c, timeTo: Number(e.target.value) }))}
                className="w-16 rounded-lg px-2 py-1 text-gray-800 bg-white/90 text-center"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70 block mb-1">
              通知する降水確率の閾値: <strong>{config.threshold}%</strong> 以上
            </label>
            <input
              type="range" min={10} max={90} step={10} value={config.threshold}
              onChange={(e) => setConfig((c) => ({ ...c, threshold: Number(e.target.value) }))}
              className="w-full accent-yellow-300"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>10%</span><span>50%</span><span>90%</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "保存中..." : saved ? "✓ 保存しました" : "保存する"}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition"
            >
              解除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
