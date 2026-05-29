import React from "react";
import { SearchForm } from "@/components/feature/SearchForm";
import { SchoolInfoCard } from "@/components/feature/SchoolInfoCard";
import RecentHistory from "@/components/feature/RecentHistory";
import { ShieldCheck } from "lucide-react";
import TeacherProfileButton from "@/components/feature/TeacherProfileButton";

// Types for fetched / mock data
interface SchoolData {
  name: string;
  address: string;
  grade: string;
  teacherName: string;
}

interface EventItem {
  id: string;
  subject: string;
  grade: number;
  unit: string;
  created_at: string;
  status: string;
  place_name?: string;
  place_id?: string;
}

// Function to fetch school data with fallback
async function getSchoolData(): Promise<SchoolData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = !supabaseUrl || supabaseUrl.includes("your_supabase");

  if (!isMock) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch user and join school
        const { data: userData } = await supabase
          .from("users")
          .select("name, school_id, schools(name, address)")
          .eq("id", user.id)
          .single();

        if (userData && userData.schools) {
          const school = userData.schools as any;
          return {
            name: school.name,
            address: school.address || "주소 정보 없음",
            grade: "담당 학년",
            teacherName: userData.name || "선생님",
          };
        }
      }
    } catch (e) {
      console.error("Failed to fetch school data from Supabase:", e);
    }
  }

  // Robust fallback mock data
  return {
    name: "세종초등학교",
    address: "세종특별자치시 반곡동",
    grade: "3학년 1반",
    teacherName: "홍길동",
  };
}

// Function to fetch recent events with fallback
async function getRecentEvents(): Promise<EventItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = !supabaseUrl || supabaseUrl.includes("your_supabase");

  if (!isMock) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: events } = await supabase
          .from("events")
          .select(`
            id,
            subject,
            grade,
            unit,
            created_at,
            status,
            selected_place_id,
            places(name)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (events) {
          return events.map((ev: any) => ({
            id: ev.id,
            subject: ev.subject || "기타",
            grade: ev.grade || 1,
            unit: ev.unit || "체험활동",
            created_at: new Date(ev.created_at).toLocaleDateString("ko-KR"),
            status: ev.status,
            place_name: ev.places?.name,
            place_id: ev.selected_place_id,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch recent events from Supabase:", e);
    }
  }

  // Fallback mock events
  return [
    {
      id: "mock-1",
      subject: "사회",
      grade: 3,
      unit: "우리 고장의 모습",
      created_at: "2026. 05. 15",
      status: "completed",
      place_name: "세종안전체험관",
      place_id: "place-1",
    },
    {
      id: "mock-2",
      subject: "과학",
      grade: 4,
      unit: "식물의 한살이",
      created_at: "2026. 05. 10",
      status: "document_ready",
      place_name: "국립세종수목원",
      place_id: "place-2",
    },
    {
      id: "mock-3",
      subject: "사회",
      grade: 5,
      unit: "국토와 우리 생활",
      created_at: "2026. 05. 08",
      status: "selected",
      place_name: "독도체험관",
      place_id: "place-3",
    },
    {
      id: "mock-4",
      subject: "과학",
      grade: 6,
      unit: "우리 몸의 구조",
      created_at: "2026. 05. 01",
      status: "searching",
    },
  ];
}

export default async function SearchPage() {
  const schoolData = await getSchoolData();

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-6 px-4">
      {/* 1. 상단 헤더 */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="flex-1">
          <SchoolInfoCard
            schoolName={schoolData.name}
            address={schoolData.address}
            grade={schoolData.grade}
            teacherName={schoolData.teacherName}
          />
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <TeacherProfileButton />
        </div>
      </header>

      {/* 2. 중앙 히어로 영역 */}
      <section className="space-y-8 text-center py-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
            <ShieldCheck className="w-4 h-4" />
            안전 인증 현장체험학습 AI 큐레이터
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight md:leading-normal">
            어떤 체험학습을 계획하세요?
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto font-medium">
            현장체험학습 주제에 딱 맞는 추천부터 위험도 분석, 행정문서 생성까지 교사의 안전 체험학습 파트너
          </p>
        </div>

        {/* 폼 렌더링 */}
        <SearchForm />
      </section>

      {/* 3. 최근 추천 이력 섹션 */}
      <section className="pt-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-150 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <h2 className="text-xl font-bold text-slate-800">최근 추천 이력</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">누가 기록 (최신순)</span>
        </div>
        <RecentHistory />
      </section>
    </div>
  );
}
