require("dotenv").config();
import fetch from "node-fetch";
import getToken from "./api/token";
import getKoreaTime from "./utils/KoreaTime";
import getClosingPrice from "./utils/reverse_closing";
import calculateRsi from "./utils/calculateRsi";
import getCandle from "./api/candle";

export default async function start() {
  //추 후 토큰 만료시간, 토큰 값 db 연동
  let tokenExpired = "2024-02-28 11:45:55";
  let token =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6ImEyZTg2ODYyLWRlYTYtNDcwMy05YTI0LTg3NTIxMjE1ZjY3NSIsImlzcyI6InVub2d3IiwiZXhwIjoxNzA5MDg4MzU1LCJpYXQiOjE3MDkwMDE5NTUsImp0aSI6IlBTUlViQ3RQdUJIVUVwcWRvTzdRNTU3NUlDbDFCejZKVE1zUCJ9.efaH1hAHJRNPZ2bxTKXn9FKt9K0JqRRlmEVs2qzTK5aVwhrf94kHByKKtN3p7WGnyirYf00iDRI76I32Yo_cEQ";
  const nowKoreaTime = getKoreaTime();
  if (nowKoreaTime > tokenExpired) {
    const tokenData = await getToken();
    tokenExpired = tokenData.access_token_token_expired;
    token = tokenData.access_token;
  }
  const candleValue = await getCandle(token);
  // 102개 종가 배열 [과거->최신순]
  const closingPriceArr = getClosingPrice(candleValue);
  const rsiData = calculateRsi(closingPriceArr);
  console.log(rsiData);
  return candleValue;
}
