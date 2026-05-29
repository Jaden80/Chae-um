import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  
  const keyword = searchParams.get("keyword");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "5000";
  const category_group_code = searchParams.get("category_group_code");
  const page = searchParams.get("page") || "1";
  const size = searchParams.get("size") || "15";

  if (!keyword) {
    return NextResponse.json({ success: false, error: "keyword is required" }, { status: 400 });
  }

  const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY;
  if (!KAKAO_MAP_API_KEY) {
    return NextResponse.json({ success: false, error: "Kakao API key not configured" }, { status: 500 });
  }

  try {
    const kwUrl = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    kwUrl.searchParams.set("query", keyword);
    if (lat) kwUrl.searchParams.set("y", lat);
    if (lng) kwUrl.searchParams.set("x", lng);
    if (radius) kwUrl.searchParams.set("radius", radius);
    if (category_group_code) kwUrl.searchParams.set("category_group_code", category_group_code);
    if (page) kwUrl.searchParams.set("page", page);
    if (size) kwUrl.searchParams.set("size", size);

    const res = await fetch(kwUrl.toString(), {
      headers: {
        Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        "KA": "sdk/1.0.0 os/javascript origin/http://localhost:3000",
      },
    });

    if (!res.ok) {
      throw new Error(`Kakao API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[Kakao Search] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to search places" }, { status: 500 });
  }
}
