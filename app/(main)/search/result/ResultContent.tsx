"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Shield, MapPin, Award, Star, Compass, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    kakao: any;
  }
}

interface RecItem {
  placeId: string;
  name: string;
  matchScore: number;
  matchReason: string;
  placeDescription?: string;
  distanceKm: number;
  rank: number;
  lat: number;
  lng: number;
  address: string;
  safetyScore: number;
  pedestrianAccidents: number;
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");
  const grade = Number(searchParams.get("grade") || "3");
  const subject = searchParams.get("subject") || "사회";
  const unit = searchParams.get("unit") || "우리 고장의 모습";
  const initialRadius = Number(searchParams.get("radius") || "30");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [learningObjectives, setLearningObjectives] = useState("");
  const [schoolCoord, setSchoolCoord] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [recommendations, setRecommendations] = useState<RecItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(initialRadius);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 1. Fetch Recommendations from API
  useEffect(() => {
    if (!eventId) {
      setError("올바르지 않은 접근입니다 (eventId 누락).");
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // Load teacher profile from localStorage to get real school coords
        let clientSchoolLat: number | undefined;
        let clientSchoolLng: number | undefined;
        let clientSchoolName: string | undefined;
        let clientSchoolAddress: string | undefined;
        try {
          const saved = localStorage.getItem("safety_pick_teacher_profile");
          if (saved) {
            const p = JSON.parse(saved);
            clientSchoolLat = p.schoolLat;
            clientSchoolLng = p.schoolLng;
            clientSchoolName = p.schoolName;
            clientSchoolAddress = p.schoolAddress;
          }
        } catch {}

        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            grade,
            subject,
            unit,
            clientSchoolLat,
            clientSchoolLng,
            clientSchoolName,
            clientSchoolAddress,
            radius,
          }),
        });

        if (!res.ok) {
          throw new Error("추천 분석 데이터를 불러오지 못했습니다.");
        }

        const data = await res.json();
        if (data.success) {
          setLearningObjectives(data.learningObjectives);
          setSchoolCoord(data.schoolCoord);
          setRecommendations(data.recommendations);
          
          // Sync school coordinates to teacher profile in localStorage
          if (data.schoolCoord) {
            try {
              const saved = localStorage.getItem("safety_pick_teacher_profile");
              if (saved) {
                const profile = JSON.parse(saved);
                profile.schoolLat = data.schoolCoord.lat;
                profile.schoolLng = data.schoolCoord.lng;
                localStorage.setItem("safety_pick_teacher_profile", JSON.stringify(profile));
                console.log("Successfully synced school coordinates to profile:", data.schoolCoord);
              }
            } catch (e) {
              console.error("Failed to sync school coordinates to profile:", e);
            }
          }
          
          // Save recommendations in localStorage so the place detail page can load them dynamically
          try {
            localStorage.setItem("safety_pick_last_recommendations", JSON.stringify(data.recommendations));
          } catch (e) {
            console.error("Failed to save recommendations to localStorage:", e);
          }
        } else {
          throw new Error(data.error || "추천 생성 에러");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [eventId, grade, subject, unit, radius]);

  // 2. Load Kakao Maps script and initialize map
  useEffect(() => {
    if (loading || error || !schoolCoord || recommendations.length === 0) return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";
    const scriptId = "kakao-map-sdk";

    const drawMap = () => {
      if (!mapContainerRef.current) return;

      // 이전 지도 인스턴스가 남아있을 수 있으므로 컨테이너를 비웁니다.
      mapContainerRef.current.innerHTML = "";

      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center: new window.kakao.maps.LatLng(schoolCoord.lat, schoolCoord.lng),
        level: 8,
      });
      mapRef.current = map;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const schoolLatLng = new window.kakao.maps.LatLng(schoolCoord.lat, schoolCoord.lng);
      const schoolMarker = new window.kakao.maps.Marker({ position: schoolLatLng, map });
      new window.kakao.maps.CustomOverlay({
        position: schoolLatLng,
        content: `<div style="background:#2563eb;color:#fff;font-weight:700;font-size:11px;padding:4px 10px;border-radius:999px;border:2px solid #fff;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);transform:translateY(-40px) translateX(-50%);position:absolute">🏫 ${schoolCoord.name}</div>`,
        yAnchor: 1,
      }).setMap(map);
      markersRef.current.push(schoolMarker);

      new window.kakao.maps.Circle({
        center: schoolLatLng,
        radius: radius * 1000,
        strokeWeight: 2,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.7,
        strokeStyle: "dashed",
        fillColor: "#eff6ff",
        fillOpacity: 0.15,
      }).setMap(map);

      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(schoolLatLng);

      recommendations.forEach((rec) => {
        const latLng = new window.kakao.maps.LatLng(rec.lat, rec.lng);
        bounds.extend(latLng);
        const marker = new window.kakao.maps.Marker({ position: latLng, map });
        new window.kakao.maps.CustomOverlay({
          position: latLng,
          content: `<div style="background:#ef4444;color:#fff;font-weight:900;font-size:12px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);transform:translateY(-34px) translateX(-50%);position:absolute;cursor:pointer">${rec.rank}</div>`,
          yAnchor: 1,
        }).setMap(map);
        markersRef.current.push(marker);
      });

      map.setBounds(bounds);
    };

    const initKakaoMap = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(drawMap);
      } else {
        if (document.getElementById(scriptId)) {
          const poll = setInterval(() => {
            if (window.kakao && window.kakao.maps) {
              clearInterval(poll);
              window.kakao.maps.load(drawMap);
            }
          }, 100);
          return;
        }
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
        script.async = true;
        script.onload = () => window.kakao.maps.load(drawMap);
        document.head.appendChild(script);
      }
    };

    const timer = setTimeout(initKakaoMap, 150);
    return () => clearTimeout(timer);
  }, [loading, error, schoolCoord, recommendations, radius]);


  // Center map on place selection
  const handlePlaceSelect = (rec: RecItem) => {
    setSelectedPlaceId(rec.placeId);
    if (mapRef.current && window.kakao && window.kakao.maps) {
      const latLng = new window.kakao.maps.LatLng(rec.lat, rec.lng);
      mapRef.current.panTo(latLng);
      mapRef.current.setLevel(5);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-800">교과 연계 및 교통 안전 정밀 분석 중...</h2>
          <p className="text-slate-500 font-medium">안전인증 체험처 매칭 및 반경 {radius}km 내 사고 데이터 분석을 진행합니다.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-800">추천 생성 실패</h2>
        <p className="text-slate-500">{error}</p>
        <Button onClick={() => router.push("/search")} className="bg-blue-600 text-white">
          뒤로 가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Left 50%: Kakao Map */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative border-r border-slate-200">
        <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />
        
        {/* Floating Circle Legend */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl p-4 shadow-sm z-10 space-y-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-600 rounded-full block border border-white shadow-sm"></span>
            <span>출발 학교: {schoolCoord?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full block border border-white shadow-sm"></span>
            <span>추천 안전 체험처 ({recommendations.length}곳)</span>
          </div>
          <div className="pt-2 border-t border-slate-150 flex items-center gap-2 text-blue-600">
            <Compass className="w-4 h-4" />
            <span>반경 {radius}km 안전 권역 표시</span>
          </div>
        </div>
      </div>

      {/* Right 50%: Recommendation Card List */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-slate-50">
        {/* AI Learning Objectives Section */}
        <div className="p-6 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
              💡 AI 교육과정 설계 및 추천
            </h2>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold">초등 {grade}학년 {subject}</Badge>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-semibold bg-slate-50 border border-slate-150 p-4 rounded-2xl">
            {learningObjectives}
          </p>
        </div>

        {/* Search Radius Control Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Compass className="w-4 h-4 text-blue-600 animate-pulse" />
            <span>체험처 탐색 반경 조절</span>
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer outline-none hover:bg-slate-100 transition-colors"
          >
            {[10, 20, 30, 50, 100].map((r) => (
              <option key={r} value={r}>
                반경 {r}km 이내
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {recommendations.map((rec) => {
            const isSelected = selectedPlaceId === rec.placeId;

            return (
              <div
                key={rec.placeId}
                onClick={() => handlePlaceSelect(rec)}
                className={`p-6 bg-white border rounded-3xl cursor-pointer transition-all space-y-4 hover:shadow-md ${
                  isSelected 
                    ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm" 
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">
                        {rec.rank}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600">
                        {rec.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {rec.address}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-slate-400">학교와의 거리</span>
                    <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-700">
                      {rec.distanceKm} km
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">
                  {rec.placeDescription || rec.matchReason}
                </p>

                {/* Score Indicators */}
                <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    {/* Matching Star Score */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400">주제 적합도</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < rec.matchScore ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Safety Shield Score */}
                    <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4">
                      <span className="text-[10px] font-bold text-slate-400">교통안전 지수</span>
                      <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-sm">
                        <Shield className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                        {rec.safetyScore} / 5.0
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/place/${rec.placeId}?eventId=${eventId}`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                  >
                    자세히 보기
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
