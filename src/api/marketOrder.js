import fetch from "node-fetch";

export default async function marketOrder(
  token,
  account,
  accountType,
  side,
  ticker,
  orderQty
) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "TTTO1101U", //선물 매수 매도 주간
    custtype: "P",
  };
  const body = {
    ORD_PRCS_DVSN_CD: "02",
    CANO: account,
    ACNT_PRDT_CD: accountType,
    SLL_BUY_DVSN_CD: side, //01:매도, 02:매수
    SHTN_PDNO: ticker,
    ORD_QTY: orderQty,
    UNIT_PRICE: "0", //시장가 주문 디폴트값
    ORD_DVSN_CD: "02", // 시장가 주문
  };
  const options = {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  };
  const BASE_URL = "https://openapi.koreainvestment.com:9443";
  const PATH = "/uapi/domestic-futureoption/v1/trading/order";
  const url = `${BASE_URL}${PATH}`;
  try {
    const res = await fetch(url, options);
    const resData = await res.json();
    console.log(resData);
    return resData;
  } catch (error) {
    console.log("kis api marketBuy 에러:", resData);
  }
}
