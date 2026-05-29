import { NextRequest, NextResponse } from "next/server";

const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY;

// ─────────────────────────────────────────────────────────────
// 하버사인 거리 계산 (km)
// ─────────────────────────────────────────────────────────────
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────
// Kakao Mobility Directions API
// ─────────────────────────────────────────────────────────────
async function fetchKakaoRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<{ path: { lat: number; lng: number }[]; distance: number; duration: number } | null> {
  if (!KAKAO_MAP_API_KEY) return null;

  try {
    const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
    url.searchParams.set("origin", `${originLng},${originLat}`);
    url.searchParams.set("destination", `${destLng},${destLat}`);
    url.searchParams.set("priority", "RECOMMEND");
    url.searchParams.set("car_fuel", "GASOLINE");
    url.searchParams.set("car_hipass", "false");
    url.searchParams.set("alternatives", "false");
    url.searchParams.set("road_details", "false");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`[Directions] Kakao Mobility HTTP ${res.status}: ${body}`);
      return null;
    }

    const data = await res.json();
    console.log("[Directions] Kakao Mobility result_code:", data.routes?.[0]?.result_code);

    if (
      !data.routes ||
      data.routes.length === 0 ||
      data.routes[0].result_code !== 0
    ) {
      return null;
    }

    const route = data.routes[0];
    const allVertexes: number[] = [];

    for (const section of route.sections || []) {
      for (const road of section.roads || []) {
        if (road.vertexes) allVertexes.push(...road.vertexes);
      }
    }

    if (allVertexes.length < 4) return null;

    // vertexes 형식: [lng1, lat1, lng2, lat2, ...]
    const path: { lat: number; lng: number }[] = [];
    for (let i = 0; i + 1 < allVertexes.length; i += 2) {
      path.push({ lng: allVertexes[i], lat: allVertexes[i + 1] });
    }

    return {
      path,
      distance: route.summary?.distance ?? 0,
      duration: route.summary?.duration ?? 0,
    };
  } catch (err) {
    console.error("[Directions] Kakao Mobility 오류:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// OSRM (Open Source Routing Machine) — 실제 OpenStreetMap 도로 데이터
// API 키 불필요, 완전 무료
// ─────────────────────────────────────────────────────────────
async function fetchOsrmRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<{ path: { lat: number; lng: number }[]; distance: number; duration: number } | null> {
  try {
    // OSRM 공개 서버: coordinates는 lng,lat 순서
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${originLng},${originLat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(url, {
      // Next.js cache: 1시간 캐시
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`[Directions] OSRM HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      console.warn("[Directions] OSRM 응답 이상:", data.code);
      return null;
    }

    const route = data.routes[0];
    // GeoJSON coordinates: [[lng, lat], [lng, lat], ...]
    const coords: [number, number][] = route.geometry?.coordinates ?? [];

    if (coords.length < 2) return null;

    const path = coords.map(([lng, lat]) => ({ lat, lng }));

    return {
      path,
      distance: Math.round(route.distance),   // metres
      duration: Math.round(route.duration),   // seconds
    };
  } catch (err) {
    console.error("[Directions] OSRM 오류:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/directions
// Body: { originLat, originLng, destLat, destLng }
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { originLat, originLng, destLat, destLng } = await req.json();

    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json(
        { error: "originLat, originLng, destLat, destLng are required" },
        { status: 400 }
      );
    }

    // 1순위: Kakao Mobility (실제 한국 도로 데이터 + 교통 정보)
    const kakaoResult = await fetchKakaoRoute(originLat, originLng, destLat, destLng);
    if (kakaoResult) {
      console.log(`[Directions] Kakao Mobility 성공 — ${kakaoResult.path.length}개 좌표, ${(kakaoResult.distance / 1000).toFixed(1)}km`);
      return NextResponse.json({
        success: true,
        source: "kakao_mobility",
        path: kakaoResult.path,
        distance: kakaoResult.distance,
        duration: kakaoResult.duration,
      });
    }

    // 2순위: OSRM (OpenStreetMap 실제 도로망, API 키 불필요)
    console.log("[Directions] Kakao Mobility 실패 → OSRM 시도");
    const osrmResult = await fetchOsrmRoute(originLat, originLng, destLat, destLng);
    if (osrmResult) {
      console.log(`[Directions] OSRM 성공 — ${osrmResult.path.length}개 좌표, ${(osrmResult.distance / 1000).toFixed(1)}km`);
      return NextResponse.json({
        success: true,
        source: "osrm",
        path: osrmResult.path,
        distance: osrmResult.distance,
        duration: osrmResult.duration,
      });
    }

    // 3순위: 최소 폴백 — 직선 두 점 (경로 없음보단 나음)
    console.warn("[Directions] 모든 라우팅 엔진 실패 — 직선 폴백 사용");
    const distKm = haversineKm(originLat, originLng, destLat, destLng);
    const estimatedDistance = Math.round(distKm * 1.35 * 1000);
    const estimatedDuration = Math.round((estimatedDistance / 1000 / 40) * 3600);

    return NextResponse.json({
      success: true,
      source: "fallback",
      path: [
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
      ],
      distance: estimatedDistance,
      duration: estimatedDuration,
    });
  } catch (error: any) {
    console.error("[Directions] Route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch directions" },
      { status: 500 }
    );
  }
}
