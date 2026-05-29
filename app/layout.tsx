import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "안전-Pick | 현장체험학습 AI 큐레이터",
  description: "안전 인증 현장체험학습 AI 큐레이터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NEXT_PUBLIC_ 환경변수는 서버/클라이언트 모두에서 접근 가능
  const kakaoJsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";
  const kakaoSdkUrl = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJsKey}&autoload=false`;
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body className="font-pretendard antialiased bg-slate-50">
        {children}
        {/* 카카오 지도 SDK 전역 사전 로드 */}
        <Script
          id="kakao-map-sdk"
          src={kakaoSdkUrl}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
