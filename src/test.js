import fetch from "node-fetch";
export default async function test() {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6IjZmNmJiZmFhLWY4NTItNDlkYy04MzE2LWM1NjRhM2Y3NjM1YSIsImlzcyI6InVub2d3IiwiZXhwIjoxNzEzMjIyNTg5LCJpYXQiOjE3MTMxMzYxODksImp0aSI6IlBTUlViQ3RQdUJIVUVwcWRvTzdRNTU3NUlDbDFCejZKVE1zUCJ9.grxWU4vr1tAHzAdlLjHOOaHjP1kt5NhDL4eXYociPpE3BhpSKtQ_Vl2316mQ0KusvV7dYXcBo0UWyFhQ5CWIhg`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "TTTO5201R",
    custtype: "P",
  };
  const params = {
    CANO: "46500144",
    ACNT_PRDT_CD: "03",
    STRT_ORD_DT: "20240415",
    END_ORD_DT: "20240415",
    SLL_BUY_DVSN_CD: "00",
    CCLD_NCCS_DVSN: "01",
    SORT_SQN: "AS", //최신순
    STRT_ODNO: "0000012946", //조회 시작 번호
    PDNO: "",
    MKET_ID_CD: "",
    CTX_AREA_FK200: "",
    CTX_AREA_NK200: "",
  };
  const queryString = new URLSearchParams(params).toString();
  const options = {
    method: "GET",
    headers,
  };
  const BASE_URL = "https://openapi.koreainvestment.com:9443";
  const PATH = "/uapi/domestic-futureoption/v1/trading/inquire-ccnl";
  const PARAMS = `?${queryString}`;

  const url = `${BASE_URL}${PATH}${PARAMS}`;
  try {
    const res = await fetch(url, options);
    const resData = await res.json();
    console.log(resData);
    return resData.output1[0];
  } catch (error) {
    console.log("kis api contractDetail 에러:", error);
  }
}
