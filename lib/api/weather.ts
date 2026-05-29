import { Forecast, DustData } from "@/types/api";

const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY;

const BASE_WEATHER_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const BASE_DUST_URL = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty";

export async function getForecast(
  nx: number,
  ny: number,
  dateStr: string // YYYYMMDD
): Promise<Forecast | null> {
  const url = new URL(BASE_WEATHER_URL);
  url.searchParams.append("dataType", "JSON");
  url.searchParams.append("numOfRows", "100");
  url.searchParams.append("pageNo", "1");
  url.searchParams.append("base_date", dateStr);
  url.searchParams.append("base_time", "0500"); // 오전 5시 발표 기준
  url.searchParams.append("nx", nx.toString());
  url.searchParams.append("ny", ny.toString());
  
  if (DATA_GO_KR_API_KEY) {
    url.searchParams.append("serviceKey", DATA_GO_KR_API_KEY);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Weather API error: ${res.statusText}`);
    }

    const data = await res.json();
    
    if (data.response?.body?.items?.item) {
      return {
        baseDate: dateStr,
        baseTime: "0500",
        items: data.response.body.items.item.map((item: any) => ({
          category: item.category,
          fcstDate: item.fcstDate,
          fcstTime: item.fcstTime,
          fcstValue: item.fcstValue,
          nx: item.nx,
          ny: item.ny,
        })),
      };
    }
    return null;
  } catch (error) {
    console.error("getForecast error:", error);
    return null;
  }
}

export async function getDustForecast(area: string): Promise<DustData | null> {
  const url = new URL(BASE_DUST_URL);
  url.searchParams.append("returnType", "json");
  url.searchParams.append("numOfRows", "50");
  url.searchParams.append("pageNo", "1");
  url.searchParams.append("sidoName", area); // '세종', '서울' 등
  url.searchParams.append("ver", "1.0");
  
  if (DATA_GO_KR_API_KEY) {
    url.searchParams.append("serviceKey", DATA_GO_KR_API_KEY);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Dust API error: ${res.statusText}`);
    }

    const data = await res.json();
    
    if (data.response?.body?.items && data.response.body.items.length > 0) {
      const item = data.response.body.items[0]; // 대표 측정소 기준
      return {
        dataTime: item.dataTime || "",
        pm10Value: item.pm10Value || "0",
        pm25Value: item.pm25Value || "0",
        pm10Grade: item.pm10Grade || "1",
        pm25Grade: item.pm25Grade || "1",
      };
    }
    return null;
  } catch (error) {
    console.error("getDustForecast error:", error);
    return null;
  }
}
