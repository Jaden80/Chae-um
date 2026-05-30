import { KakaoPlace } from "@/types/api";

const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY;

async function kakaoFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));

  const headers: Record<string, string> = {};
  if (KAKAO_MAP_API_KEY) {
    headers["Authorization"] = `KakaoAK ${KAKAO_MAP_API_KEY}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Kakao API Error [${res.status}]:`, errorText);
    throw new Error(`Kakao Maps API error: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address) return null;

  try {
    const data = await kakaoFetch<any>("https://dapi.kakao.com/v2/local/search/address.json", {
      query: address,
    });

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      return {
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x),
      };
    }
    return null;
  } catch (error) {
    console.error("geocode error:", error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const data = await kakaoFetch<any>("https://dapi.kakao.com/v2/local/geo/coord2address.json", {
      x: lng.toString(),
      y: lat.toString(),
    });

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      if (doc.road_address) {
        return doc.road_address.address_name;
      }
      return doc.address.address_name;
    }
    return null;
  } catch (error) {
    console.error("reverseGeocode error:", error);
    return null;
  }
}

export async function searchPlaces(
  keyword: string,
  lat?: number,
  lng?: number,
  radius?: number
): Promise<KakaoPlace[]> {
  if (!keyword) return [];

  const params: Record<string, string> = { query: keyword };
  
  if (lat && lng) {
    params["y"] = lat.toString();
    params["x"] = lng.toString();
    if (radius) {
      // Kakao keyword search API radius must be between 0 and 20000 meters. Clamp defensively!
      const clampedRadius = Math.min(20000, Math.max(0, radius));
      params["radius"] = clampedRadius.toString();
    }
  }

  try {
    const data = await kakaoFetch<any>("https://dapi.kakao.com/v2/local/search/keyword.json", params);
    
    if (data.documents) {
      return data.documents as KakaoPlace[];
    }
    return [];
  } catch (error) {
    console.error("searchPlaces error:", error);
    return [];
  }
}

export async function getRegionCode(
  lat: number,
  lng: number
): Promise<{ siDo: string; guGun: string } | null> {
  try {
    const data = await kakaoFetch<any>("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json", {
      x: lng.toString(),
      y: lat.toString(),
    });

    if (data.documents && data.documents.length > 0) {
      const doc = data.documents.find((d: any) => d.region_type === "B") || data.documents[0];
      const code = doc.code; // 예: "3611010300"
      if (code && code.length >= 5) {
        return {
          siDo: code.substring(0, 2),
          guGun: code.substring(0, 5),
        };
      }
    }
    return null;
  } catch (error) {
    console.error("getRegionCode error:", error);
    return null;
  }
}
