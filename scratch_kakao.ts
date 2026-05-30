import { searchPlaces } from "./lib/api/kakao-map.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function test() {
  const res = await searchPlaces("국립중앙박물관");
  console.log(res);
}
test();
