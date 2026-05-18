"use client";

import { useState, useCallback, useEffect } from "react";

type Slot = {
  time: string;
  temp: number;
  pop: number;
  icon: string;
  description: string;
};

type DayForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pop: number;
  icon: string;
  description: string;
  slots: Slot[];
};

type WeatherData = {
  city: string;
  country: string;
  forecast: DayForecast[];
};

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    label: `${d.getMonth() + 1}/${d.getDate()}`,
    weekday: WEEKDAY_JA[d.getDay()],
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
}


export default function Home() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<WeatherData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("weather-favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const saveFavorites = (next: string[]) => {
    setFavorites(next);
    localStorage.setItem("weather-favorites", JSON.stringify(next));
  };

  const toggleFavorite = (city: string) => {
    const next = favorites.includes(city)
      ? favorites.filter((c) => c !== city)
      : [...favorites, city];
    saveFavorites(next);
  };

  const fetchWeather = useCallback(async (params: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
      setSelectedDate(json.forecast[0]?.date ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchWeather(`city=${encodeURIComponent(query.trim())}`);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setError("位置情報がサポートされていません"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => setError("位置情報の取得に失敗しました")
    );
  };

  const selected = data?.forecast.find((d) => d.date === selectedDate);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-400 to-blue-700 flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-8 drop-shadow">天気予報</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-md mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="都市名を入力 (例: Tokyo)"
          className="flex-1 rounded-xl px-4 py-2 text-gray-800 bg-white/90 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          type="submit"
          className="bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2 rounded-xl border border-white/40 transition"
        >
          検索
        </button>
      </form>

      <button onClick={handleGeolocate} className="text-sm text-white/80 hover:text-white underline mb-4">
        📍 現在地を使う
      </button>

      {/* お気に入り */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 w-full max-w-md justify-center">
          {favorites.map((city) => (
            <button
              key={city}
              onClick={() => fetchWeather(`city=${encodeURIComponent(city)}`)}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/35 active:scale-95 text-white text-sm px-3 py-1.5 rounded-full border border-white/30 transition-all duration-150 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {city}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-white animate-pulse">読み込み中...</p>}
      {error && <p className="bg-red-500/80 text-white px-4 py-2 rounded-xl mb-4">{error}</p>}

      {data && (
        <div className="w-full max-w-2xl">
          {/* 都市名 + お気に入りボタン */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <p className="text-white/90 text-lg font-semibold">{data.city}, {data.country}</p>
            <button
              onClick={() => toggleFavorite(data.city)}
              title={favorites.includes(data.city) ? "お気に入り解除" : "お気に入り追加"}
              className="group p-1 rounded-full transition-transform hover:scale-110 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" className="transition-colors duration-200">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={favorites.includes(data.city) ? "#fbbf24" : "none"}
                  stroke={favorites.includes(data.city) ? "#fbbf24" : "rgba(255,255,255,0.7)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:stroke-yellow-300 group-hover:fill-yellow-300/30"
                />
              </svg>
            </button>
          </div>

          {/* 日付セレクター */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {data.forecast.slice(0, 5).map((day) => {
              const { label, weekday, isWeekend } = formatDate(day.date);
              const active = day.date === selectedDate;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex flex-col items-center rounded-xl py-2 px-1 border transition ${
                    active ? "bg-white text-blue-700 border-white shadow-lg font-bold" : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                  }`}
                >
                  <span className={`text-xs ${isWeekend ? (active ? "text-red-500" : "text-red-300") : ""}`}>{weekday}</span>
                  <span className="text-sm">{label}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://openweathermap.org/img/wn/${day.icon}.png`} alt={day.description} width={36} height={36} />
                  <span className="text-xs mt-0.5">{day.tempMax}°</span>
                </button>
              );
            })}
          </div>

          {/* 詳細カード */}
          {selected && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-white border border-white/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-4xl font-bold">
                    {selected.tempMax}° / {selected.tempMin}°
                    <span className="text-lg font-normal ml-1">C</span>
                  </p>
                  <p className="text-white/80 mt-1">{selected.description}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://openweathermap.org/img/wn/${selected.icon}@2x.png`} alt={selected.description} width={80} height={80} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-sm">湿度</p>
                  <p className="text-2xl font-semibold">{selected.humidity}<span className="text-base font-normal">%</span></p>
                </div>
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <p className="text-white/70 text-sm">降水確率</p>
                  <p className="text-2xl font-semibold">{selected.pop}<span className="text-base font-normal">%</span></p>
                </div>
              </div>

              {/* 時間帯ごとの予報 */}
              <div className="overflow-x-auto -mx-2">
                <div className="flex gap-2 px-2 pb-1" style={{ minWidth: "max-content" }}>
                  {selected.slots.map((slot) => (
                    <div key={slot.time} className="flex flex-col items-center bg-white/10 rounded-xl px-3 py-2 min-w-[60px]">
                      <p className="text-xs text-white/70">{slot.time}</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://openweathermap.org/img/wn/${slot.icon}.png`} alt={slot.description} width={36} height={36} />
                      <p className="text-sm font-semibold">{slot.temp}°</p>
                      <p className="text-xs text-blue-200">{slot.pop}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
