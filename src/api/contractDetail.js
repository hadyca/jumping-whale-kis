import fetch from "node-fetch";

export default async function getContractDetail(
  token,
  account,
  accountType,
  today,
  orderId
) {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: process.env.KIS_OPEN_API_ACCESS_KEY,
    appsecret: process.env.KIS_OPEN_API_SECRET_KEY,
    tr_id: "TTTO5201R",
    custtype: "P",
  };
  const params = {
    CANO: account,
    ACNT_PRDT_CD: accountType,
    STRT_ORD_DT: today,
    END_ORD_DT: today,
    SLL_BUY_DVSN_CD: "00",
    CCLD_NCCS_DVSN: "01",
    SORT_SQN: "AS", //최신순
    STRT_ODNO: orderId, //조회 시작 번호
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
    if (resData.output1.length === 0) {
      console.log("output1이 빈 배열입니다. 1초 후에 다시 실행합니다.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return getContractDetail(token, account, accountType, today, orderId);
    }
    return resData.output1[0];
  } catch (error) {
    console.log("kis api contractDetail 에러:", error);
  }
}
