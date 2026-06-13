import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { Resend } from "resend";
import type { NotifyConfig } from "../notify-settings/route";

const OWM_BASE = "https://api.openweathermap.org/data/2.5";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const keys = await kv.keys("notify:*");
  if (keys.length === 0) return NextResponse.json({ sent: 0 });

  const apiKey = process.env.OPENWEATHER_API_KEY!;
  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  for (const key of keys) {
    const config = await kv.get<NotifyConfig>(key);
    if (!config?.cities?.length) continue;

    const alerts: string[] = [];

    for (const cityConfig of config.cities) {
      const url = `${OWM_BASE}/forecast?q=${encodeURIComponent(cityConfig.city)}&appid=${apiKey}&units=metric&lang=ja&cnt=16`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();

      const slots = data.list.filter((item: { dt_txt: string }) => {
        const date = item.dt_txt.slice(0, 10);
        const hour = parseInt(item.dt_txt.slice(11, 13));
        return date === today && hour >= cityConfig.timeFrom && hour <= cityConfig.timeTo;
      });

      const maxPop = Math.round(Math.max(...slots.map((s: { pop?: number }) => s.pop ?? 0)) * 100);
      if (maxPop >= cityConfig.threshold) {
        alerts.push(`・${cityConfig.city}：${cityConfig.timeFrom}〜${cityConfig.timeTo}時の最大降水確率 <strong>${maxPop}%</strong>`);
      }
    }

    if (alerts.length === 0) continue;

    await resend.emails.send({
      from: "weather@resend.dev",
      to: config.email,
      subject: `☂️ 本日の雨予報をお知らせします（${alerts.length}都市）`,
      html: `
        <p>本日、以下の都市で雨の可能性があります。</p>
        ${alerts.map((a) => `<p>${a}</p>`).join("")}
        <p>傘をお忘れなく！</p>
        <hr/>
        <p style="color:#888;font-size:12px">通知設定は <a href="${process.env.NEXT_PUBLIC_APP_URL}">天気予報アプリ</a> から変更できます。</p>
      `,
    });
    sent++;
  }

  return NextResponse.json({ sent });
}
