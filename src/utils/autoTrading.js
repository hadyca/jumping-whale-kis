import getCandle from "./../api/candle";
import getCandle_2 from "./../api/candle_2";
import getClosingPrice from "./reverse_closing";
import calculateRsi from "./calculateRsi";
import { getKoreaHour } from "./KoreaTime";
import getAvailableQty from "../api/availableQty";
import sendTelegramMsg from "./telegramMsg";
import marketOrder from "../api/marketOrder";
import getContractDetail from "../api/contractDetail";
import convertComma from "./commas";
import buyLiquidation from "./buyLiquidation";
import sellLiquidation from "./sellLiquidation";

//내 보유 포지션
let buyPositionAry = [];
let sellPositionAry = [];
let entryCandleTime = [];

export async function autoTrading(
  token,
  stopSignal,
  ticker,
  userOrderQty,
  tickerKor
) {
  if (stopSignal) {
    buyPositionAry = [];
    sellPositionAry = [];
    entryCandleTime = [];

    return;
  }
  const SET_ROW_RSI_MIN = 20;
  const SET_ROW_RSI_MAX = 30;
  const SET_ROW_RSI_OVER = 31;
  const SET_HIGH_RSI = 70;
  const SET_HIGH_RSI_OVER = 69;
  const INTERVAL = {
    "5m": 60 * 5,
  };

  const ACCOUNT = "46500144";
  const ACCOUNT_TYPE = "03";

  //to-be: 수익 퍼센티지 설정 (트레일링으로 만들어보기, 감시가 대비 0.04p하락)
  const PROFIT_PERCENT = 0.001; //0.1%
  const LOSS_PERCENT = PROFIT_PERCENT * 2;

  const POSITION_FIRST_ENTRY_TIME = "08:45:00";
  const POSITION_FINISH_ENTRY_TIME = "09:15:00";

  //to-be:이건 5분봉 기준이다. 몇분봉에 따라서 시간이 바뀌어야함.(30분 기준 )
  const FORCED_LIQUIDATE_START_TIME = "15:34:50";
  const FORCED_LIQUIDATE_TIME = "15:35:00";

  //최종 거래일 기준 (최종거래일에는 아래 시간으로 세팅)
  // const LASTDAY_POSITION_ENTRY_TIME = "14:50:00";
  // const LASTDAY_FORCED_LIQUIDATE_TIME = "15:00:00";

  // 자동봇 거래시간
  const nowKoreaHour = getKoreaHour();
  //to-be최종거래일일 때 자동거래시간 세팅필요

  //첫번째 캔들값 (102개 조회)
  const candleValue = await getCandle(token, ticker, INTERVAL["5m"]);
  if (
    nowKoreaHour < POSITION_FIRST_ENTRY_TIME ||
    nowKoreaHour > FORCED_LIQUIDATE_TIME
  ) {
    console.log("자동 봇 매매 시간이 아닙니다.");
    return;
  }

  const currentPoint = parseFloat(candleValue[0].futs_prpr);
  const currentCandleTime = candleValue[0].stck_cntg_hour;
  const currentDate = candleValue[0].stck_bsop_date;
  const inputDate = candleValue[candleValue.length - 1].stck_bsop_date;
  const inputHour = candleValue[candleValue.length - 1].stck_cntg_hour;
  //두번째 캔들값 (102개 조회)
  const candleValue_2 = await getCandle_2(
    token,
    ticker,
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

  //------------------------------포지션 진입 로직------------------------------

  //동일 시간 대 캔들봉 여부 확인
  const candleObj = entryCandleTime.find((obj) => obj.ticker === ticker);
  const isCandleTime = candleObj
    ? candleObj.currentCandleTime === currentCandleTime
    : false;

  if (
    rsiData.beforeRsi > SET_ROW_RSI_MIN &&
    rsiData.beforeRsi < SET_ROW_RSI_MAX &&
    rsiData.nowRsi > SET_ROW_RSI_OVER &&
    nowKoreaHour < POSITION_FINISH_ENTRY_TIME &&
    currentCandleTime !== "084500" &&
    !isCandleTime
  ) {
    // 주문 가능수량 조회
    const availQty = await getAvailableQty(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      ticker,
      "02" // 매수
    );

    if (parseInt(userOrderQty) > parseInt(availQty.ord_psbl_qty)) {
      console.log(
        "티커:",
        ticker,
        "주문요청수량:",
        userOrderQty,
        "주문가능수량:",
        availQty,
        "매수 주문가능수량이 부족합니다. 주문수량을 확인하세요."
      );
      return;
    }

    const marketBuyResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "02", //01:매도, 02:매수
      ticker,
      userOrderQty
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    //매수 포지션 진입한 거래 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      currentDate, //매매 당시 날짜
      marketBuyResult.ODNO //매매 주문 번호
    );

    const avgPoint = parseFloat(contractResult.avg_idx);
    //익절,손절 목표 포인트
    const targetProfit = avgPoint + avgPoint * PROFIT_PERCENT;
    const targetLoss = avgPoint - avgPoint * LOSS_PERCENT;

    const totalPrice = contractResult.tot_ccld_amt;
    const commaTotalPrice = convertComma(totalPrice);

    //포지션 객체 생성 및 배열에 객체 넣기
    const newPosition = {
      ticker,
      id: contractResult.odno, //주문 번호
      side: "buy",
      orderQty: contractResult.tot_ccld_qty,
      point: contractResult.avg_idx,
      totalPrice: contractResult.tot_ccld_amt,
      targetProfit,
      targetLoss,
    };
    buyPositionAry.push(newPosition);

    //매수 포지션 진입 캔들봉 시간 설정
    entryCandleTime.push({
      ticker,
      currentCandleTime,
    });

    //텔레그램 알람
    await sendTelegramMsg(`
        🔼매수 포지션 진입
        자산:${tickerKor}
        진입 주문번호:${contractResult.odno}
        
        진입 계약수량:${contractResult.tot_ccld_qty}
        진입 평균체결:${contractResult.avg_idx}
        진입 총체결금액:${commaTotalPrice}
        
        🐋🐋🐋
        익절목표:${targetProfit}
        손절목표:${targetLoss}
            `);

    return;
  }

  //시장가 매도 포지션 진입
  if (
    rsiData.beforeRsi > SET_HIGH_RSI &&
    rsiData.nowRsi < SET_HIGH_RSI_OVER &&
    nowKoreaHour < POSITION_FINISH_ENTRY_TIME &&
    currentCandleTime !== "084500" &&
    !isCandleTime
  ) {
    //주문 가능수량 조회
    const availQty = await getAvailableQty(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      ticker,
      "01" // 매도
    );

    if (parseInt(userOrderQty) > parseInt(availQty.ord_psbl_qty)) {
      console.log(
        "티커:",
        ticker,
        "주문요청수량:",
        userOrderQty,
        "주문가능수량:",
        availQty,
        "매도 주문가능수량이 부족합니다. 주문수량을 확인하세요."
      );
      return;
    }
    const marketSellResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "01", //01:매도, 02:매수
      ticker,
      userOrderQty //오더수량
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));

    //매도 포지션 진입한 거래 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      currentDate, //매매 당시 날짜
      marketSellResult.ODNO //매매 주문 번호
    );

    const avgPoint = parseFloat(contractResult.avg_idx);
    //익절, 손절 목표가
    const targetProfit = avgPoint - avgPoint * PROFIT_PERCENT;
    const targetLoss = avgPoint + avgPoint * LOSS_PERCENT;

    const totalPrice = contractResult.tot_ccld_amt;
    const commaTotalPrice = convertComma(totalPrice);

    //포지션 객체 생성 및 배열에 객체 넣기
    const newPosition = {
      ticker,
      id: contractResult.odno, //주문 번호
      side: "sell",
      orderQty: contractResult.tot_ccld_qty,
      point: contractResult.avg_idx,
      totalPrice: contractResult.tot_ccld_amt,
      targetProfit,
      targetLoss,
    };
    sellPositionAry.push(newPosition);

    //매도 포지션 진입 캔들봉 시간 설정
    entryCandleTime.push({
      ticker,
      currentCandleTime,
    });

    //텔레그램 알람
    await sendTelegramMsg(`
        🔽매도 포지션 진입
        자산:${tickerKor}
        진입 주문번호:${contractResult.odno}
        
        진입 계약수량:${contractResult.tot_ccld_qty}
        진입 평균체결:${contractResult.avg_idx}
        진입 총체결금액:${commaTotalPrice}
            
        🐋익절목표:${targetProfit}
        🐋손절목표:${targetLoss}
        `);

    return;
  }

  //------------------------------청산 로직------------------------------

  //매수 포지션 조건에 맞는 객체 찾기 (조건:익절금액이 현재가 보다 크거나,손절금액이 현재가보다 작음)

  const foundbuyLiquidationObj = buyPositionAry.find(
    (obj) => obj.ticker === ticker
  );

  const buyPositionObj = foundbuyLiquidationObj
    ? currentPoint > foundbuyLiquidationObj.targetProfit ||
      currentPoint < foundbuyLiquidationObj.targetLoss
      ? foundbuyLiquidationObj
      : null
    : null;

  //매도 포지션 조건에 맞는 객체 찾기 (조건:익절금액이 현재가 보다 작거나,손절금액이 현재가보다 큼)
  const foundsellLiquidationObj = sellPositionAry.find(
    (obj) => obj.ticker === ticker
  );

  const sellPositionObj = foundsellLiquidationObj
    ? currentPoint < foundsellLiquidationObj.targetProfit ||
      currentPoint > foundsellLiquidationObj.targetLoss
      ? foundsellLiquidationObj
      : null
    : null;

  //매수 포지션 청산 로직
  if (buyPositionObj) {
    //포지션 배열에서 해당값 삭제
    await new Promise((resolve) => {
      const foundIndex = buyPositionAry.indexOf(buyPositionObj);
      buyPositionAry.splice(foundIndex, 1);
      resolve();
    });

    await buyLiquidation(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      ticker,
      tickerKor,
      buyPositionObj,
      currentDate
    );
    return;
  }

  //매도 포지션 청산 로직
  if (sellPositionObj) {
    //포지션 배열에서 해당값 삭제
    await new Promise((resolve) => {
      const foundIndex = sellPositionAry.indexOf(sellPositionObj);
      sellPositionAry.splice(foundIndex, 1);
      resolve();
    });

    await sellLiquidation(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      ticker,
      tickerKor,
      sellPositionObj,
      currentDate
    );

    return;
  }

  //------------------------------강제 청산 로직 (장 마감 전)------------------------------
  if (nowKoreaHour > FORCED_LIQUIDATE_START_TIME) {
    entryCandleTime = [];

    if (buyPositionAry.length > 0) {
      //매수 포지션 강제 청산
      buyPositionAry.map(async (obj) => {
        await buyLiquidation(
          token,
          ACCOUNT,
          ACCOUNT_TYPE,
          ticker,
          tickerKor,
          obj,
          currentDate
        );
      });
      buyPositionAry = [];
      return;
    }

    if (sellPositionAry.length > 0) {
      //매도 포지션 강제 청산
      sellPositionAry.map(async (obj) => {
        await sellLiquidation(
          token,
          ACCOUNT,
          ACCOUNT_TYPE,
          ticker,
          tickerKor,
          obj,
          currentDate
        );
      });
      sellPositionAry = [];
      return;
    }
  }

  //------------------------------콘솔 로그------------------------------
  const buyPositionLength = buyPositionAry.filter(
    (obj) => obj.ticker === ticker
  ).length;
  const sellPositionLength = sellPositionAry.filter(
    (obj) => obj.ticker === ticker
  ).length;

  console.log(
    "자산:",
    tickerKor,
    rsiData,
    "/ 현재가:",
    currentPoint,
    "/ 매수 포지션:",
    buyPositionLength,
    "/ 매도 포지션",
    sellPositionLength
  );
  return;
}
