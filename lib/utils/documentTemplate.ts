/**
 * 현장체험학습 계획 및 품의서 초기 마크다운 초안 생성 함수
 */
export function generateDraftTemplate(params: {
  schoolName: string;
  grade: string;
  placeName: string;
  placeAddress: string;
  students: number;
  teachers: number;
}): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  return `# [${params.schoolName}] 현장체험학습 계획 및 품의서

## 1. 목적
- ${params.schoolName} ${params.grade}학년 교과 단원과 연계된 실제적 현장 관찰을 통해 자연환경 및 인문환경을 실증적으로 탐색합니다.
- 체험처의 안전인증 프로그램 참가를 통해 단체 활동 중 위급 대처 능력을 기르고 협동심과 공공질서 의식을 자연스럽게 배양합니다.
- 주도적인 현장 과제 수행을 통해 분석적이고 창의적인 자기주도적 학습 능력을 극대화시킵니다.

## 2. 개요
- **일시**: ${year}년 ${month}월 ${day + 14}일 09:00 ~ 16:00
- **장소**: ${params.placeName} (${params.placeAddress})
- **대상**: ${params.schoolName} ${params.grade}학년 학생 총 ${params.students}명 (인솔교사 ${params.teachers}명)
- **체험 유형**: 1일형 현장체험학습

## 3. 사전 준비 및 적합성 검토
- **학부모 동의 현황**: 참가 희망 동의율 95% 확보 완료 (현장체험학습 안전관리 매뉴얼 대규모/중규모 의무 비율 기준 만족)
- **안전요원 배치 현황**: 학생 50명당 안전요원 1명 이상 의무 배치 기준 준수하여 인솔교사 및 자원봉사자 배치 완료
- **사전 답사**: 실시 완료 (별도 결과보고서 첨부)

## 4. 소요 경비 산출 내역
| 항목 | 산출 내역 | 금액 | 비고 |
| --- | --- | --- | --- |
| 교통비 | 버스 임차료 (400,000원 × 1대) / ${params.students + params.teachers}명 | 10,000원 | 1인당 |
| 체험비 | ${params.placeName} 입장 및 프로그램 참가비 | 5,000원 | 1인당 |
| 보험료 | 여행자 보험 (기본형) | 1,000원 | 1인당 |
| **총합** | | **16,000원** | 1인당 |

*※ 취약계층 학생 (수급자 등) 3명에 대한 경비 전액은 학교운영비(교육복지 예산)에서 별도 지원함.*

## 5. 행정 및 결재 사항
- 상기 내용과 같이 현장체험학습을 실시하고자 하오니 재가하여 주시기 바랍니다.
- 학생 1인당 소요 경비는 수익자 부담 원칙에 따라 징수 및 지출 품의하고자 합니다.
`;
}
