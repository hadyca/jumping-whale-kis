import fetch from "node-fetch";

export default async function autoTrading(nowKoreaTime, tokenExpirationTime) {
  console.log(nowKoreaTime);
  setTimeout(autoTrading, 1000, nowKoreaTime, tokenExpirationTime);
  // if (nowKoreaTime >= tokenExpirationTime) {
  //   return false;
  // }
  // //아니라면 autoTrading 재실행
  // if (nowKoreaTime < tokenExpirationTime) {
  //   const SET_ROW_RSI = 30;
  //   const SET_HIGH_RSI = 70;
  //   const TICKER = "105V03"; //미니 코스피200
  //   const INTERVAL = {
  //     "5m": 60 * 5,
  //   };
  //   const ACCOUNT = "46500144";
  //   const ACCOUNT_TYPE = "03";
  //   //첫번째 캔들값 (102개 조회)
  //   const candleValue = await getCandle(token, TICKER, INTERVAL["5m"]);
  //   const inputDate = candleValue[candleValue.length - 1].stck_bsop_date;
  //   const inputHour = candleValue[candleValue.length - 1].stck_cntg_hour;
  //   //두번째 캔들값 (102개 조회)
  //   const candleValue_2 = await getCandle_2(
  //     token,
  //     TICKER,
  //     INTERVAL["5m"],
  //     inputDate,
  //     inputHour
  //   );

  //   //첫번째 캔들값 마지막 배열 값 삭제(두번째 캔들값 첫번째와 중복되기 때문)
  //   const newCandleValue = candleValue.slice(0, -1);

  //   //2개 캔들값 합치기
  //   const totalCandleValue = [...newCandleValue, ...candleValue_2];

  //   // 102개 종가 배열 [과거->최신순]
  //   const closingPriceArr = getClosingPrice(totalCandleValue);

  //   //rsi값이 증권사 마다 구하는 공식이 다르다. 내가 구한거는 키움증권값이랑 유사
  //   const rsiData = calculateRsi(closingPriceArr);
  //   console.log(rsiData);
  //   // //현재가
  //   // const nowPrice = candleValue[0].futs_prpr;

  //   // 기존 포지션이 없다면, 최초 포지션 진입
  //   //잔고현황 api 가지고와야함
  //   // const balance = await getBalance(token, ACCOUNT, ACCOUNT_TYPE);
  //   // console.log(balance);

  //   // if(포지션이 없다면){
  //   //   const positionId = await firstPosition({
  //   //     setRowRsi: SET_ROW_RSI,
  //   //     setHighRsi: SET_HIGH_RSI,
  //   //     beforeRsi: rsiData.beforeRsi,
  //   //     nowRsi: rsiData.nowRsi,
  //   //   });
  //   // }

  //   //최초 포지션 진입이 안되면 다시 start실행 함수 실행,
  //   // if (positionId === undefined) {
  //   //   setTimeout(start, 1000);
  //   // }

  //   //최초 포지션 진입이 성공 되면 실행
  //   // if (positionId !== undefined) {
  //   //   위 포지션id로 매수,매도 구분, 평균 체결가 확인 및 익절가, 손절가 세팅

  //   //   만약 기존 포지션이 "매수"라면,
  //   //   if문으로 시장가 매도 익절가 세팅
  //   //   if문으로 시장가 매도 손절가 세팅
  //   //   만약 15:45까지 사장가 매도가 안되고 시장가 매수가 걸려 있다면 마지막 시간 대에 시장가 매도로 포지션 청산

  //   //   만약 기존 포지션이 "매도"라면,
  //   //   if문으로 시장가 매수 익절가 세팅
  //   //   if문으로 시장가 매수 손절가 세팅
  //   //   만약 15:45까지 사장가 매수가 안되고 시장가 매도가 걸려 있다면 마지막 시간 대에 시장가 매수로 포지션 청산

  //   // }
  // }
}
