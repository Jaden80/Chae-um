const http = require('http');

const DATA_GO_KR_API_KEY = "9b5615f26081a45c68b67a57587d9548c905f75b4a8dd546c24f1be335cfb201";
const url = "http://apis.data.go.kr/B552061/frequentzoneChild/getRestFrequentzoneChild?type=json&searchYearCd=2023&numOfRows=10&pageNo=1&siDo=36&guGun=36110&serviceKey=" + DATA_GO_KR_API_KEY;

console.log("Fetching TAAS url:", url);
http.get(url, (res) => {
  console.log("Status:", res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log("Response data:", data.slice(0, 1000));
  });
}).on('error', (err) => {
  console.error("Error:", err);
});
