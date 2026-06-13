"use client";

import { useState } from "react";

type CityConfig = {
  city: string;
  timeFrom: number;
  timeTo: number;
  threshold: number;
};

const DEFAULT_CITY: CityConfig = { city: "", timeFrom: 6, timeTo: 18, threshold: 50 };

export default function NotifySettings({ currentCity }: { currentCity?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "deleted" | "error">("idle");

  const loadSettings = async () => {
    if (!email) return;
    setStatus("loading");
    const res = await fetch(`/api/notify-settings?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (data?.cities) {
      setCities(data.cities);
    } else {
      setCities([{ ...DEFAULT_CITY, city: currentCity ?? "" }]);
    }
    setLoaded(true);
    setStatus("idle");
  };

  const addCity = () => setCities((c) => [...c, { ...DEFAULT_CITY, city: currentCity ?? "" }]);

  const updateCity = (i: number, patch: Partial<CityConfig>) =>
    setCities((c) => c.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const removeCity = (i: number) => setCities((c) => c.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!email || !cities.length) return;
    setStatus("loading");
    const res = await fetch("/api/notify-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, cities }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleDelete = async () => {
    if (!email) return;
    await fetch(`/api/notify-settings?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    setCities([]);
    setLoaded(false);
    setStatus("deleted");
    setTimeout(() => setStatus("idle"), 3000);
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

          {/* メール入力 + 読み込み */}
          <div>
            <label className="text-sm text-white/70 block mb-1">メールアドレス</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setLoaded(false); }}
                placeholder="example@email.com"
                className="flex-1 rounded-lg px-3 py-2 text-gray-800 bg-white/90 focus:outline-none"
              />
              <button
                onClick={loadSettings}
                disabled={!email || status === "loading"}
                className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition disabled:opacity-40"
              >
                読み込む
              </button>
            </div>
          </div>

          {/* ステータスメッセージ */}
          {status === "saved" && <p className="text-green-300 text-sm">✓ 保存しました</p>}
          {status === "deleted" && <p className="text-yellow-300 text-sm">✓ 通知設定を解除しました</p>}
          {status === "error" && <p className="text-red-300 text-sm">保存に失敗しました</p>}

          {/* 都市リスト */}
          {loaded && (
            <>
              {cities.map((c, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">都市 {i + 1}</span>
                    {cities.length > 1 && (
                      <button onClick={() => removeCity(i)} className="text-white/50 hover:text-red-300 text-sm transition">
                        ✕ 削除
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={c.city}
                    onChange={(e) => updateCity(i, { city: e.target.value })}
                    placeholder="Tokyo"
                    className="w-full rounded-lg px-3 py-2 text-gray-800 bg-white/90 focus:outline-none"
                  />

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/70">時間帯</span>
                    <input
                      type="number" min={0} max={23} value={c.timeFrom}
                      onChange={(e) => updateCity(i, { timeFrom: Number(e.target.value) })}
                      className="w-14 rounded-lg px-2 py-1 text-gray-800 bg-white/90 text-center"
                    />
                    <span>〜</span>
                    <input
                      type="number" min={0} max={23} value={c.timeTo}
                      onChange={(e) => updateCity(i, { timeTo: Number(e.target.value) })}
                      className="w-14 rounded-lg px-2 py-1 text-gray-800 bg-white/90 text-center"
                    />
                    <span className="text-white/70">時</span>
                  </div>

                  <div>
                    <p className="text-sm text-white/70 mb-1">降水確率 <strong>{c.threshold}%</strong> 以上で通知</p>
                    <input
                      type="range" min={10} max={90} step={10} value={c.threshold}
                      onChange={(e) => updateCity(i, { threshold: Number(e.target.value) })}
                      className="w-full accent-yellow-300"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-0.5">
                      <span>10%</span><span>50%</span><span>90%</span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addCity}
                className="w-full py-2 border border-dashed border-white/40 rounded-xl text-white/60 hover:text-white hover:border-white/60 text-sm transition"
              >
                + 都市を追加
              </button>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={status === "loading"}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {status === "loading" ? "保存中..." : "保存する"}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 bg-white/10 hover:bg-red-500/40 text-white/70 hover:text-white rounded-lg transition text-sm"
                >
                  全解除
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
