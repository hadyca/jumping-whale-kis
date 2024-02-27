require("dotenv").config();
import fetch from "node-fetch";
import getToken from "./token";

export default async function getCandle() {
  // const token = await getToken(); //추 후 db에 저장하고 db에 호출하는식으로 로직 짜야함
  // console.log(token);
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6ImY2MzRlMDQ0LWQ0ZDgtNGZmYy1iOWViLTRiNGU1MzAzNWVhOSIsImlzcyI6InVub2d3IiwiZXhwIjoxNzA3OTY3NjU2LCJpYXQiOjE3MDc4ODEyNTYsImp0aSI6IlBTUlViQ3RQdUJIVUVwcWRvTzdRNTU3NUlDbDFCejZKVE1zUCJ9.a2kzE4tzHMgGof1My8Y9aHZbkPK2FY3gLgF1X3Vt-JmKjWaQijaYAsLlMU7F2m9S9E1TK7VIcsXRWjB8tblQvQ`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "FHKIF03020200",
    custtype: "P",
  };
  const params = {
    FID_COND_MRKT_DIV_CODE: "F",
    FID_INPUT_ISCD: "105V03",
    FID_HOUR_CLS_CODE: "300",
    FID_PW_DATA_INCU_YN: "Y",
    FID_FAKE_TICK_INCU_YN: "N",
    FID_INPUT_DATE_1: "20240214",
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
  try {
    const res = await fetch(`${BASE_URL}${PATH}?${queryString}`, options);
    const resData = await res.json();
    const output2 = resData.output2;
    return output2;
  } catch (error) {
    console.log("kis 캔들 fetch 에러 :", error);
  }
}
