const https = require('https');

const KAKAO_MAP_API_KEY = "ef71768347f9b6b7b7ce54b130348560";

const placesToSearch = [
  "대전교통문화연수원",
  "충청남도어린이안전체험관",
  "세종시립도서관",
  "국립세종수목원",
  "세종특별자치시청"
];

async function searchGlobalPlace(keyword) {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&size=1`;

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
              address: first.road_address_name || d.address_name,
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
  console.log("Searching global landmarks near Sejong...");
  for (const name of placesToSearch) {
    const res = await searchGlobalPlace(name);
    console.log(JSON.stringify(res, null, 2));
  }
}

run();
