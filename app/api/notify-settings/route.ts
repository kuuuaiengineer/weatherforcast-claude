import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export type NotifyConfig = {
  email: string;
  city: string;
  timeFrom: number;
  timeTo: number;
  threshold: number;
};

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const config = await kv.get<NotifyConfig>(`notify:${email}`);
  return NextResponse.json(config ?? null);
}

export async function POST(req: NextRequest) {
  const body: NotifyConfig = await req.json();
  if (!body.email || !body.city) {
    return NextResponse.json({ error: "email and city required" }, { status: 400 });
  }
  await kv.set(`notify:${body.email}`, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  await kv.del(`notify:${email}`);
  return NextResponse.json({ ok: true });
}
