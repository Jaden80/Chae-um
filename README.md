# 🏫 안전-Pick (Safety-Pick)
교사를 위한 인공지능 융합 안전인증 현장체험학습 큐레이터 플랫폼

> 공공데이터(NEIS, KYWA, TAAS 등)와 Gemini AI 비전/텍스트 모델을 결합하여, 대한민국 초·중·고 교사들의 체험학습 설계부터 품의 계획서 기안, 학부모 모바일 동의서 수집, 그리고 사전답사 AI 보고서 작정까지 원스톱으로 자동화하는 프리미엄 행정 솔루션입니다.

---

## 🛠️ 기술 스택
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database / Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Generative AI**: Google Gemini 2.0 Flash (Text / Vision / Structured JSON)
- **Map Visualizations**: Kakao Maps SDK (Marker, Circle, Polyline)
- **Design Paradigm**: HSL Curated Harmonies, Sleek Dark Modes, Glassmorphism, Micro-animations

---

## 🔑 환경 변수 설정 가이드 (`.env.local`)
로컬 실행을 위해 아래 템플릿 환경변수를 프로젝트 루트에 `.env.local`로 생성해 주십시오. 

```bash
# Supabase Database & Auth (플레이스홀더 상태 시 완전한 시뮬레이션 모드로 무결 동작 지원)
NEXT_PUBLIC_SUPABASE_URL=https://your_supabase_project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini Generative AI Key
GEMINI_API_KEY=your_gemini_api_key

# Kakao Map JavaScript API Key
NEXT_PUBLIC_KAKAO_JS_KEY=your_kakao_js_key

# 공공데이터 API 서비스 인증키 (NEIS, KYWA, TAAS, 기상청 공통 포털 키)
DATA_GO_KR_SERVICE_KEY=your_data_go_kr_portal_key
```

### 📡 공공데이터 API 키 발급 링크 안내
1. **NEIS 교육행정정보 기본 정보**: [NEIS 오픈 API 포털](https://open.neis.go.kr)
2. **KYWA 청소년활동 안전인증 프로그램**: [공공데이터포털 - KYWA 인증 정보](https://www.data.go.kr)
3. **TAAS 도로교통공단 교통사고 통계**: [공공데이터포털 - 도로교통공단 사고정보](https://www.data.go.kr)
4. **기상청 단기예보 & 에어코리아 미세먼지**: [공공데이터포털 - 기상청 단기예보](https://www.data.go.kr)

---

## 👨‍🏫 데모 시연 계정 정보
데이터베이스에 기본 탑재된 모의 교사 계정 정보입니다:
- **로그인 이메일**: `teacher@safety-pick.kr`
- **로그인 비밀번호**: `password123`

---

## 🚌 초정밀 시연 시나리오 (Step 1 ~ 6)

### Step 1: 교사용 안전-Pick 로그인 및 학교 캐싱
- `/login` 화면에 진입하여 데모 교사 계정으로 접속하거나, 회원가입 시 NEIS API 연동 검색창에 `세종`을 기입하여 소속 학교를 실시간 탐색해 `schools` 테이블에 캐싱합니다.

### Step 2: 교과 연계 및 체험처 지능형 검색
- `/search` 화면에 진입하여 학교 기본 정보를 확인합니다.
- `[3학년] [사회] [우리 고장의 모습]` 단원 정보를 기입하고 `[추천받기]`를 누르면 KYWA API로 학교 반경 30km 내의 국가 공인 안전체험처들을 자동으로 매칭 수집합니다.

### Step 3: 지도 시각화 및 경로 교통안전 스펙트럼 분석
- `/search/result?eventId=xxx` 화면에서 좌측 카카오 지도에 내장된 학교 마커(파란색), 추천 안전처 5개소 마커(빨간색 순위), 그리고 **30km 안전 권역 서클**을 감상합니다.
- 추천 카드를 누르면 맵이 줌인되며, `/place/[id]`를 클릭하여 학교와 목적지간 최적 버스 운행선(**Polyline**) 및 교통안점 점수가 감지된 사고 다발 주의 마커를 확인합니다.

### Step 4: 매뉴얼 RAG 규정 기반 계획 품의서 A4 정밀 인쇄
- `/document/[eventId]`에서 교육청 안전 조항들(P.3~6의 의무동의율, 50명당 1명 요원 등)이 주입된 계획서를 편집 및 저장합니다.
- `[A4 정밀 인쇄]` 버튼을 눌러 여백(`@page`)과 중앙 쪽 번호(`- 1 -`), 마스킹 규정(`○○초등학교`)이 이식된 고품질 공문서 PDF를 즉시 출력합니다.

### Step 5: 학부모 모바일 스마트 동의서 & 카카오톡 알림장 공유
- `/document/[eventId]/parent-notice`에서 학부모 통지문을 확인합니다.
- **[카톡 공유]** 탭을 누르면 카카오 SDK 카드 피드가 구동(또는 Seamless 복사 폴백)되어 모바일 링크를 배포합니다.
- 학부모들은 `/consent/[token]` 링크를 통해 모바일 폰으로 학생 알레르기/특이사항을 적고 참가/불참 동의서를 1초 만에 안전 전송합니다.

### Step 6: 현장 사전답사 오프라인 카메라 연동 및 AI 비전 보고서
- 교사는 `/previsit/[eventId]`에서 시설 안전성 점수를 매기고 모바일 카메라를 켜 직접 현장 소화기/대피로를 촬영하여 다중 업로드합니다. LocalStorage 백업으로 통신 불량에도 안전합니다.
- 보고서 생성 시 **Gemini 2.0 Flash 비전**이 각 사진 속 소화기 압력계 정상 및 적치물 방치를 자동 판독해 캡션을 매핑한 완벽한 **[사전답사 결과 조치 이행 보고서]**를 완성합니다.

---

## 🚀 Vercel 배포 및 설정 가이드
1. [Vercel](https://vercel.com)에 로그인하고 **Add New Project**를 선택합니다.
2. 본 `safety-pick` 레포지토리를 연동합니다.
3. 빌드 설정(Build Settings)은 Next.js 기본 설정을 유지합니다:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Environment Variables** 탭에서 위의 `.env.local` 가이드에 명시된 환경 변수 키와 값을 모두 추가해 줍니다.
5. **Deploy** 버튼을 누르면 실시간 SSL 보안이 적용된 라이브 웹 애플리케이션 서비스 배포가 단 2분 만에 완료됩니다!
