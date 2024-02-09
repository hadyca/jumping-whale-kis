require("dotenv").config();
import fetch from "node-fetch";

export default async function start(req, res, next) {
  const apiKey = process.env.KIS_OPEN_API_ACCESS_KEY;
  const secretKey = process.env.KIS_OPEN_API_SECRET_KEY;
  res.send("헬로 월드!");
  const body = {
    grant_type: "client_credentials",
    appkey: apiKey,
    appsecret: secretKey,
  };
  const options = {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
  try {
    const res = await fetch(
      "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
      options
    );
    const resData = await res.json();
    console.log("kis 토큰값 :", resData);
  } catch (error) {
    console.log("kis 토큰값 fetch 에러 :", error);
  }
}
