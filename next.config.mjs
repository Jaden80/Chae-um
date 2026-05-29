/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEIS_API_KEY: process.env.NEIS_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    DATA_GO_KR_API_KEY: process.env.DATA_GO_KR_API_KEY,
    KAKAO_MAP_API_KEY: process.env.KAKAO_MAP_API_KEY,
  }
};

export default nextConfig;
