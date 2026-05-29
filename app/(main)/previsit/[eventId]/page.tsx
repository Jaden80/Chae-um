"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle, ShieldAlert, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacilityData {
  success: boolean;
  placeName?: string;
  certification?: {
    isCertified: boolean;
    certNo?: string;
    certPeriod?: string;
    safetyLevel?: string;
    programName?: string;
  } | null;
  facility?: {
    area?: string;
    phone?: string;
    operator?: string;
  } | null;
}

export default function PreVisitChecklistPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const eventId = params.eventId as string;
  const placeId = searchParams.get("placeId");
  const autoLoad = searchParams.get("auto") === "true";
  const urlPlaceName = searchParams.get("placeName");
  const urlAddress = searchParams.get("address");
  const urlPlaceLat = parseFloat(searchParams.get("placeLat") || "0");
  const urlPlaceLng = parseFloat(searchParams.get("placeLng") || "0");
  const urlSchoolLat = parseFloat(searchParams.get("schoolLat") || "0");
  const urlSchoolLng = parseFloat(searchParams.get("schoolLng") || "0");

  const [loading, setLoading] = useState(true);
  const [placeName, setPlaceName] = useState("체험장소");
  const [placeAddress, setPlaceAddress] = useState("");
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [apiError, setApiError] = useState("");

  // 카카오맵 자동입력 상태
  const [medicalLoading, setMedicalLoading] = useState(false);
  const [travelLoading, setTravelLoading] = useState(false);
  const [medicalAutoFilled, setMedicalAutoFilled] = useState(false);
  const [travelAutoFilled, setTravelAutoFilled] = useState(false);
  const [medicalPlaces, setMedicalPlaces] = useState<any[]>([]);

  const printRef = useRef<HTMLDivElement>(null);

  // Form State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [highRiskActivities, setHighRiskActivities] = useState<string[]>([]);
  
  const hasHighRisk = highRiskActivities.length > 0;

  // ── 카카오맵 인근 의료기관 검색 ──────────────────────────────
  const fetchMedicalInfo = async (lat: number, lng: number, radius = 3000) => {
    if (!lat || !lng) return;
    setMedicalLoading(true);
    try {
      const res = await fetch(`/api/kakao-medical?lat=${lat}&lng=${lng}&radius=${radius}`);
      const data = await res.json();
      if (res.ok && data.success && data.summary) {
        if (data.places) setMedicalPlaces(data.places);
        setAnswers(prev => ({ ...prev, "2-7": data.summary }));
        setMedicalAutoFilled(true);
      }
    } catch (err) {
      console.error("[medical] 의료기관 조회 실패:", err);
    } finally {
      setMedicalLoading(false);
    }
  };

  // ── 카카오 Mobility 편도 소요시간 계산 ────────────────────────
  const fetchTravelTime = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    if (!originLat || !originLng || !destLat || !destLng) return;
    setTravelLoading(true);
    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originLat, originLng, destLat, destLng }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.duration) {
        const minutes = Math.ceil(data.duration / 60);
        setAnswers(prev => ({ ...prev, "3-3": String(minutes) }));
        setTravelAutoFilled(true);
      }
    } catch (err) {
      console.error("[travel] 소요시간 조회 실패:", err);
    } finally {
      setTravelLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const pName = urlPlaceName || "대한민국역사박물관";
      const pAddr = urlAddress || "서울 종로구 세종대로 198";

      setPlaceName(pName);
      setPlaceAddress(pAddr);

      if (autoLoad) {
        // e청소년 인증 데이터 조회
        try {
          const res = await fetch(`/api/facility?placeName=${encodeURIComponent(pName)}&address=${encodeURIComponent(pAddr)}`);
          const data = await res.json();
          if (res.ok && data.success) {
            setFacilityData(data);
            const newAnswers: Record<string, string> = {};
            if (data.certification?.isCertified) {
              newAnswers["1-1"] = "양호";
            }
            if (data.facility?.area && data.facility.area !== "정보없음") {
              newAnswers["1-3_desc"] = `연면적: ${data.facility.area} (자동불러옴)`;
              newAnswers["1-3"] = "양호";
            }
            setAnswers(prev => ({ ...prev, ...newAnswers }));
          } else {
            setApiError("공공데이터 연결 실패 - 직접 입력으로 전환합니다.");
          }
        } catch {
          setApiError("공공데이터 연결 실패 - 직접 입력으로 전환합니다.");
        }

        // 카카오맵 의료기관 자동 조회 (좌표가 있을 때만)
        if (urlPlaceLat && urlPlaceLng) {
          await fetchMedicalInfo(urlPlaceLat, urlPlaceLng);
        }

        // 카카오 내비 편도 소요시간 자동 조회
        if (urlSchoolLat && urlSchoolLng && urlPlaceLat && urlPlaceLng) {
          await fetchTravelTime(urlSchoolLat, urlSchoolLng, urlPlaceLat, urlPlaceLng);
        }
      }
      setLoading(false);
    };

    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId, autoLoad, urlPlaceLat, urlPlaceLng, urlSchoolLat, urlSchoolLng]);


  const handleRadio = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleText = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const toggleHighRisk = (activity: string) => {
    setHighRiskActivities(prev => 
      prev.includes(activity) ? prev.filter(a => a !== activity) : [...prev, activity]
    );
  };

  // Evaluation Logic
  const evaluate = () => {
    let failCount = 0;
    let warningCount = 0;

    // Required items (Fail -> failCount++)
    const requiredItems = ["1-2", "2-1", "2-2"];
    requiredItems.forEach(id => {
      if (answers[id] === "부적합") failCount++;
    });

    // General items (Warning -> warningCount++)
    const allItems = Object.keys(answers);
    allItems.forEach(id => {
      if (!requiredItems.includes(id) && answers[id] === "불량") {
        warningCount++;
      }
    });

    if (failCount > 0) return { status: "🔴 방문불가", desc: "필수 항목 중 부적합이 있어 방문이 불가합니다.", color: "text-red-600 bg-red-50 border-red-200" };
    if (warningCount >= 3) return { status: "🟡 주의", desc: "불량 항목이 3개 이상입니다. 관리자 승인이 권고됩니다.", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { status: "🟢 실시 가능", desc: "안전 점검 기준을 통과하였습니다.", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  };

  const result = evaluate();

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-xl font-bold text-slate-800">체험장소 데이터 불러오는 중...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4 print:py-0 print:px-0">
      {/* Non-printable Header Actions */}
      <div className="print:hidden flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 -ml-4"
        >
          <ArrowLeft className="w-4 h-4" />
          장소 상세로 돌아가기
        </Button>
        <Button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2 rounded-xl">
          <Printer className="w-4 h-4" />
          보고서 PDF 저장 (인쇄)
        </Button>
      </div>

      {apiError && (
        <div className="print:hidden flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {apiError}
        </div>
      )}

      {/* Printable Area */}
      <div ref={printRef} className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm print:shadow-none print:border-none print:p-0 space-y-8">
        
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">현장답사 결과보고서 (사전 안전점검)</h1>
          <p className="text-slate-500 font-semibold">세종특별자치시교육청 현장체험학습 길라잡이 부록 양식 준용</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex bg-slate-50 border rounded-lg p-3">
            <span className="w-24 font-bold text-slate-700">점검일시</span>
            <span className="text-slate-600">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex bg-slate-50 border rounded-lg p-3">
            <span className="w-24 font-bold text-slate-700">점검자</span>
            <input type="text" className="bg-transparent border-b border-slate-300 focus:outline-none w-full" placeholder="성명 입력" />
          </div>
          <div className="flex bg-slate-50 border rounded-lg p-3 col-span-2">
            <span className="w-24 font-bold text-slate-700">대상장소</span>
            <span className="text-slate-600 font-bold">{placeName} <span className="font-normal text-xs ml-2">({placeAddress})</span></span>
          </div>
        </div>

        {/* API Auto Load Result Info */}
        {facilityData?.certification?.isCertified && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-4 text-sm print:break-inside-avoid">
            <ShieldAlert className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-blue-800 mb-1">e청소년 인증프로그램 정보 자동반영됨</p>
              <ul className="list-disc pl-4 text-blue-700 space-y-1">
                <li>인증번호: {facilityData.certification.certNo}</li>
                <li>유효기간: {facilityData.certification.certPeriod}</li>
                <li>프로그램명: {facilityData.certification.programName}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <ChecklistSection title="[영역1] 시설 기본 적격성">
            <CheckItem id="1-1" label="관할 기관 안전점검 실시 여부 (e청소년 인증)" type="normal" answers={answers} onChange={handleRadio} autoFilled={!!facilityData?.certification?.isCertified} />
            <CheckItem id="1-2" label="시설 영업 허가·등록 유효 여부" type="required" answers={answers} onChange={handleRadio} />
            <CheckItem id="1-3" label="학급 단위 수용 가능 규모 확인" type="normal" answers={answers} onChange={handleRadio} descInput={true} onDescChange={handleText} />
            <CheckItem id="1-4" label="우천·폭염 시 대체 실내 공간 유무" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="1-5" label="초등 발달단계 적합 환경 여부" type="normal" answers={answers} onChange={handleRadio} />
          </ChecklistSection>

          <ChecklistSection title="[영역2] 안전·비상 대응 체계">
            <CheckItem id="2-1" label="비상구·대피로 확보 및 표시" type="required" answers={answers} onChange={handleRadio} />
            <CheckItem id="2-2" label="소화기 위치 확인 및 정상 작동" type="required" answers={answers} onChange={handleRadio} />
            <CheckItem id="2-3" label="CCTV 설치·정상 녹화 여부" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="2-4" label="계단·난간 미끄럼방지 장치" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="2-5" label="날카로운 모서리·돌출물 위험 요소 유무" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="2-6" label="인근 위험지역 접근 차단 여부" type="normal" answers={answers} onChange={handleRadio} />
            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-800">2-7. 인근 의료기관 위치 및 거리</span>
                {medicalLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-blue-500 font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" /> 검색 중...
                  </span>
                )}
                {medicalAutoFilled && !medicalLoading && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">자동</span>
                )}
              </div>
              {medicalPlaces.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {medicalPlaces.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        handleText("2-7", place.summary);
                        setMedicalAutoFilled(false);
                      }}
                      className={`text-xs px-2.5 py-1.5 border rounded-md transition-colors ${
                        answers["2-7"] === place.summary 
                          ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm" 
                          : "bg-white text-slate-600 hover:bg-slate-100 border-slate-300"
                      }`}
                    >
                      {place.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  className={`border rounded-md px-3 py-2 text-sm w-full transition-colors ${
                    medicalAutoFilled ? "border-blue-300 bg-blue-50/40" : ""
                  }`}
                  placeholder="예: 세종병원 응급실 (2.1km, 차량 약 4분)"
                  value={answers["2-7"] || ""}
                  onChange={(e) => { handleText("2-7", e.target.value); setMedicalAutoFilled(false); }}
                />
                {medicalLoading && (
                  <div className="absolute inset-0 bg-white/60 rounded-md flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              {medicalAutoFilled && (
                <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 카카오맵 실시간 검색 결과가 자동으로 입력되었습니다.
                </p>
              )}
            </div>
          </ChecklistSection>

          <ChecklistSection title="[영역3] 이동 경로 안전">
            <CheckItem id="3-1" label="교통사고 다발 구간 경유 여부" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="3-2" label="차량 주차 및 안전한 승하차 공간 확보" type="normal" answers={answers} onChange={handleRadio} />
            <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-800">3-3. 편도 이동 소요 시간</span>
                {travelLoading && (
                  <span className="flex items-center gap-1 text-[11px] text-indigo-500 font-semibold">
                    <Loader2 className="w-3 h-3 animate-spin" /> 계산 중...
                  </span>
                )}
                {travelAutoFilled && !travelLoading && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">자동</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="number"
                    className={`border rounded-md px-3 py-2 text-sm w-36 transition-colors ${
                      travelAutoFilled ? "border-indigo-300 bg-indigo-50/40" : ""
                    }`}
                    placeholder="소요 시간(분)"
                    value={answers["3-3"] || ""}
                    onChange={(e) => { handleText("3-3", e.target.value); setTravelAutoFilled(false); }}
                  />
                  {travelLoading && (
                    <div className="absolute inset-0 bg-white/60 rounded-md flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-500 font-semibold">분</span>
              </div>
              {travelAutoFilled && (
                <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 카카오 내비 경로 기준 소요시간이 자동으로 입력되었습니다.
                </p>
              )}
            </div>
            <CheckItem id="3-4" label="유해환경 인접 여부" type="normal" answers={answers} onChange={handleRadio} />
          </ChecklistSection>


          <ChecklistSection title="[영역4] 위생·식품 안전">
            <CheckItem id="4-1" label="화장실 수 및 청결 상태" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="4-2" label="식당 위생 상태" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="4-3" label="식수대 위생 상태" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="4-4" label="냉난방·환기 적정 여부" type="normal" answers={answers} onChange={handleRadio} />
          </ChecklistSection>

          <ChecklistSection title="[영역5] 교육 프로그램 적절성">
            <CheckItem id="5-1" label="학년·발달 단계 맞는 활동 수준" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="5-2" label="교육과정 연계 가능 여부" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="5-3" label="안전교육 포함 운영 계획 여부" type="normal" answers={answers} onChange={handleRadio} />
            <CheckItem id="5-4" label="학급 단위 분산 활동 가능 여부" type="normal" answers={answers} onChange={handleRadio} />
          </ChecklistSection>

          <ChecklistSection title="[영역6] 고위험 활동 여부">
            <div className="p-3 bg-slate-50 rounded-lg border space-y-3">
              <span className="font-semibold text-sm text-slate-800">6-0. 고위험 활동 해당 여부 (복수 선택)</span>
              <div className="flex flex-wrap gap-2">
                {["수상활동", "겨울야외활동", "익스트림스포츠", "놀이기구"].map(act => (
                  <label key={act} className="flex items-center gap-2 text-sm cursor-pointer border px-3 py-1.5 rounded-full bg-white hover:bg-slate-100">
                    <input type="checkbox" checked={highRiskActivities.includes(act)} onChange={() => toggleHighRisk(act)} />
                    {act}
                  </label>
                ))}
              </div>
            </div>
            
            {hasHighRisk && (
              <div className="mt-4 space-y-3 border-l-4 border-amber-400 pl-4">
                <CheckItem id="6-1" label="인명구조요원 상주 여부" type="required" answers={answers} onChange={handleRadio} />
                <CheckItem id="6-2" label="안전장비 전원 착용 가능 여부" type="required" answers={answers} onChange={handleRadio} />
                <CheckItem id="6-3" label="기상 취소 기준 및 대안 프로그램 유무" type="required" answers={answers} onChange={handleRadio} />
                <CheckItem id="6-4" label="특약보험 가입 의무 확인" type="required" answers={answers} onChange={handleRadio} />
              </div>
            )}
          </ChecklistSection>
        </div>

        {/* Evaluation Result */}
        <div className={`mt-8 p-6 rounded-2xl border-2 ${result.color} flex flex-col items-center justify-center text-center space-y-2 print:break-inside-avoid`}>
          <h2 className="text-sm font-bold opacity-80 uppercase tracking-widest">종합 판정 결과</h2>
          <div className="text-3xl font-black">{result.status}</div>
          <p className="font-semibold">{result.desc}</p>
        </div>

        <div className="pt-12 text-center text-slate-500 font-bold text-sm print:block hidden">
          위와 같이 현장체험학습 사전 안전점검을 실시하였음을 확인합니다.<br/><br/>
          202___년 ___월 ___일<br/><br/>
          점검자: __________________ (인)
        </div>

      </div>
    </div>
  );
}

// Subcomponents

function ChecklistSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3 print:break-inside-avoid">
      <h3 className="text-lg font-black text-slate-800 border-b pb-2">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function CheckItem({ 
  id, label, type, answers, onChange, descInput, onDescChange, autoFilled 
}: { 
  id: string, label: string, type: "required" | "normal", answers: Record<string, string>, 
  onChange: (id: string, val: string) => void, descInput?: boolean, onDescChange?: (id: string, val: string) => void, autoFilled?: boolean
}) {
  const isRequired = type === "required";
  const options = isRequired ? ["적합", "부적합"] : ["양호", "주의", "불량", "해당없음"];
  const currentVal = answers[id] || "";

  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2">
        {isRequired && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">필수</span>}
        {autoFilled && <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">자동</span>}
        <span className="font-semibold text-sm text-slate-800">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(id, opt)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-colors ${
              currentVal === opt 
                ? (opt === "부적합" || opt === "불량" ? "bg-red-600 text-white border-red-600" 
                  : opt === "주의" ? "bg-amber-500 text-white border-amber-500" 
                  : "bg-blue-600 text-white border-blue-600")
                : "bg-white text-slate-500 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {descInput && (
        <input 
          type="text" 
          placeholder="상세 내용 입력"
          className="border rounded-md px-3 py-1.5 text-xs w-full md:w-48 mt-2 md:mt-0"
          value={answers[`${id}_desc`] || ""}
          onChange={(e) => onDescChange?.(`${id}_desc`, e.target.value)}
        />
      )}
    </div>
  );
}
