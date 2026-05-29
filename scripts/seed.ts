// Demo seed script to pre-populate schools, events, and certified safety places.
// Can be run via: npx tsx scripts/seed.ts

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isMock = !supabaseUrl || supabaseUrl.includes("your_supabase");

async function seed() {
  if (isMock) {
    console.log("Supabase connection is not configured or in mock state. Seed skipped.");
    return;
  }

  const supabase = createClient(supabaseUrl!, supabaseKey!);

  console.log("Seeding Safety-Pick Demo Seed Data...");

  // 1. Seed Schools
  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .upsert({
      id: "mock-school-1",
      neis_code: "S1000001",
      name: "세종초등학교",
      address: "세종특별자치시 한누리대로 213",
      lat: 36.4800,
      lng: 127.2890
    })
    .select()
    .single();

  if (schoolErr) {
    console.error("School seed failed:", schoolErr);
    return;
  }
  console.log("School Seeded successfully:", school?.name);

  // 2. Seed Places (5 certified places)
  const places = [
    {
      id: "mock-place-1",
      source: "kywa",
      external_id: "KYWA-001",
      name: "국립세종수목원 어린이정원",
      category: "자연 탐구",
      address: "세종특별자치시 수목원로 136",
      lat: 36.4950,
      lng: 127.3050,
      phone: "044-270-5000",
      website: "https://www.sjna.or.kr",
      reservation_required: true,
      certified: true,
      certification_info: { id: "CERT-2026-001", grade: "1등급" }
    },
    {
      id: "mock-place-2",
      source: "kywa",
      external_id: "KYWA-002",
      name: "세종호수공원 야생화원",
      category: "자연 탐구",
      address: "세종특별자치시 다솜로 216",
      lat: 36.4980,
      lng: 127.2880,
      phone: "044-301-3921",
      website: "https://www.sejong.go.kr",
      reservation_required: false,
      certified: true,
      certification_info: { id: "CERT-2026-002", grade: "우수" }
    },
    {
      id: "mock-place-3",
      source: "kywa",
      external_id: "KYWA-003",
      name: "국립중앙과학관 창의학습관",
      category: "과학 탐구",
      address: "대전광역시 유성구 대덕대로 481",
      lat: 36.3740,
      lng: 127.3800,
      phone: "042-601-7894",
      website: "https://www.science.go.kr",
      reservation_required: true,
      certified: true,
      certification_info: { id: "CERT-2026-003", grade: "최우수" }
    },
    {
      id: "mock-place-4",
      source: "kywa",
      external_id: "KYWA-004",
      name: "세종안전체험관",
      category: "안전 체험",
      address: "세종특별자치시 새롬서로 20",
      lat: 36.4840,
      lng: 127.2580,
      phone: "044-868-8090",
      website: "https://safe.sje.go.kr",
      reservation_required: true,
      certified: true,
      certification_info: { id: "CERT-2026-004", grade: "우수" }
    },
    {
      id: "mock-place-5",
      source: "kywa",
      external_id: "KYWA-005",
      name: "밀마루 전망대 역사 학습관",
      category: "역사 탐구",
      address: "세종특별자치시 도움3로 58",
      lat: 36.5050,
      lng: 127.2590,
      phone: "044-860-7000",
      website: "https://www.lh.or.kr",
      reservation_required: false,
      certified: true,
      certification_info: { id: "CERT-2026-005", grade: "양호" }
    }
  ];

  for (const place of places) {
    const { error: placeErr } = await supabase.from("places").upsert(place);
    if (placeErr) {
      console.error(`Place seed failed [${place.name}]:`, placeErr);
    }
  }
  console.log("5 Certified Places Seeded.");

  // 3. Seed Events (3 events)
  const events = [
    {
      id: "mock-event-101",
      school_id: "mock-school-1",
      subject: "사회",
      grade: 3,
      unit: "우리 고장의 모습",
      trip_date: "2026-06-15",
      student_count: 55,
      type: "1일형",
      status: "selected",
      selected_place_id: "mock-place-1"
    },
    {
      id: "mock-event-102",
      school_id: "mock-school-1",
      subject: "과학",
      grade: 4,
      unit: "식물의 한살이",
      trip_date: "2026-06-28",
      student_count: 48,
      type: "1일형",
      status: "document_ready",
      selected_place_id: "mock-place-2"
    },
    {
      id: "mock-event-103",
      school_id: "mock-school-1",
      subject: "과학",
      grade: 6,
      unit: "우리 몸의 구조",
      trip_date: "2026-07-02",
      student_count: 62,
      type: "1일형",
      status: "draft"
    }
  ];

  for (const event of events) {
    const { error: eventErr } = await supabase.from("events").upsert(event);
    if (eventErr) {
      console.error(`Event seed failed [${event.id}]:`, eventErr);
    }
  }
  console.log("3 Events Seeded successfully.");

  console.log("All Seeding Completed! 🎉");
}

seed().catch((err) => {
  console.error("Seed execution failed:", err);
});
