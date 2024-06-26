import fetch from "node-fetch";
import getToken from "./api/token";
import { getKoreaTime, getKoreaTime_plus1m } from "./utils/KoreaTime";
import supabase from "./supabaseClient";
import { autoTrading } from "./utils/autoTrading";

let startTradingTimeout;
export async function startTrading(token, tokenExpirationTime) {
  //기존 토큰만료시간이 지났거나, supabase 조회 시 토큰값이 null인 경우 kis에서 token값 받아온 후, db에 저장
  const nowKoreaDate = getKoreaTime();
  const userSettingAry = [
    { ticker: "106V06", userOrderQty: "23", tickerKor: "코스닥150(6월)" },
    { ticker: "101V06", userOrderQty: "5", tickerKor: "코스피200(6월)" },
  ];

  if (
    nowKoreaDate >= tokenExpirationTime ||
    token === null ||
    tokenExpirationTime === null
  ) {
    console.log("토큰 발행 및 supabase db 저장");
    const tokenData = await getToken();
    await supabase
      .from("user")
      .upsert({
        id: 1,
        token: tokenData?.access_token,
        tokenExpirationTime: tokenData?.access_token_token_expired,
      })
      .select();
    clearTimeout(startTradingTimeout);
    return startTrading(
      tokenData.access_token,
      tokenData.access_token_token_expired
    );
  }

  //토큰값이 있고, 현재시간이 만료시간이 지나지 않았으면 자동매매 시작
  if (token !== null && nowKoreaDate < tokenExpirationTime) {
    for (const userObj of userSettingAry) {
      await autoTrading(
        token,
        false,
        userObj.ticker,
        userObj.userOrderQty,
        userObj.tickerKor
      );
      //중복 매매 되면 다시 요걸로..
      // await new Promise((resolve) => {
      //   autoTrading(
      //     token,
      //     false,
      //     userObj.ticker,
      //     userObj.userOrderQty,
      //     userObj.tickerKor
      //   ).then(() => resolve());
      // });
    }
    return await new Promise((resolve) => {
      setTimeout(() => {
        startTrading(token, tokenExpirationTime);
        resolve();
      }, 500);
    });
  }
}

// 재귀 호출 중지
export async function stopTrading() {
  await autoTrading("_", true);
  clearTimeout(startTradingTimeout);
}
