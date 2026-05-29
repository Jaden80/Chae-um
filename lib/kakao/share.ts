declare global {
  interface Window {
    Kakao: any;
  }
}

export function initKakao() {
  if (typeof window === "undefined") return;

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "dummy";
  
  if (window.Kakao && !window.Kakao.isInitialized()) {
    try {
      window.Kakao.init(kakaoKey);
      console.log("Kakao SDK Initialized successfully.");
    } catch (err) {
      console.error("Kakao SDK initialization failed:", err);
    }
  }
}

export function shareToKakao(params: {
  title: string;
  description: string;
  linkUrl: string;
  buttonText?: string;
}) {
  if (typeof window === "undefined") return;

  initKakao();

  const fullLinkUrl = `${window.location.origin}${params.linkUrl}`;

  if (window.Kakao && window.Kakao.Share) {
    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: params.title,
          description: params.description,
          imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80", // Premium default school/bus image
          link: {
            mobileWebUrl: fullLinkUrl,
            webUrl: fullLinkUrl,
          },
        },
        buttons: [
          {
            title: params.buttonText || "동의서 작성하기",
            link: {
              mobileWebUrl: fullLinkUrl,
              webUrl: fullLinkUrl,
            },
          },
        ],
      });
      return true;
    } catch (err) {
      console.error("Kakao Share failed, using fallback:", err);
    }
  }

  // Fallback to Clipboard & alert
  const shareText = `[${params.title}]\n\n${params.description}\n\n동의서 링크: ${fullLinkUrl}`;
  navigator.clipboard.writeText(shareText);
  alert("카카오 SDK가 구성되지 않았거나 오류가 발생하여, 메시지를 클립보드에 복사했습니다. 카카오톡 창에 바로 붙여넣기 하실 수 있습니다!\n\n[복사된 내용]:\n" + shareText);
  return false;
}
