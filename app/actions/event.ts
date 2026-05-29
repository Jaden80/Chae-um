"use server";

import { createClient } from "@/lib/supabase/server";

export async function createEvent(formData: {
  grade: number;
  subject: string;
  unit: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = !supabaseUrl || supabaseUrl.includes("your_supabase");

  if (isMock) {
    // Simulate database write
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockId = Math.random().toString(36).substring(2, 15);
    return { success: true, eventId: mockId };
  }

  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    // Get school_id from user profile
    const { data: userData, error: profileError } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // Insert new event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        school_id: userData?.school_id || null,
        grade: formData.grade,
        subject: formData.subject,
        unit: formData.unit,
        status: "searching",
      })
      .select("id")
      .single();

    if (eventError) {
      throw eventError;
    }

    return { success: true, eventId: event.id };
  } catch (error: any) {
    console.error("createEvent error:", error);
    return { success: false, error: error.message || "이벤트 생성 중 오류가 발생했습니다." };
  }
}
