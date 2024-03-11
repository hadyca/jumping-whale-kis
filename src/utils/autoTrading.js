import fetch from "node-fetch";
import getCandle from "./../api/candle";
import getCandle_2 from "./../api/candle_2";
import getClosingPrice from "./reverse_closing";
import calculateRsi from "./calculateRsi";
import getKoreaTime from "./KoreaTime";
import getAvailableQty from "../api/availableQty";
import marketBuy from "../api/marketBuy";

export default async function autoTrading(token, tokenExpirationTime) {
  const nowKoreaTime = getKoreaTime();

  //지금 시간이 만료일보다 지났으면 false값 리턴
  if (nowKoreaTime >= tokenExpirationTime) {
    return false;
  }

  //아니라면 autoTrading 마지막에 재실행
  if (nowKoreaTime < tokenExpirationTime) {
    const SET_ROW_RSI = 30;
    const SET_HIGH_RSI = 70;
    const TICKER = "105V03"; //미니 코스피200
    const INTERVAL = {
      "5m": 60 * 5,
    };
    const ACCOUNT = "46500144";
    const ACCOUNT_TYPE = "03";
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

    let position = [];
    console.log(
      rsiData,
      "/ 현재가:",
      candleValue[0].futs_prpr,
      "/ 보유 포지션:",
      position
    );
    const qty = await getAvailableQty(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      TICKER,
      "02"
    );
    console.log(qty);

    //시장가 매수 매도 테스트
    const marketBuyResult = await marketBuy(
      ACCOUNT,
      ACCOUNT_TYPE,
      "02", //01:매도, 02:매수
      TICKER,
      "1" //오더수량
    );
    if (rsiData.beforeRsi < SET_ROW_RSI && rsiData.nowRsi > SET_ROW_RSI) {
      //시장가 매수
      //시장가 매수 관련 정보 텔레그램 알람 (계약수량, 평균체결가, 총체결가)
      await sendTelegramMsg("매수성공");
      return; //리턴 값은 매수 id
    }

    if (rsiData.beforeRsi > SET_HIGH_RSI && rsiData.nowRsi < SET_HIGH_RSI) {
      //시장가 매도
      //시장가 매도 관련 정보 텔레그램 알람
      return; //리턴 값은 매도 id
    }
    // setTimeout(autoTrading, 1000, token, tokenExpirationTime);
  }
}
