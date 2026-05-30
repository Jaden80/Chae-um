import { NextRequest, NextResponse } from "next/server";

const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY ?? "";

// ──────────────────────────────────────────────
// 기상청 LCC 격자 좌표 변환 (위경도 → nx, ny)
// ──────────────────────────────────────────────
function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  const ra = (re * sf) / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

// ──────────────────────────────────────────────
// 기상청 단기예보 — 특정 날짜의 대표 예보값 파싱
// ──────────────────────────────────────────────
function parseForecast(items: any[], targetDate: string) {
  const result: Record<string, string> = {};
  const priority = ["1200", "1500", "0900", "0600"];
  for (const item of items) {
    if (item.fcstDate !== targetDate) continue;
    const cat = item.category as string;
    if (!result[cat]) {
      result[cat] = item.fcstValue;
    }
    if (priority.includes(item.fcstTime)) {
      result[cat] = item.fcstValue;
    }
  }
  return result;
}

// ──────────────────────────────────────────────
// 시도명 추출 (에어코리아 API 'sidoName' 파라미터용)
// ──────────────────────────────────────────────
function getSidoName(address: string): string {
  const map: Record<string, string> = {
    서울: "서울",
    부산: "부산",
    대구: "대구",
    인천: "인천",
    광주: "광주",
    대전: "대전",
    울산: "울산",
    세종: "세종",
    경기: "경기",
    강원: "강원",
    충북: "충북",
    충남: "충남",
    전북: "전북",
    전남: "전남",
    경북: "경북",
    경남: "경남",
    제주: "제주",
  };
  for (const [key, val] of Object.entries(map)) {
    if (address.includes(key)) return val;
  }
  return "세종";
}

// ──────────────────────────────────────────────
// SKY / PTY 코드 → 날씨 한글 레이블
// ──────────────────────────────────────────────
function decodeWeather(sky: string, pty: string): string {
  if (pty === "1") return "비";
  if (pty === "2") return "비/눈";
  if (pty === "3") return "눈";
  if (pty === "4") return "소나기";
  if (sky === "1") return "맑음";
  if (sky === "3") return "구름 많음";
  if (sky === "4") return "흐림";
  return "알 수 없음";
}

// ──────────────────────────────────────────────
// 미세먼지 등급
// ──────────────────────────────────────────────
function pm10Grade(value: number): string {
  if (value <= 30) return "좋음";
  if (value <= 80) return "보통";
  if (value <= 150) return "나쁨";
  return "매우나쁨";
}

// ──────────────────────────────────────────────
// 중기예보 육상예보 코드 (위도/경도 기반 근사 매핑)
// 기상청 중기육상예보 regId 목록
// ──────────────────────────────────────────────
function getMidRegId(address: string): string {
  const map: Record<string, string> = {
    서울: "11B00000",
    인천: "11B00000",
    경기: "11B00000",
    강원: "11D10000",
    대전: "11C20000",
    세종: "11C20000",
    충남: "11C20000",
    충북: "11C10000",
    부산: "11H20000",
    울산: "11H20000",
    경남: "11H20000",
    대구: "11H10000",
    경북: "11H10000",
    광주: "11F20000",
    전남: "11F20000",
    전북: "11F10000",
    제주: "11G00000",
  };
  for (const [key, val] of Object.entries(map)) {
    if (address.includes(key)) return val;
  }
  return "11C20000"; // 기본값: 세종/대전
}

// 중기기온예보 stnId 매핑
function getMidTaStnId(address: string): string {
  const map: Record<string, string> = {
    서울: "109",
    인천: "112",
    경기: "119",
    강원: "105",
    대전: "133",
    세종: "133",
    충남: "133",
    충북: "131",
    부산: "159",
    울산: "152",
    경남: "155",
    대구: "143",
    경북: "143",
    광주: "156",
    전남: "156",
    전북: "146",
    제주: "184",
  };
  for (const [key, val] of Object.entries(map)) {
    if (address.includes(key)) return val;
  }
  return "133"; // 기본값: 대전
}

