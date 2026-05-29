import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { generateJSONRecommendation } from "@/lib/ai/gemini";

function isSupabaseMocked() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url || url.includes("your_supabase");
}

const LANDMARK_DETAILS: Record<string, {
  name: string;
  activities: string;
  educationalValue: string;
}> = {
  "p-1": {
    name: "대전교통문화연수원",
    activities: "어린이 교통 신호 준수 및 보행 안전 모의 실습, 지진/화재 가상현실 대피 요령 체득",
    educationalValue: "실생활 속 교통 안전 규칙을 몸소 체험하며 위기 대처 능력을 체득하고 안전 의식을 내면화하는 뜻깊은 교통 안전 교육의 기회"
  },
  "p-2": {
    name: "세종시립도서관",
    activities: "지역 대표 도서관 시설 투어, 공공기관의 역할 탐색 및 독서 큐레이팅 조별 탐구",
    educationalValue: "고장의 소중한 문화적 소통 공간을 탐방하여 공공기관의 실질적 역할과 가치를 깊이 있게 이해하는 유익한 인문학적 탐구 기회"
  },
  "p-3": {
    name: "국립세종수목원",
    activities: "식물의 한살이 야외 관찰 퀴즈 투어, 희귀 식물 생태 학습 및 반려식물 심기 실습",
    educationalValue: "직접 손으로 만지고 눈으로 관찰하며 자연환경과 식물 생태에 대한 생각의 힘을 기르고 환경 감수성을 높이는 뜻깊은 자연 탐구 기회"
  },
  "p-4": {
    name: "세종과학예술영재학교",
    activities: "융합 연구 캠퍼스 투어, 과학 예술 융합 시설 체험 및 첨단 천체 관측실 관람",
    educationalValue: "우리 고장의 첨단 과학기술 인프라를 눈으로 직접 확인하고 융합적 사고력 and 미래 인재로서의 지적 탐구심을 자극하는 뜻깊은 진로 탐구 기회"
  },
  "p-5": {
    name: "대통령기록관",
    activities: "역대 대통령 상징 유물 및 기록물 관람, 나만의 상징 도장 찍기 및 민주주의 기록 학습",
    educationalValue: "행정중심복합도시인 우리 고장의 역사적 탄생 유래를 살피고 헌법과 행정 기록물의 소중함을 몸소 배우는 뜻깊은 공공기관 및 역사 탐구 기회"
  }
};

