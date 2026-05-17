import { NextRequest, NextResponse } from "next/server";

const OWM_BASE = "https://api.openweathermap.org/data/2.5";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const location = city
    ? `q=${encodeURIComponent(city)}`
    : lat && lon
    ? `lat=${lat}&lon=${lon}`
    : null;

  if (!location) {
    return NextResponse.json({ error: "city or coordinates required" }, { status: 400 });
  }

  const url = `${OWM_BASE}/forecast?${location}&appid=${apiKey}&units=metric&lang=ja&cnt=40`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.message ?? "OpenWeatherMap error" },
      { status: res.status }
    );
  }

  const data = await res.json();

  // Group by date (YYYY-MM-DD)
  const byDate: Record<string, { temps: number[]; pop: number[]; humidity: number[]; icons: string[]; descs: string[] }> = {};

  for (const item of data.list) {
    const date = item.dt_txt.slice(0, 10);
    if (!byDate[date]) byDate[date] = { temps: [], pop: [], humidity: [], icons: [], descs: [] };
    byDate[date].temps.push(item.main.temp);
    byDate[date].pop.push(item.pop ?? 0);
    byDate[date].humidity.push(item.main.humidity);
    byDate[date].icons.push(item.weather[0].icon);
    byDate[date].descs.push(item.weather[0].description);
  }

  const forecast = Object.entries(byDate).map(([date, d]) => ({
    date,
    tempMin: Math.round(Math.min(...d.temps)),
    tempMax: Math.round(Math.max(...d.temps)),
    humidity: Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length),
    pop: Math.round(Math.max(...d.pop) * 100),
    icon: d.icons[Math.floor(d.icons.length / 2)],
    description: d.descs[Math.floor(d.descs.length / 2)],
  }));

  return NextResponse.json({
    city: data.city.name,
    country: data.city.country,
    forecast,
  });
}