// ──────────────────────────────────────────────
// 중기예보 날씨 레이블 변환
// ──────────────────────────────────────────────
function decodeMidWeather(wf: string): string {
  if (!wf) return "알 수 없음";
  // 기상청 중기예보 wf 문자열 그대로 활용 (맑음, 구름많음, 흐림, 흐리고 비, 등)
  return wf;
}

// ──────────────────────────────────────────────
// GET /api/weather?lat=&lng=&date=YYYY-MM-DD&address=
// ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "36.48");
  const lng = parseFloat(searchParams.get("lng") ?? "127.289");
  const date = searchParams.get("date") ?? ""; // YYYY-MM-DD
  const address = searchParams.get("address") ?? "세종";

  if (!date) {
    return NextResponse.json({ error: "date 파라미터가 필요합니다." }, { status: 400 });
  }

  const dateStr = date.replace(/-/g, ""); // YYYYMMDD
  const { nx, ny } = latLonToGrid(lat, lng);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const selectedDate = new Date(date);
  const todayDate = new Date(today.toISOString().split("T")[0]);
  const diffDays = Math.floor((selectedDate.getTime() - todayDate.getTime()) / 86400000);

  if (diffDays < 0) {
    return NextResponse.json({ error: "오늘 이후 날짜를 선택해 주세요." }, { status: 400 });
  }

  // ── 미세먼지 (공통) ──────────────────────────
  let pm10Val: number | null = null;
  let pm10GradeLabel: string | null = null;
  let pm25Val: number | null = null;

  try {
    const sidoName = getSidoName(address);
    const dustUrl = new URL(
      "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty"
    );
    dustUrl.searchParams.set("serviceKey", DATA_GO_KR_API_KEY);
    dustUrl.searchParams.set("returnType", "json");
    dustUrl.searchParams.set("numOfRows", "10");
    dustUrl.searchParams.set("pageNo", "1");
    dustUrl.searchParams.set("sidoName", sidoName);
    dustUrl.searchParams.set("ver", "1.0");

    const dRes = await fetch(dustUrl.toString(), { cache: "no-store" });
    const dJson = await dRes.json();
    const dItems: any[] = dJson?.response?.body?.items ?? [];
    if (dItems.length > 0) {
      const d = dItems[0];
      pm10Val = parseInt(d.pm10Value) || null;
      pm25Val = parseInt(d.pm25Value) || null;
      if (pm10Val !== null) pm10GradeLabel = pm10Grade(pm10Val);
    }
  } catch (err) {
    console.error("에어코리아 미세먼지 오류:", err);
  }

  // ════════════════════════════════════════════
  // 분기: 2일 이내 → 단기예보 / 3일 이상 → 중기예보
  // ════════════════════════════════════════════

  if (diffDays <= 2) {
    // ── 단기예보 ──────────────────────────────
    let weatherLabel = "정보 없음";
    let tempMax = null as number | null;
    let tempMin = null as number | null;
    let precipitation = 0;
    let windspeed = null as number | null;
    let pop = null as number | null;

    try {
      const weatherUrl = new URL(
        "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
      );
      weatherUrl.searchParams.set("serviceKey", DATA_GO_KR_API_KEY);
      weatherUrl.searchParams.set("dataType", "JSON");
      weatherUrl.searchParams.set("numOfRows", "300");
      weatherUrl.searchParams.set("pageNo", "1");
      weatherUrl.searchParams.set("base_date", todayStr);
      weatherUrl.searchParams.set("base_time", "0500");
      weatherUrl.searchParams.set("nx", nx.toString());
      weatherUrl.searchParams.set("ny", ny.toString());

      const wRes = await fetch(weatherUrl.toString(), { cache: "no-store" });
      const wJson = await wRes.json();
      const items: any[] = wJson?.response?.body?.items?.item ?? [];
      const fc = parseForecast(items, dateStr);

      const sky = fc["SKY"] ?? "1";
      const pty = fc["PTY"] ?? "0";
      weatherLabel = decodeWeather(sky, pty);

      const tmxItems = items.filter((i) => i.category === "TMX" && i.fcstDate === dateStr);
      const tmnItems = items.filter((i) => i.category === "TMN" && i.fcstDate === dateStr);
      if (tmxItems.length > 0) tempMax = Math.round(parseFloat(tmxItems[0].fcstValue));
      if (tmnItems.length > 0) tempMin = Math.round(parseFloat(tmnItems[0].fcstValue));

      if (tempMax === null) {
        const tmpItems = items.filter((i) => i.category === "TMP" && i.fcstDate === dateStr);
        if (tmpItems.length > 0) {
          const vals = tmpItems.map((i) => parseFloat(i.fcstValue));
          tempMax = Math.round(Math.max(...vals));
          tempMin = Math.round(Math.min(...vals));
        }
      }

      const popItems = items.filter((i) => i.category === "POP" && i.fcstDate === dateStr);
      if (popItems.length > 0) {
        pop = Math.max(...popItems.map((i) => parseFloat(i.fcstValue)));
      }

      const pcpItems = items.filter(
        (i) => i.category === "PCP" && i.fcstDate === dateStr && i.fcstValue !== "강수없음"
      );
      if (pcpItems.length > 0) {
        const pVal = pcpItems[0].fcstValue.replace("mm", "").replace("1mm미만", "0.5").trim();
        precipitation = parseFloat(pVal) || 0;
      }

      const wsdItems = items.filter((i) => i.category === "WSD" && i.fcstDate === dateStr);
      if (wsdItems.length > 0) {
        windspeed = Math.max(...wsdItems.map((i) => parseFloat(i.fcstValue)));
      }
    } catch (err) {
      console.error("기상청 단기예보 오류:", err);
    }

    return NextResponse.json({
      forecastType: "short",
      daysUntil: diffDays,
      date,
      nx,
      ny,
      weatherLabel,
      tempMax,
      tempMin,
      precipitation,
      windspeed,
      pop,
      pm10: pm10Val,
      pm10Grade: pm10GradeLabel,
      pm25: pm25Val,
    });
  } else {
    // ── 중기예보 (4~10일) ──────────────────────
    // 기상청 중기예보 base_time: 06시 or 18시 발표
    // base_time 기준: 오전 6시 발표 → tmFc = YYYYMMDD0600
    //                 오후 6시 발표 → tmFc = YYYYMMDD1800
    // 현재 시각에 따라 가장 최신 발표 기준 사용
    const nowHour = today.getHours();
    const baseTmFc = nowHour >= 18
      ? `${todayStr}1800`
      : nowHour >= 6
      ? `${todayStr}0600`
      : (() => {
          // 자정~6시: 전날 18시 발표
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const ydStr = yesterday.toISOString().split("T")[0].replace(/-/g, "");
          return `${ydStr}1800`;
        })();

    // 중기예보는 D+3 ~ D+10 제공. 오늘로부터 diffDays 일 후 → 예보 키는 "after{diffDays}Day"
    // API 필드명: wf3Am, wf4Am ... wf10Am (오전), wf3Pm ... wf10Pm (오후)
    // 기온: taMin3 ~ taMin10, taMax3 ~ taMax10
    const dayKey = diffDays; // 3~10

    const regId = getMidRegId(address);
    const stnId = getMidTaStnId(address);

    let midWeatherLabel = "정보 없음";
    let midTempMax: number | null = null;
    let midTempMin: number | null = null;
    let midRnSt: number | null = null; // 강수확률

    // 중기육상예보 (날씨 상태, 강수확률)
    try {
      const midFcstUrl = new URL(
        "http://apis.data.go.kr/1360000/MidFcstInfoService/getMidFcst"
      );
      midFcstUrl.searchParams.set("serviceKey", DATA_GO_KR_API_KEY);
      midFcstUrl.searchParams.set("pageNo", "1");
      midFcstUrl.searchParams.set("numOfRows", "10");
      midFcstUrl.searchParams.set("dataType", "JSON");
      midFcstUrl.searchParams.set("regId", regId);
      midFcstUrl.searchParams.set("tmFc", baseTmFc);

      const mfRes = await fetch(midFcstUrl.toString(), { cache: "no-store" });
      const mfJson = await mfRes.json();
      const mfItem = mfJson?.response?.body?.items?.item?.[0];

      if (mfItem) {
        // 오전/오후 날씨 상태 통합
        const wfAmKey = `wf${dayKey}Am`;
        const wfPmKey = `wf${dayKey}Pm`;
        const wfAm: string = mfItem[wfAmKey] ?? "";
        const wfPm: string = mfItem[wfPmKey] ?? "";
        // 더 나쁜 날씨 우선
        const badnessOrder = ["눈", "비", "비/눈", "소나기", "흐리고", "구름많", "흐림", "구름조금", "맑음"];
        const pickWorse = (a: string, b: string) => {
          const ia = badnessOrder.findIndex((k) => a.includes(k));
          const ib = badnessOrder.findIndex((k) => b.includes(k));
          if (ia === -1 && ib === -1) return a || b;
          if (ia === -1) return b;
          if (ib === -1) return a;
          return ia <= ib ? a : b;
        };
        const wf = pickWorse(wfAm, wfPm);
        midWeatherLabel = decodeMidWeather(wf) || "정보 없음";

        // 강수확률: rnSt{N}Am, rnSt{N}Pm 중 최대값
        const rnAmKey = `rnSt${dayKey}Am`;
        const rnPmKey = `rnSt${dayKey}Pm`;
        const rnAm = mfItem[rnAmKey] != null ? Number(mfItem[rnAmKey]) : null;
        const rnPm = mfItem[rnPmKey] != null ? Number(mfItem[rnPmKey]) : null;
        if (rnAm !== null || rnPm !== null) {
          midRnSt = Math.max(rnAm ?? 0, rnPm ?? 0);
        }
      }
    } catch (err) {
      console.error("기상청 중기육상예보 오류:", err);
    }

    // 중기기온예보 (최고/최저 기온)
    try {
      const midTaUrl = new URL(
        "http://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa"
      );
      midTaUrl.searchParams.set("serviceKey", DATA_GO_KR_API_KEY);
      midTaUrl.searchParams.set("pageNo", "1");
      midTaUrl.searchParams.set("numOfRows", "10");
      midTaUrl.searchParams.set("dataType", "JSON");
      midTaUrl.searchParams.set("regId", stnId);
      midTaUrl.searchParams.set("tmFc", baseTmFc);

      const mtRes = await fetch(midTaUrl.toString(), { cache: "no-store" });
      const mtJson = await mtRes.json();
      const mtItem = mtJson?.response?.body?.items?.item?.[0];

      if (mtItem) {
        const maxKey = `taMax${dayKey}`;
        const minKey = `taMin${dayKey}`;
        if (mtItem[maxKey] != null) midTempMax = Number(mtItem[maxKey]);
        if (mtItem[minKey] != null) midTempMin = Number(mtItem[minKey]);
      }
    } catch (err) {
      console.error("기상청 중기기온예보 오류:", err);
    }

    return NextResponse.json({
      forecastType: "medium",
      daysUntil: diffDays,
      date,
      nx,
      ny,
      weatherLabel: midWeatherLabel,
      tempMax: midTempMax,
      tempMin: midTempMin,
      precipitation: 0,
      windspeed: null,
      pop: midRnSt,
      pm10: pm10Val,
      pm10Grade: pm10GradeLabel,
      pm25: pm25Val,
    });
  }
}
