import fetch from "node-fetch";

export default async function getAvailableQty(
  token,
  account,
  accountType,
  ticker,
  side
) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "TTTO5105R",
    custtype: "P",
  };
  const params = {
    CANO: account,
    ACNT_PRDT_CD: accountType,
    PDNO: ticker,
    SLL_BUY_DVSN_CD: side,
    UNIT_PRICE: "0", //주문가격이 0이면 현재가
    ORD_DVSN_CD: "02", //주문방법 : 시장가
  };
  const queryString = new URLSearchParams(params).toString();
  const options = {
    method: "GET",
    headers,
  };
  const BASE_URL = "https://openapi.koreainvestment.com:9443";
  const PATH = "/uapi/domestic-futureoption/v1/trading/inquire-psbl-order";
  const PARAMS = `?${queryString}`;

  const url = `${BASE_URL}${PATH}${PARAMS}`;
  try {
    const res = await fetch(url, options);
    const resData = await res.json();
    return resData.output;
  } catch (error) {
    console.log("kis api availableQty 에러:", error);
  }
}
