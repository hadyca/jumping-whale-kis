require("dotenv").config();
import fetch from "node-fetch";
import getToken from "./api/token";
import getKoreaTime from "./utils/KoreaTime";
import supabase from "./supabaseClient";
import autoTrading from "./utils/autoTrading";

// 장시간 8:45~15:45, 최종거래일에는 8:45~15:20
//해당 자동매매 운영시간은 8:45~15:15, 최종거래일에는 8:45~14:50로 설정(한국시간기준) -  장 마감 30분전에 종료
export default async function start() {
  let token;
  let tokenExpirationTime;

  //초기시작 supabase db에서 토큰값 및 토큰만료시간 조회
  const { data: userData, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", 1)
    .single();
  token = userData?.token;
  tokenExpirationTime = userData?.tokenExpirationTime;
  if (error) {
    console.log("userData조회에러", error);
  }

  //기존 토큰만료시간이 지났거나, supabase 조회 시 토큰값이 null인 경우 kis에서 token값 받아온 후, db에 저장
  const nowKoreaTime = getKoreaTime();
  if (
    nowKoreaTime > tokenExpirationTime ||
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
    token = tokenData.access_token;
    tokenExpirationTime = tokenData.access_token_token_expired;
  }

  //토큰값이 있고, 현재시간이 만료시간이 지나지 않았으면 자동매매 시작
  if (token !== null && nowKoreaTime < tokenExpirationTime) {
    console.log("오토 트레이딩 시작");
    const autoResult = await autoTrading(nowKoreaTime, tokenExpirationTime);
    if (autoResult === false) {
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
      token = tokenData.access_token;
      tokenExpirationTime = tokenData.access_token_token_expired;
      start();
    }
  }
}
