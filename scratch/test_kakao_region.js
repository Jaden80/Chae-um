const http = require('https');

const KAKAO_MAP_API_KEY = "ef71768347f9b6b7b7ce54b130348560";
const url = "https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=127.2890&y=36.4800";

console.log("Fetching Kakao region URL:", url);
const req = http.get(url, {
  headers: {
    'Authorization': 'KakaoAK ' + KAKAO_MAP_API_KEY,
    'Origin': 'http://localhost:3000',
    'Referer': 'http://localhost:3000/',
    'KA': 'sdk/1.0.0 os/javascript lang/ko-KR device/web origin/http%3A%2F%2Flocalhost%3A3000'
  }
}, (res) => {
  console.log("Status:", res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response data:", JSON.parse(data));
  });
});

req.on('error', (err) => {
  console.error("Error:", err);
});
