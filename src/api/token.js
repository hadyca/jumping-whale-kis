require("dotenv").config();
import fetch from "node-fetch";

export default async function getToken() {
  const body = {
    grant_type: "client_credentials",
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
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
    return resData;
  } catch (error) {
    console.log("kis 토큰값 fetch 에러 :", resData);
  }
}
