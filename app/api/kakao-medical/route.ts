import { NextRequest, NextResponse } from "next/server";

const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY;

/**
 * 카카오 로컬 API로 인근 의료기관을 검색합니다.
 * 응급실, 종합병원 우선 검색 후 병원, 의원 검색
 * 치과, 피부과 등 불필요한 병원 제외
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseInt(searchParams.get("radius") || "5000"); // 기본 5km

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat, lng are required" }, { status: 400 });
  }

  if (!KAKAO_MAP_API_KEY) {
    return NextResponse.json({ error: "Kakao API key not configured" }, { status: 500 });
  }

  let foundPlaces: any[] = [];
  const excludeKeywords = [
    "치과", "한의원", "피부과", "성형외과", "안과", "요양", "동물병원", "산후조리원",
    "산부인과", "정신", "이비인후과", "비뇨기과", "소아과", "내과", "재활", "떡볶이", "분식", "식당"
  ];

  for (const keyword of ["응급실", "보건소", "종합병원", "정형외과", "외과", "병원"]) {
    try {
      const kwUrl = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
      kwUrl.searchParams.set("query", keyword);
      kwUrl.searchParams.set("x", String(lng));
      kwUrl.searchParams.set("y", String(lat));
      kwUrl.searchParams.set("radius", String(Math.min(radius, 10000))); // 반경 최대 10km
      kwUrl.searchParams.set("sort", "distance");
      kwUrl.searchParams.set("size", "10");

      const kwRes = await fetch(kwUrl.toString(), {
        headers: {
          Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}`,
          "KA": "sdk/1.0.0 os/javascript origin/http://localhost:3000",
        },
      });

      if (!kwRes.ok) continue;

      const kwData = await kwRes.json();
      const places: any[] = kwData.documents || [];

      // 필터링
      for (const p of places) {
        // 이미 추가된 곳인지 (ID로 확인)
        if (foundPlaces.find(fp => fp.id === p.id)) continue;
        
        // 음식점이나 카페 등 명백히 병원이 아닌 카테고리 제외 (FD6: 음식점, CE7: 카페)
        if (p.category_group_code === "FD6" || p.category_group_code === "CE7") continue;
        if (p.category_name && (p.category_name.includes("음식") || p.category_name.includes("식당"))) continue;

        // 원치 않는 병원 제외
        const isExcluded = excludeKeywords.some(ex => p.place_name.includes(ex));
        if (isExcluded) continue;

        foundPlaces.push(p);
      }
      
      // 5개 이상 찾았으면 그만 (응급실, 종합병원 우선 확보)
      if (foundPlaces.length >= 5) break;

    } catch (err) {
      console.error(`[kakao-medical] 키워드 "${keyword}" 오류:`, err);
    }
  }

  if (foundPlaces.length > 0) {
    // 거리순 정렬
    foundPlaces.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));
    const topPlaces = foundPlaces.slice(0, 5).map(buildPlaceData);
    
    return NextResponse.json({
      success: true,
      places: topPlaces, // 배열 반환
      summary: topPlaces[0].summary, // 기존 호환성을 위해 첫 번째 유지
      nearest: topPlaces[0]
    });
  }

  return NextResponse.json({
    success: false,
    error: "인근 의료기관을 찾을 수 없습니다.",
  });
}

function buildPlaceData(place: any) {
  const distanceM = parseInt(place.distance || "0");
  const distanceKm =
    distanceM >= 1000
      ? `${(distanceM / 1000).toFixed(1)}km`
      : `${distanceM}m`;
  const driveMinutes = Math.max(1, Math.ceil((distanceM / 1000 / 40) * 60));
  const timeText = `차량 약 ${driveMinutes}분`;
  const summary = `${place.place_name} (${distanceKm}, ${timeText})`;

  return {
    id: place.id,
    name: place.place_name,
    address: place.road_address_name || place.address_name,
    phone: place.phone || "",
    distanceText: distanceKm,
    timeText,
    summary,
  };
}
