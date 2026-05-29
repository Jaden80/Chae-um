/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 모든 페이지를 동적 렌더링으로 처리 (localStorage/document 접근 오류 방지)
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

};

export default nextConfig;
