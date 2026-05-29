"use client";

import React, { useEffect, useState } from "react";
import {
  Sun, Cloud, CloudRain, CloudSnow, Wind, Thermometer,
  Droplets, AlertTriangle, Loader2, CalendarDays, Info, CheckCircle,
} from "lucide-react";

interface WeatherInfo {
  forecastType: "short" | "medium";
  daysUntil: number;
  weatherLabel: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number;
  windspeed: number | null;
  pop: number | null;
  pm10: number | null;
  pm10Grade: string | null;
  pm25: number | null;
}

interface WeatherManual {
  condition: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  manuals: string[];
}

function getPm10Color(grade: string | null) {
  if (grade === "좋음") return "text-blue-500";
  if (grade === "보통") return "text-green-600";
  if (grade === "나쁨") return "text-orange-500";
  if (grade === "매우나쁨") return "text-red-600";
  return "text-slate-400";
}

function getPm10BgColor(grade: string | null) {
  if (grade === "좋음") return "bg-blue-50 border-blue-200";
  if (grade === "보통") return "bg-green-50 border-green-200";
  if (grade === "나쁨") return "bg-orange-50 border-orange-200";
  if (grade === "매우나쁨") return "bg-red-50 border-red-300";
  return "bg-slate-50 border-slate-200";
}

function getWeatherIcon(label: string, size = "w-6 h-6") {
  if (label.includes("비") || label.includes("소나기")) return <CloudRain className={`${size} text-blue-500`} />;
  if (label.includes("눈")) return <CloudSnow className={`${size} text-blue-300`} />;
  if (label.includes("흐림") || label.includes("흐리고")) return <Cloud className={`${size} text-slate-400`} />;
  if (label.includes("구름")) return <Cloud className={`${size} text-slate-300`} />;
  return <Sun className={`${size} text-yellow-400`} />;
}

