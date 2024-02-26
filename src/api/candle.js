require("dotenv").config();
import fetch from "node-fetch";

export default async function getCandle() {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6ImI4MTVlYjMwLTk2YzgtNDIyMC1hN2Y2LTUwMTBhY2RiMDYyNyIsImlzcyI6InVub2d3IiwiZXhwIjoxNzA5MDAwMDI0LCJpYXQiOjE3MDg5MTM2MjQsImp0aSI6IlBTUlViQ3RQdUJIVUVwcWRvTzdRNTU3NUlDbDFCejZKVE1zUCJ9.XKzP2wWSRJW3aX9ypj9_S_OJK0Erb7LUZ7xHHrLA4_tPAsB5gG9_VRFAUuX8GTO08g8AyqCK-O3LSMHEc5gbqQ`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "FHKIF03020200",
    custtype: "P",
    tr_cont: "",
  };
  const params = {
    FID_COND_MRKT_DIV_CODE: "F",
    FID_INPUT_ISCD: "101V03",
    FID_HOUR_CLS_CODE: "300",
    FID_PW_DATA_INCU_YN: "Y",
    FID_FAKE_TICK_INCU_YN: "N",
    FID_INPUT_DATE_1: "20240226",
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
    // const resDataHeader = res.headers;
    console.log("kis 첫번째값 :", resData.output2[0].stck_cntg_hour);
    console.log("kis 마지막값 :", resData.output2[101].stck_cntg_hour);

    return resData;
  } catch (error) {
    console.log("kis 캔들 fetch 에러 :", error);
  }
}
