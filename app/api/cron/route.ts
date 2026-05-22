import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { Resend } from "resend";
import type { NotifyConfig } from "../notify-settings/route";
const OWM_BASE = "https://api.openweathermap.org/data/2.5";

export async function GET(req: NextRequest) {
  // Vercel Cron からのリクエストを検証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const keys = await kv.keys("notify:*");
  if (keys.length === 0) return NextResponse.json({ sent: 0 });

  const apiKey = process.env.OPENWEATHER_API_KEY!;
  let sent = 0;

  for (const key of keys) {
    const config = await kv.get<NotifyConfig>(key);
    if (!config) continue;

    const url = `${OWM_BASE}/forecast?q=${encodeURIComponent(config.city)}&appid=${apiKey}&units=metric&lang=ja&cnt=16`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();

    const today = new Date().toISOString().slice(0, 10);
    const slots = data.list.filter((item: { dt_txt: string; pop: number }) => {
      const date = item.dt_txt.slice(0, 10);
      const hour = parseInt(item.dt_txt.slice(11, 13));
      return date === today && hour >= config.timeFrom && hour <= config.timeTo;
    });

    const maxPop = Math.round(Math.max(...slots.map((s: { pop: number }) => s.pop ?? 0)) * 100);
    if (maxPop < config.threshold) continue;

    await resend.emails.send({
      from: "weather@resend.dev",
      to: config.email,
      subject: `☂️ ${config.city} 本日${config.timeFrom}〜${config.timeTo}時の降水確率が${maxPop}%です`,
      html: `
        <p>本日の <strong>${config.city}</strong> の天気をお知らせします。</p>
        <p>${config.timeFrom}時〜${config.timeTo}時の最大降水確率: <strong>${maxPop}%</strong></p>
        <p>傘を持っていくことをおすすめします。</p>
        <hr/>
        <p style="color:#888;font-size:12px">通知設定は <a href="${process.env.NEXT_PUBLIC_APP_URL}">天気予報アプリ</a> から変更できます。</p>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
