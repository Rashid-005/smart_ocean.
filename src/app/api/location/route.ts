import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  // Browser GPS coordinates echoed back when provided.
  if (lat !== null && lon !== null) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return NextResponse.json({
        success: true,
        location: {
          label: "Current location",
          latitude,
          longitude,
          source: "gps",
        },
      });
    }
  }

  // No known location.
  return NextResponse.json({ success: true, location: null });
}
