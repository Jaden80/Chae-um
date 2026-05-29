import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function getGeminiModel() {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "dummy_key");
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });
}

export async function generateJSONRecommendation(systemPrompt: string, userPrompt: string) {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n[USER INPUT]\n${userPrompt}` }] }
      ],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Gemini recommendation error:", error);
    throw error;
  }
}


export async function generatePlaceDescription(
  placeName: string,
  placeAddress: string,
  unit: string
): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your_gemini")) {
    return "";
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

    const prompt = `당신은 초등학교 현장체험학습 전문 큐레이터입니다.
아래 장소에 대해 학생과 교사가 읽기 좋은 현장체험학습 소개 설명을 2~3문장으로 작성해 주세요.
- 장소명: ${placeName}
- 주소: ${placeAddress}
- 체험학습 주제: ${unit}

조건:
1. 장소의 특징과 체험 내용을 중심으로 작성
2. 학생들에게 어떤 교육적 경험을 줄 수 있는지 포함
3. 친근하고 생생한 문체 사용
4. 2~3문장으로 간결하게 작성
5. 마크다운 없이 순수 텍스트만 반환

설명:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini place description error:", error);
    return "";
  }
}

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("your_gemini")) {
    return "";
  }
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\n[USER INPUT]\n${userPrompt}` }] }
      ],
    });
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini generateText error:", error);
    throw error;
  }
}