export async function POST(req: NextRequest) {
  try {
    const { eventId, placeId, schoolName: clientSchoolName } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const matchedLandmark = LANDMARK_DETAILS[placeId] || LANDMARK_DETAILS["p-3"];

    let schoolName = clientSchoolName || "세종초등학교";
    let placeName = matchedLandmark.name;
    let grade = 3;
    let subject = "사회";
    let unit = "우리 고장의 모습";

    // 1. Fetch event from database
    if (!isSupabaseMocked()) {
      try {
        const supabase = createClient();
        const { data: event } = await supabase
          .from("events")
          .select(`
            grade,
            subject,
            unit,
            schools(name),
            places(name)
          `)
          .eq("id", eventId)
          .single();

        if (event) {
          grade = event.grade || grade;
          subject = event.subject || subject;
          unit = event.unit || unit;
          if (event.schools) {
            schoolName = (event.schools as any).name || schoolName;
          }
          if (event.places) {
            placeName = (event.places as any).name || placeName;
          }
        }
      } catch (err) {
        console.error("Failed to query data from Supabase:", err);
      }
    }

    // 2. Read parent_notice system prompt
    const promptPath = path.join(process.cwd(), "prompts", "parent_notice.md");
    let systemPrompt = "";
    try {
      systemPrompt = fs.readFileSync(promptPath, "utf-8");
    } catch (err) {
      console.error("Failed to read parent_notice.md:", err);
      systemPrompt = "학부모를 위한 따뜻한 가정통신문을 작성하십시오.";
    }

    // Interpolate variables
    const formattedPrompt = systemPrompt
      .replace("{schoolName}", schoolName)
      .replace("{placeName}", placeName)
      .replace("{grade}", grade.toString())
      .replace("{subject}", subject)
      .replace("{unit}", unit);

    const userPrompt = `${schoolName} 소속 ${grade}학년 현장체험학습 가정통신문 3종 팩을 생성하시오.`;

    // 3. Call Gemini
    let aiResponse: any;
    const isGeminiMock = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your_gemini");

    if (!isGeminiMock) {
      try {
        aiResponse = await generateJSONRecommendation(formattedPrompt, userPrompt);
      } catch (err) {
        console.error("Gemini parent_notice generation failed:", err);
      }
    }

    if (!aiResponse) {
      // Robust Fallback Mock JSON with dynamic place-specific learning content
      aiResponse = {
        notice: `안녕하세요, 학부모님! 🌸

새로운 봄날을 맞아 ${schoolName} ${grade}학년 어린이들을 위해 유익하고 안전한 현장체험학습을 준비했습니다. 
이번 체험활동은 **${subject} 교과 [${unit}]** 단원과 연계하여, **${placeName}**에서 ${matchedLandmark.activities} 등 ${matchedLandmark.educationalValue}가 될 것입니다.

무엇보다 저희 학교에서는 **교육청 안전관리 매뉴얼 규정**을 철저히 준수하여 준비했습니다.
국가 안전인증을 획득한 우수 체험처를 선정하였고, 학생 50명당 1명 의무 기준을 훨씬 초과하는 다수의 담임교사 및 공인 안전요원들이 밀착 동행하여 물샐틈없는 밀착 인솔을 약속드립니다. 미세먼지나 긴급 재난 발생 시에도 완벽한 실내 대체 안전 프로그램이 항시 대기하고 있으니 안심하셔도 좋습니다.

학생들의 건강하고 밝은 배움을 위해 아래 안내 사항을 확인해 주시고 많은 협조 부탁드립니다.`,
        consent: `### 현장체험학습 참가 및 안전 지도 동의서

| 질문 항목 | 작성 내용 |
| :--- | :--- |
| **학생 성명** | (예: 홍길동) |
| **학년 / 반** | ${grade}학년 ○반 |
| **보호자 성명** | (예: 홍판서) |
| **비상 연락처** | 010-○○○○-○○○○ |
| **의약품 및 특이사항** | 알레르기, 지병, 복용중인 약 등 기재 |
| **참가 여부** | [ ] 동의함  [ ] 동의하지 않음 |
`,
        kakao: `🚌 [${schoolName}] ${grade}학년 현장체험학습 안내문이 도착했습니다! 🌸

학부모님 안녕하십니까! 우리 아이들의 알찬 교과 탐구와 안전한 학습을 위해 **${placeName}** 현장체험학습을 다녀옵니다.

국가 인증 안전체험 관리와 다수의 인솔 인력이 밀착하여 지켜줄 예정이오니, 하단 링크를 눌러 가정통신문 확인 및 스마트 동의서를 작성 및 간편 제출해 주세요! ✍️

🔗 스마트 동의서 작성하기: [동의서 링크]`
      };
    }

    // 4. Save to Supabase
    let docId = Math.random().toString(36).substring(2, 15);
    if (!isSupabaseMocked()) {
      try {
        const supabase = createClient();
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .insert({
            event_id: eventId,
            type: "parent_notice",
            content: JSON.stringify(aiResponse),
          })
          .select("id")
          .single();

        if (docError) throw docError;
        docId = docData.id;
      } catch (err) {
        console.error("Failed to save parent_notice to Supabase:", err);
      }
    }

    // Unique Consent URL
    const consentUrl = `/consent/${eventId}`;

    return NextResponse.json({
      success: true,
      documentId: docId,
      notice: aiResponse.notice,
      consent: aiResponse.consent,
      kakao: aiResponse.kakao,
      consentUrl,
    });
  } catch (error: any) {
    console.error("API /document/parent-notice error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate parent notice" }, { status: 500 });
  }
}
