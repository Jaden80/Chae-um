const https = require('https');

const KAKAO_MAP_API_KEY = "ef71768347f9b6b7b7ce54b130348560";
const address = "세종특별자치시 다정남로 93";

const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

const options = {
  headers: {
    'Authorization': `KakaoAK ${KAKAO_MAP_API_KEY}`,
    'Origin': 'http://localhost:3000',
    'Referer': 'http://localhost:3000/',
    'KA': 'sdk/1.0.0 os/javascript lang/ko-KR device/web origin/http%3A%2F%2Flocalhost%3A3000'
  }
};

https.get(url, options, (res) => {
  console.log('Response Status:', res.statusCode, res.statusMessage);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw Data:', data);
    }
  });
}).on('error', (err) => {
  console.error('HTTPS Error:', err);
});