function buildManuals(weather: WeatherInfo, placeName: string): WeatherManual[] {
  const manuals: WeatherManual[] = [];

  if (weather.pop !== null && weather.pop >= 60) {
    manuals.push({
      condition: `강수확률 ${weather.pop}% — 우천 예보`,
      icon: <CloudRain className="w-5 h-5" />,
      color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200",
      manuals: [
        "우비 또는 우산을 1인당 1개씩 반드시 준비하고, 출발 전 인원 확인 시 우비 착용 여부를 점검하세요.",
        "빗길 보행 시 시야가 좁아지므로 횡단보도에서 반드시 멈추고 좌·우를 천천히 확인 후 이동하세요.",
        `${placeName} 실외 체험 활동을 실내 프로그램으로 대체 가능한지 사전에 확인하세요.`,
        "우천으로 인한 미끄러운 바닥에 주의하여 학생들의 뛰기를 엄격히 제한하세요.",
      ],
    });
  } else if (weather.weatherLabel.includes("비") || weather.weatherLabel.includes("소나기")) {
    manuals.push({
      condition: "강수 예보 — 우천 대비 필요",
      icon: <CloudRain className="w-5 h-5" />,
      color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200",
      manuals: [
        "우비 또는 우산을 준비하고, 젖은 보도에서의 미끄럼 사고에 주의하세요.",
        "우천 시 체험 일정 변경 가능 여부를 현장 담당자에게 사전 문의하세요.",
      ],
    });
  }

  if (weather.weatherLabel.includes("눈")) {
    manuals.push({
      condition: "강설 예보 — 결빙 위험",
      icon: <CloudSnow className="w-5 h-5" />,
      color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200",
      manuals: [
        "보행로 결빙 여부를 이동 전 반드시 확인하고, 미끄러운 구간은 학생들을 1열로 천천히 유도하세요.",
        "방수·방한 기능이 있는 신발과 두꺼운 겉옷 착용을 사전에 공지하세요.",
        "눈길 낙상 사고 대비로 이동 속도를 평소보다 느리게 유지하고, 달리기를 금지하세요.",
      ],
    });
  }

  if (weather.tempMax !== null && weather.tempMax >= 33) {
    manuals.push({
      condition: `최고기온 ${weather.tempMax}°C — 폭염 주의`,
      icon: <Thermometer className="w-5 h-5" />,
      color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200",
      manuals: [
        "물병(최소 500ml)을 1인당 1개 이상 지참하고, 매 30분마다 수분 보충 시간을 가지세요.",
        "야외 활동 시 챙 넓은 모자 착용을 의무화하고, 직사광선 아래 장시간 노출을 삼가세요.",
        "열사병·일사병 증상(얼굴 홍조, 어지러움, 구역질)이 있는 학생은 즉시 시원한 그늘로 이동 후 응급 처치하세요.",
        "실외 활동 시간을 오전 10시 이전 또는 오후 3시 이후로 배치하세요.",
      ],
    });
  } else if (weather.tempMin !== null && weather.tempMin <= 0) {
    manuals.push({
      condition: `최저기온 ${weather.tempMin}°C — 한파 주의`,
      icon: <CloudSnow className="w-5 h-5" />,
      color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200",
      manuals: [
        "두꺼운 겉옷과 장갑, 목도리 등 방한 용품 착용을 학생들에게 공지하세요.",
        "결빙된 보도 및 계단에서의 미끄럼 낙상 사고에 특별히 주의하세요.",
        "저체온증 증상(심한 떨림, 창백한 피부, 무기력증)이 관찰되면 즉시 따뜻한 장소로 이동시키세요.",
      ],
    });
  }

  if (weather.windspeed !== null && weather.windspeed >= 14) {
    manuals.push({
      condition: `최대풍속 ${weather.windspeed}m/s — 강풍 주의`,
      icon: <Wind className="w-5 h-5" />,
      color: "text-slate-700", bgColor: "bg-slate-50", borderColor: "border-slate-300",
      manuals: [
        "강한 바람에 날릴 수 있는 모자, 우산 등 소지품 관리에 주의하세요.",
        "간판, 나뭇가지 등 낙하물 위험 구역에서는 학생들의 머리 위를 항상 확인하세요.",
        "야외 활동 중 돌풍이 불 경우 즉시 건물 안이나 바람을 피할 수 있는 안전 장소로 대피하세요.",
      ],
    });
  }

  if (weather.pm10Grade === "매우나쁨") {
    manuals.push({
      condition: `미세먼지 매우나쁨 (PM10: ${weather.pm10}㎍/㎥)`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-300",
      manuals: [
        "KF94 이상 마스크 착용을 의무화하고, 야외 체험 일정의 실내 대체 가능 여부를 즉시 확인하세요.",
        "호흡기 질환이 있는 학생(천식 등)은 추가 마스크와 흡입기 지참 여부를 사전 확인하세요.",
        "야외 체험 시간을 최소화하고, 불필요한 신체 활동을 자제시키세요.",
      ],
    });
  } else if (weather.pm10Grade === "나쁨") {
    manuals.push({
      condition: `미세먼지 나쁨 (PM10: ${weather.pm10}㎍/㎥)`,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200",
      manuals: [
        "KF80 이상 마스크 착용을 권장하고, 격렬한 외부 활동을 자제하세요.",
        "호흡기 질환 학생은 마스크를 반드시 착용하도록 지도하세요.",
      ],
    });
  }

  if (manuals.length === 0) {
    manuals.push({
      condition: `날씨 양호 — ${weather.weatherLabel}`,
      icon: <Sun className="w-5 h-5" />,
      color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200",
      manuals: [
        "체험 당일 날씨 상태를 재확인하고, 급격한 날씨 변화에 대비한 여분의 겉옷을 준비하세요.",
        "야외 활동 시 자외선 차단을 위한 모자 및 선크림 사용을 권장하세요.",
        "체험 전 현장의 안전 안내 담당자와 비상 대피 경로를 확인하세요.",
      ],
    });
  }

  return manuals;
}

interface Props {
  tripDate: string;
  placeLat: number;
  placeLng: number;
  placeName: string;
  placeAddress: string;
}

