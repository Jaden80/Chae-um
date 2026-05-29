import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envContent = readFileSync('.env.local', 'utf8');
const apiKey = envContent.match(/GEMINI_API_KEY=(.+)/)[1].trim();

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const prompt = `당신은 학교 안전 관리 전문가입니다.
부산한솔학교 3학년 1반 현장체험학습 안전사고 예방 계획서를 마크다운으로 200자 이내로 작성하세요.`;

console.log('최종 검증 테스트...');
const result = await model.generateContent(prompt);
const tokens = result.response.usageMetadata?.totalTokenCount ?? 0;
console.log('✅ 성공!');
console.log('사용 토큰:', tokens);
console.log('응답 길이:', result.response.text().length, '자');
