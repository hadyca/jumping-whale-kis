import fetch from "node-fetch";

export default async function getBalance(token, account, accountType) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "CTFO6118R",
    custtype: "P",
  };
  const params = {
    CANO: account,
    ACNT_PRDT_CD: accountType,
    MGNA_DVSN: "02",
    EXCC_STAT_CD: "2",
    CTX_AREA_FK200: "",
    CTX_AREA_NK200: "",
  };
  const queryString = new URLSearchParams(params).toString();
  const options = {
    method: "GET",
    headers,
  };
  const BASE_URL = "https://openapi.koreainvestment.com:9443";
  const PATH = "/uapi/domestic-futureoption/v1/trading/inquire-balance";
  const PARAMS = `?${queryString}`;

  const url = `${BASE_URL}${PATH}${PARAMS}`;
  try {
    const res = await fetch(url, options);
    const resData = await res.json();
    return resData.output2;
  } catch (error) {
    console.log("kis 잔고현황 에러:", error);
  }
}
