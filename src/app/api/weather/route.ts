import { NextResponse } from "next/server";

import { getLatestWeather } from "@/lib/zones";

export async function GET() {
  const weather = await getLatestWeather();
  // The internal data-origin label is never exposed to users.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { source, ...weatherOut } = weather;
  return NextResponse.json({ success: true, weather: weatherOut });
}
