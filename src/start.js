require("dotenv").config();
import fetch from "node-fetch";
import getToken from "./api/token";
import getKoreaTime from "./utils/KoreaTime";
import getClosingPrice from "./utils/reverse_closing";
import calculateRsi from "./utils/calculateRsi";
import getCandle from "./api/candle";
import getCandle_2 from "./api/candle_2";
import firstTrading from "./utils/firstTrading";

// 장시간 8:45~15:45, 최종거래일에는 8:45~15:20
//해당 자동매매 운영시간은 8:45~15:15, 최종거래일에는 8:45~14:50로 설정(한국시간기준) -  장 마감 30분전에 종료
export default async function start() {
  const SET_ROW_RSI = 30;
  const SET_HIGH_RSI = 70;
  const TICKER = "105V03"; //미니 코스피200
  const INTERVAL = {
    "5m": 60 * 5,
  };

  //추 후 토큰 만료시간, 토큰 값 db 연동
  let tokenExpired = "2024-03-01 14:30:45";
  let token =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0b2tlbiIsImF1ZCI6IjQ4ZmE2NmQ0LTUyMWYtNDQ5My1hYjliLTNjM2E3YmU2YjA4YiIsImlzcyI6InVub2d3IiwiZXhwIjoxNzA5MjcxMDQ1LCJpYXQiOjE3MDkxODQ2NDUsImp0aSI6IlBTUlViQ3RQdUJIVUVwcWRvTzdRNTU3NUlDbDFCejZKVE1zUCJ9.4c6pEAasOJjRODhkFaNJ6YyeNI5W_w8RChE3TKhkmCoyG1hg2TiNbDhuYDg2d3MCJj3xCeza59dqUBC5zEK1yQ";
  const nowKoreaTime = getKoreaTime();
  if (nowKoreaTime > tokenExpired) {
    const tokenData = await getToken();
    console.log(tokenData);
    tokenExpired = tokenData.access_token_token_expired;
    token = tokenData.access_token;
  }

  //첫번째 캔들값 (102개 조회)
  const candleValue = await getCandle(token, TICKER, INTERVAL["5m"]);
  const inputDate = candleValue[candleValue.length - 1].stck_bsop_date;
  const inputHour = candleValue[candleValue.length - 1].stck_cntg_hour;
  //두번째 캔들값 (102개 조회)
  const candleValue_2 = await getCandle_2(
    token,
    TICKER,
    INTERVAL["5m"],
    inputDate,
    inputHour
  );

  //첫번째 캔들값 마지막 배열 값 삭제(두번째 캔들값 첫번째와 중복되기 때문)
  const newCandleValue = candleValue.slice(0, -1);

  //2개 캔들값 합치기
  const totalCandleValue = [...newCandleValue, ...candleValue_2];

  // 102개 종가 배열 [과거->최신순]
  const closingPriceArr = getClosingPrice(totalCandleValue);

  //rsi값이 증권사 마다 구하는 공식이 다르다. 내가 구한거는 키움증권값이랑 유사
  const rsiData = calculateRsi(closingPriceArr);
  // //현재가
  // const nowPrice = candleValue[0].futs_prpr;

  //최초 포지션 진입
  //진입 가능 시간 설정 (8:45~15:15, 최종거래일에는 8:45~14:50) -  장 마감 30분전에 종료
  const positionId = await firstTrading({
    setRowRsi: SET_ROW_RSI,
    setHighRsi: SET_HIGH_RSI,
    beforeRsi: rsiData.beforeRsi,
    nowRsi: rsiData.nowRsi,
  });

  //위 포지션id로 평균 체결가 확인 및 익절가, 손절가 세팅

  //if문으로 시장가 매도 익절가 세팅
  //if문으로 시장가 매도 손절가 세팅
  //만약 15:45까지 사장가 매도가 안되고 시장가 매수가 걸려 있다면 마지막 시간 대에 시장가 매도로 포지션 청산

  //if문으로 시장가 매수 익절가 세팅
  //if문으로 시장가 매수 손절가 세팅
  //만약 15:45까지 사장가 매수가 안되고 시장가 매도가 걸려 있다면 마지막 시간 대에 시장가 매수로 포지션 청산

  if (positionId === undefined) {
    setTimeout(start, 1000);
  } else {
    console.log("🎉 트레이딩 완료!");
  }
  return "성공";
}
