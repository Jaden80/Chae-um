const http = require('http');

const DATA_GO_KR_API_KEY = "9b5615f26081a45c68b67a57587d9548c905f75b4a8dd546c24f1be335cfb201";
const url = "http://apis.data.go.kr/B552713/svc004/getCrtfPrgmInfo?serviceKey=" + DATA_GO_KR_API_KEY + "&returnType=json&numOfRows=5&pageNo=1&ctpvNm=%EC%84%B8%EC%A2%85%ED%8A%B9%EB%B3%84%EC%9E%90%EC%B9%98%EC%8B%9C";

console.log("Fetching KYWA url:", url);
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
