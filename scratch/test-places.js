const https = require('https');

const KAKAO_MAP_API_KEY = "ef71768347f9b6b7b7ce54b130348560";
// 새움초등학교 실제 위치
const schoolLat = 36.49410434193;
const schoolLng = 127.25143090013;

const placesToSearch = [
  "세종특별자치시 어린이 안전체험관",
  "세종시립도서관",
  "국립세종수목원",
  "세종과학예술영재학교", // 과학 체험 대체
  "세종시 역사 박물관"
];

async function searchPlaceCoords(keyword) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&y=${schoolLat}&x=${schoolLng}&radius=20000`;

  const options = {
    headers: {
      'Authorization': `KakaoAK ${KAKAO_MAP_API_KEY}`,
      'Origin': 'http://localhost:3000',
      'Referer': 'http://localhost:3000/',
      'KA': 'sdk/1.0.0 os/javascript lang/ko-KR device/web origin/http%3A%2F%2Flocalhost%3A3000'
    }
  };

  return new Promise((resolve) => {
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.documents && json.documents.length > 0) {
            const first = json.documents[0];
            resolve({
              keyword,
              success: true,
              name: first.place_name,
              address: first.road_address_name || first.address_name,
              lat: parseFloat(first.y),
              lng: parseFloat(first.x)
            });
          } else {
            resolve({ keyword, success: false });
          }
        } catch {
          resolve({ keyword, success: false });
        }
      });
    }).on('error', () => resolve({ keyword, success: false }));
  });
}

async function run() {
  console.log("Searching actual coordinates for places near Saeum ES...");
  for (const keyword of placesToSearch) {
    const res = await searchPlaceCoords(keyword);
    console.log(JSON.stringify(res, null, 2));
  }
}

run();
