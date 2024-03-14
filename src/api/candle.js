import fetch from "node-fetch";

export default async function getCandle(token, ticker, interval) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "FHKIF03020200",
    custtype: "P",
  };
  const params = {
    FID_COND_MRKT_DIV_CODE: "F",
    FID_INPUT_ISCD: ticker,
    FID_HOUR_CLS_CODE: interval,
    FID_PW_DATA_INCU_YN: "Y",
    FID_FAKE_TICK_INCU_YN: "N",
    FID_INPUT_DATE_1: "",
    FID_INPUT_HOUR_1: "",
  };
  const queryString = new URLSearchParams(params).toString();
  const options = {
    method: "GET",
    headers,
  };
  const BASE_URL = "https://openapi.koreainvestment.com:9443";
  const PATH =
    "/uapi/domestic-futureoption/v1/quotations/inquire-time-fuopchartprice";
  const PARAMS = `?${queryString}`;

  const url = `${BASE_URL}${PATH}${PARAMS}`;
  try {
    const res = await fetch(url, options);
    const resData = await res.json();
    return resData.output2;
  } catch (error) {
    console.log("kis api candle 에러:", error);
    return await getCandle(token, ticker, interval);
  }
}
