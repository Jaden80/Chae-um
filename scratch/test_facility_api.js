const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const apiKey = envConfig.DATA_GO_KR_API_KEY;

async function testFacility(placeName) {
  // Test with https
  const facilityUrl = new URL("https://api.data.go.kr/openapi/tn_pubr_public_ynt_fclty_sttus_api");
  facilityUrl.searchParams.set("serviceKey", apiKey);
  facilityUrl.searchParams.set("pageNo", "1");
  facilityUrl.searchParams.set("numOfRows", "100");
  facilityUrl.searchParams.set("type", "json");

  console.log("Fetching Facility (HTTPS)...");
  try {
    const res = await fetch(facilityUrl.toString());
    const json = await res.json();
    console.log("Facility response header:", json?.response?.header);
  } catch (e) {
    console.error("Facility error HTTPS:", e);
  }
}

testFacility("성주과일");
