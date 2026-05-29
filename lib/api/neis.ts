import { School, SchoolDetail } from "@/types/api";

const NEIS_API_KEY = process.env.NEIS_API_KEY;
const BASE_URL = "https://open.neis.go.kr/hub/schoolInfo";

export async function searchSchool(name: string): Promise<School[]> {
  if (!name) return [];

  const url = new URL(BASE_URL);
  url.searchParams.append("Type", "json");
  url.searchParams.append("pIndex", "1");
  url.searchParams.append("pSize", "20");
  url.searchParams.append("SCHUL_NM", name);
  if (NEIS_API_KEY) {
    url.searchParams.append("KEY", NEIS_API_KEY);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`NEIS API error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
      return data.schoolInfo[1].row as School[];
    }
    
    // API might return error message in JSON
    if (data.RESULT && data.RESULT.CODE !== "INFO-0000") {
      console.warn(`NEIS Info result: ${data.RESULT.MESSAGE}`);
    }
    return [];
  } catch (error) {
    console.error("searchSchool error:", error);
    throw error;
  }
}

export async function getSchoolDetail(eduOfficeCode: string, schoolCode: string): Promise<SchoolDetail | null> {
  if (!eduOfficeCode || !schoolCode) return null;

  const url = new URL(BASE_URL);
  url.searchParams.append("Type", "json");
  url.searchParams.append("ATPT_OFCDC_SC_CODE", eduOfficeCode);
  url.searchParams.append("SD_SCH_CODE", schoolCode);
  if (NEIS_API_KEY) {
    url.searchParams.append("KEY", NEIS_API_KEY);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`NEIS Detail API error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
      const rows = data.schoolInfo[1].row as SchoolDetail[];
      return rows[0] || null;
    }
    return null;
  } catch (error) {
    console.error("getSchoolDetail error:", error);
    throw error;
  }
}
