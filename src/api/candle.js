require("dotenv").config();
import fetch from "node-fetch";

export default async function getCandle() {
  const headers = {
    "content-type": "application/json",
    authorization:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6IjAxODVmOTZkLWYxY2EtNDgxOC1iNTJkLWExNzUyZDIzNWYwZSIsImlzcyI6InVub2d3IiwiZXhwIjoxNzA3NTYyNTA5LCJpYXQiOjE3MDc0NzYxMDksImp0aSI6IlBTUlViQ3RQdUJIVUVwcWRvTzdRNTU3NUlDbDFCejZKVE1zUCJ9.81uXx569tjtdPFgwQtOGLeEGc6xMHSiMLt5CY8KOgXQKrFRRr5Sw8muTVVWTV4MtX2F7KD-iJojVCo2estXlUQ",
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "HHDFC55020400",
    custtype: "P",
  };
  const params = {
    SRS_CD: "6AZ23",
    EXCH_CD: "CME",
    START_DATE_TIME: "",
    CLOSE_DATE_TIME: "20231214",
    QRY_TP: "",
    QRY_CNT: "100",
    QRY_GAP: "5",
    INDEX_KEY: "",
  };
  const queryString = new URLSearchParams(params).toString();
  const options = {
    method: "GET",
    headers,
  };
  try {
    const res = await fetch(
      `https://openapi.koreainvestment.com:9443/uapi/overseas-futureoption/v1/quotations/inquire-time-futurechartprice?${queryString}`,
      options
    );
    const resData = await res.json();
    console.log("kis 캔들값 :", resData);
  } catch (error) {
    console.log("kis 캔들 fetch 에러 :", error);
  }
}
