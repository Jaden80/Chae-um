import { readFileSync } from 'fs';

const src = readFileSync('lib/docPrompts.ts', 'utf8');
// TypeScript를 JS로 간단 변환 (타입 제거)
const jsCode = src
  .replace(/export function/g, 'function')
  .replace(/: string/g, '')
  .replace(/: Record<string, any>/g, '')
  .replace(/<string, any>/g, '');

let result = '';
try {
  const fn = new Function(jsCode + `; return getDocumentSpecificPrompt('p03_safetyPlan', {
    schoolName: '부산한솔학교', grade: '3', className: '1', teacherName: '홍길동',
    placeName: '경복궁', placeAddr: '서울시 종로구', tripDate: '2026년 5월 29일',
    tripEndDate: '', totalStudents: 30, nonParticipants: 0, teacherCount: 3,
    departureTime: '09:00', returnTime: '16:00', transportLabel: '전세버스',
    budget: 15000, totalBudget: 450000, tripTitle: '역사 탐방', tripPurpose: '역사 이해', tripType: 'day'
  });`);
  result = fn();
  console.log('✅ 함수 정상 실행');
  console.log('결과 길이:', result.length);
  console.log('처음 300자:\n', result.substring(0, 300));
} catch(e) {
  console.log('❌ 에러:', e.message.substring(0, 300));
}
