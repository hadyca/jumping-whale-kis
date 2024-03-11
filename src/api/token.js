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

  const BASE_URL = "https://openapi.koreainvestment.com:9443";
  const PATH = "/oauth2/tokenP";
  const url = `${BASE_URL}${PATH}`;

  try {
    const res = await fetch(url, options);
    const resData = await res.json();
    return resData;
  } catch (error) {
    console.log("kis api token 에러:", resData);
  }
}