export default function WeatherSection({ tripDate, placeLat, placeLng, placeName, placeAddress }: Props) {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripDate || !placeLat || !placeLng) return;

    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      setWeather(null);

      try {
        const params = new URLSearchParams({
          lat: placeLat.toString(),
          lng: placeLng.toString(),
          date: tripDate,
          address: placeAddress,
        });
        const res = await fetch(`/api/weather?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          setWeatherError(json.error ?? "날씨 정보를 불러오지 못했습니다.");
        } else {
          setWeather({
            forecastType: json.forecastType ?? "short",
            daysUntil: json.daysUntil ?? 0,
            weatherLabel: json.weatherLabel ?? "정보 없음",
            tempMax: json.tempMax,
            tempMin: json.tempMin,
            precipitation: json.precipitation ?? 0,
            windspeed: json.windspeed,
            pop: json.pop,
            pm10: json.pm10,
            pm10Grade: json.pm10Grade,
            pm25: json.pm25,
          });
        }
      } catch {
        setWeatherError("날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [tripDate, placeLat, placeLng, placeAddress]);

  if (!tripDate) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-black text-slate-700">체험학습 날씨 예보 및 교사 대응 매뉴얼</h2>
        </div>
        <p className="text-sm text-slate-400 font-semibold">
          검색 화면에서 <strong className="text-blue-500">체험학습 희망일</strong>을 선택하면,
          이 장소의 날씨 예보와 기상 상황별 교사 안전 대응 매뉴얼이 자동으로 표시됩니다.
        </p>
      </div>
    );
  }

  const isMedium = weather?.forecastType === "medium";
  const isShort = weather?.forecastType === "short";

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            🌤 체험학습 당일 날씨 예보 및 교사 대응 매뉴얼
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            체험처({placeName}) 위치 기준 · 희망일: {tripDate.replace(/-/g, ".")}
          </p>
        </div>
      </div>

      {/* 로딩 */}
      {weatherLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          기상청 날씨 정보를 불러오는 중...
        </div>
      )}

      {/* 오류 */}
      {weatherError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {weatherError}
        </div>
      )}

      {/* ── 중기예보 안내 배너 ── */}
      {weather && isMedium && (
        <div className="space-y-4">
          {/* 중기예보 안내 */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-amber-800 leading-relaxed">
              <strong>중기예보 ({weather.daysUntil}일 후)</strong> — 체험일까지{" "}
              <strong>{weather.daysUntil}일</strong>이 남아 중기예보를 제공합니다.
              중기예보는 <strong>단기예보(3일 이내)보다 정확도가 낮을 수 있습니다.</strong>
              체험 3일 전부터 이 페이지를 다시 방문하시면 더욱 정확한 단기예보와
              교사 대응 매뉴얼을 확인하실 수 있습니다.
            </div>
          </div>

          {/* 중기 날씨 요약 */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                {getWeatherIcon(weather.weatherLabel)}
                <div>
                  <p className="text-xs text-slate-400 font-bold">예상 날씨 (중기)</p>
                  <p className="text-base font-black text-slate-800">{weather.weatherLabel}</p>
                </div>
              </div>
              {(weather.tempMax !== null || weather.tempMin !== null) && (
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold">예상 기온</p>
                    <p className="text-base font-black text-slate-800">
                      <span className="text-blue-500">{weather.tempMin ?? "-"}°</span>
                      {" / "}
                      <span className="text-red-500">{weather.tempMax ?? "-"}°</span>
                    </p>
                  </div>
                </div>
              )}
              {weather.pop !== null && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold">강수확률</p>
                    <p className={`text-base font-black ${weather.pop >= 60 ? "text-red-500" : "text-slate-800"}`}>
                      {weather.pop}%
                    </p>
                  </div>
                </div>
              )}
            </div>
            {(weather.pm10 !== null || weather.pm25 !== null) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-blue-100">
                <span className="text-xs font-black text-slate-600">🌫 실시간 대기질 (에어코리아)</span>
                {weather.pm10 !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getPm10BgColor(weather.pm10Grade)} ${getPm10Color(weather.pm10Grade)}`}>
                    미세먼지(PM10): {weather.pm10}㎍/㎥{weather.pm10Grade ? ` · ${weather.pm10Grade}` : ""}
                  </div>
                )}
                {weather.pm25 !== null && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                    초미세먼지(PM2.5): {weather.pm25}㎍/㎥
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 중기예보 재방문 안내 */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <CalendarDays className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-blue-800 leading-relaxed">
              📅 <strong>체험 3일 전</strong>에 이 페이지를 다시 방문하시면, 기상청 단기예보 기반의
              더욱 정확한 날씨 정보와 <strong>맞춤형 교사 대응 매뉴얼</strong>이 자동으로 제공됩니다.
            </p>
          </div>
        </div>
      )}

      {/* ── 단기예보 날씨 + 교사 매뉴얼 ── */}
      {weather && isShort && (
        <>
          {/* 단기예보 안내 배너 */}
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-emerald-800 leading-relaxed">
              <strong>단기예보 ({weather.daysUntil === 0 ? "오늘" : `${weather.daysUntil}일 후`})</strong>{" "}
              — 기상청 단기예보는 3일 이내 가장 정확한 예보입니다.
              아래 날씨 정보를 바탕으로 교사 대응 매뉴얼을 확인하고 체험학습을 준비하세요.
            </div>
          </div>

          {/* 단기 날씨 요약 */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-3">
                {getWeatherIcon(weather.weatherLabel)}
                <div>
                  <p className="text-xs text-slate-400 font-bold">날씨 상태</p>
                  <p className="text-base font-black text-slate-800">{weather.weatherLabel}</p>
                </div>
              </div>
              {(weather.tempMax !== null || weather.tempMin !== null) && (
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold">기온</p>
                    <p className="text-base font-black text-slate-800">
                      <span className="text-blue-500">{weather.tempMin ?? "-"}°</span>
                      {" / "}
                      <span className="text-red-500">{weather.tempMax ?? "-"}°</span>
                    </p>
                  </div>
                </div>
              )}
              {weather.pop !== null && (
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold">강수확률</p>
                    <p className={`text-base font-black ${weather.pop >= 60 ? "text-red-500" : "text-slate-800"}`}>
                      {weather.pop}%
                    </p>
                  </div>
                </div>
              )}
              {weather.precipitation > 0 && (
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold">강수량</p>
                    <p className="text-base font-black text-slate-800">{weather.precipitation}mm</p>
                  </div>
                </div>
              )}
              {weather.windspeed !== null && (
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold">최대풍속</p>
                    <p className={`text-base font-black ${weather.windspeed >= 14 ? "text-orange-500" : "text-slate-800"}`}>
                      {weather.windspeed}m/s
                    </p>
                  </div>
                </div>
              )}
            </div>
            {(weather.pm10 !== null || weather.pm25 !== null) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-blue-100">
                <span className="text-xs font-black text-slate-600">🌫 실시간 대기질 (에어코리아)</span>
                {weather.pm10 !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getPm10BgColor(weather.pm10Grade)} ${getPm10Color(weather.pm10Grade)}`}>
                    미세먼지(PM10): {weather.pm10}㎍/㎥{weather.pm10Grade ? ` · ${weather.pm10Grade}` : ""}
                  </div>
                )}
                {weather.pm25 !== null && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                    초미세먼지(PM2.5): {weather.pm25}㎍/㎥
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 단기예보 교사 대응 매뉴얼 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-1.5">
              📋 기상 상황별 교사 안전 대응 매뉴얼
            </h3>
            <div className="space-y-3">
              {buildManuals(weather, placeName).map((manual, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 space-y-2 ${manual.bgColor} ${manual.borderColor}`}
                >
                  <div className={`flex items-center gap-2 font-black text-sm ${manual.color}`}>
                    {manual.icon}
                    {manual.condition}
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {manual.manuals.map((m, mi) => (
                      <li key={mi} className="flex items-start gap-2 text-xs font-semibold text-slate-700 leading-relaxed">
                        <span className={`shrink-0 font-black mt-0.5 ${manual.color}`}>✓</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
