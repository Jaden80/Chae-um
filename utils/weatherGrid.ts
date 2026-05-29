const RE = 6371.00877, GRID = 5.0, SLAT1 = 30.0, SLAT2 = 60.0;
const OLON = 126.0, OLAT = 38.0, XO = 43, YO = 136;
const DEGRAD = Math.PI / 180;

interface GridCoord { nx: number; ny: number; }
interface LatLng    { lat: number; lng: number; }

export const latLngToGrid = (lat: number, lng: number): GridCoord => {
  const re = RE / GRID;
  const s1 = SLAT1 * DEGRAD, s2 = SLAT2 * DEGRAD, olon = OLON * DEGRAD, olat = OLAT * DEGRAD;
  let sn = Math.tan(Math.PI * 0.25 + s2 * 0.5) / Math.tan(Math.PI * 0.25 + s1 * 0.5);
  sn = Math.log(Math.cos(s1) / Math.cos(s2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + s1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(s1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  const latr = lat * DEGRAD, lngr = lng * DEGRAD;
  let ra = Math.tan(Math.PI * 0.25 + latr * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lngr - olon;
  if (theta >  Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  return { nx: Math.floor(ra * Math.sin(theta) + XO + 0.5), ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5) };
};

export const getBaseDateTime = (date?: Date): { baseDate: string; baseTime: string } => {
  const now = date ?? new Date();
  const h = now.getHours(), m = now.getMinutes();
  const baseTimes = [2,5,8,11,14,17,20,23], buffer = 10;
  let baseHour = baseTimes[0];
  for (const t of baseTimes) { if (h > t || (h === t && m >= buffer)) baseHour = t; }
  if (h < 2 || (h === 2 && m < buffer)) {
    const yday = new Date(now); yday.setDate(yday.getDate() - 1);
    return { baseDate: formatDate(yday), baseTime: '2300' };
  }
  return { baseDate: formatDate(now), baseTime: String(baseHour).padStart(2, '0') + '00' };
};

export const formatDate = (d: Date): string => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}${m}${day}`;
};

export const skyCodeToText = (c: string): string => ({ '1':'맑음','3':'구름 많음','4':'흐림' }[c] ?? '알 수 없음');
export const ptyCodeToText = (c: string): string => ({ '0':'없음','1':'비','2':'비/눈','3':'눈','4':'소나기' }[c] ?? '없음');

export const getRainRiskLevel = (pop: number) => {
  if (pop < 20) return { level: 'safe'    as const, label: '안전', color: '#16a34a' };
  if (pop < 40) return { level: 'caution' as const, label: '주의', color: '#d97706' };
  if (pop < 70) return { level: 'warning' as const, label: '경고', color: '#ea580c' };
  return          { level: 'danger'  as const, label: '위험', color: '#dc2626' };
};

export const summarizeWeather = (w: {
  sky: string; precipitation: string; precipitationProbability: number;
  temperature: number; windSpeed: number;
}): string => {
  const parts = [w.sky];
  if (w.precipitation !== '없음') parts.push(w.precipitation);
  parts.push(`강수확률 ${w.precipitationProbability}%`, `기온 ${w.temperature}°C`);
  if (w.windSpeed >= 9) parts.push(`강풍 주의 (${w.windSpeed}m/s)`);
  return parts.join(', ');
};
