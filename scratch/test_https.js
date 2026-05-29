const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const apiKey = envConfig.DATA_GO_KR_API_KEY;

async function test1383000() {
  const url = `https://apis.data.go.kr/1383000/YouthActivInfoCrtfctSrvc/getCrtfctProgramList?serviceKey=${apiKey}&fcltyNm=${encodeURIComponent("성주과일")}&pageNo=1&numOfRows=10&_type=json`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("1383000 response:", text.substring(0, 300));
  } catch (e) {
    console.error("1383000 error:", e);
  }
}

async function testFacility() {
  const url = `https://api.data.go.kr/openapi/tn_pubr_public_ynt_fclty_sttus_api?serviceKey=${apiKey}&pageNo=1&numOfRows=10&type=json`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("Facility response:", text.substring(0, 300));
  } catch (e) {
    console.error("Facility error:", e);
  }
}

test1383000();
testFacility();
