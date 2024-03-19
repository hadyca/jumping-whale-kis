import fetch from "node-fetch";
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
let buyEntryCandleTime;
let sellEntryCandleTime;
let trailingBuyPositionAry = [];
let maxValueTrailBuyPositionAry;
let trailingSellPositionAry = [];
let maxValueTrailSuyPositionAry;

export async function autoTrading(token, stopSignal) {
  if (stopSignal) {
    buyEntryCandleTime = null;
    sellEntryCandleTime = null;
    buyPositionAry = [];
    sellPositionAry = [];
    return;
  }

  const trailingStop = false;
  const SET_ROW_RSI = 30;
  const SET_HIGH_RSI = 70;
  const TICKER = "105V04"; //미니 코스피200 4월물
  const INTERVAL = {
    "5m": 60 * 5,
  };

  const ACCOUNT = "46500144";
  const ACCOUNT_TYPE = "03";

  //to-be: 수익 퍼센티지 설정 (트레일링으로 만들어보기, 감시가 대비 0.04p하락)
  const PROFIT_PERCENT = 0.001; //0.1%
  const LOSS_PERCENT = 0.001; //0.1%

  const POSITION_FIRST_ENTRY_TIME = "08:45:00";

  //to-be:이건 5분봉 기준이다. 몇분봉에 따라서 시간이 바뀌어야함.(30분 기준 )
  const FORCED_LIQUIDATE_START_TIME = "15:34:50";
  const FORCED_LIQUIDATE_TIME = "15:35:00";

  //최종 거래일 기준 (최종거래일에는 아래 시간으로 세팅)
  const LASTDAY_POSITION_ENTRY_TIME = "14:50:00";
  const LASTDAY_FORCED_LIQUIDATE_TIME = "15:00:00";

  // 자동봇 거래시간
  const nowKoreaHour = getKoreaHour();

  //to-be최종거래일일 때 자동거래시간 세팅필요

  //첫번째 캔들값 (102개 조회)
  const candleValue = await getCandle(token, TICKER, INTERVAL["5m"]);

  if (
    nowKoreaHour < POSITION_FIRST_ENTRY_TIME ||
    nowKoreaHour > FORCED_LIQUIDATE_TIME ||
    candleValue[0].stck_cntg_hour === "084500"
  ) {
    console.log("자동 봇 매매 시간이 아닙니다.");
    return;
  }

  const currentPoint = parseFloat(candleValue[0].futs_prpr);
  const currentCandleTime = candleValue[0].stck_cntg_hour;

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

  //주문 가능수량 조회
  // const qty = await getAvailableQty(
  //   token,
  //   ACCOUNT,
  //   ACCOUNT_TYPE,
  //   TICKER,
  //   "02"
  // );
  // console.log(qty);

  //시장가 매수 포지션 진입
  if (
    rsiData.beforeRsi < SET_ROW_RSI &&
    rsiData.nowRsi > SET_ROW_RSI &&
    nowKoreaHour < FORCED_LIQUIDATE_START_TIME &&
    buyEntryCandleTime !== currentCandleTime
  ) {
    const marketBuyResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "02", //01:매도, 02:매수
      TICKER,
      "1" //오더수량
    );

    //매수 포지션 진입한 거래 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      candleValue[0].stck_bsop_date, //매매 당시 날짜
      marketBuyResult.ODNO //매매 주문 번호
    );

    //익절,손절 목표 포인트
    const targetProfit = currentPoint + currentPoint * PROFIT_PERCENT;
    const targetLoss = currentPoint - currentPoint * LOSS_PERCENT;

    const totalPrice = contractResult.tot_ccld_amt;
    const commaTotalPrice = convertComma(totalPrice);

    //텔레그램 알람
    await sendTelegramMsg(`
🔼매수 포지션 진입
진입 주문번호:${contractResult.odno}

진입 계약수량:${contractResult.tot_ccld_qty}
진입 평균체결:${contractResult.avg_idx}
진입 총체결금액:${commaTotalPrice}

🐋🐋🐋
익절목표:${targetProfit}
손절목표:${targetLoss}
    `);

    //포지션 객체 생성 및 배열에 객체 넣기
    const newPosition = {
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
    buyEntryCandleTime = currentCandleTime;
  }

  //시장가 매도 포지션 진입
  if (
    rsiData.beforeRsi > SET_HIGH_RSI &&
    rsiData.nowRsi < SET_HIGH_RSI &&
    nowKoreaHour < FORCED_LIQUIDATE_START_TIME &&
    sellEntryCandleTime !== currentCandleTime
  ) {
    const marketSellResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "01", //01:매도, 02:매수
      TICKER,
      "1" //오더수량
    );

    //매도 포지션 진입한 거래 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      candleValue[0].stck_bsop_date, //매매 당시 날짜
      marketSellResult.ODNO //매매 주문 번호
    );

    //익절, 손절 목표가
    const targetProfit = currentPoint - currentPoint * PROFIT_PERCENT;
    const targetLoss = currentPoint + currentPoint * LOSS_PERCENT;

    const totalPrice = contractResult.tot_ccld_amt;
    const commaTotalPrice = convertComma(totalPrice);

    //텔레그램 알람
    await sendTelegramMsg(`
🔽매도 포지션 진입
진입 주문번호:${contractResult.odno}

진입 계약수량:${contractResult.tot_ccld_qty}
진입 평균체결:${contractResult.avg_idx}
진입 총체결금액:${commaTotalPrice}
    
🐋익절목표:${targetProfit}
🐋손절목표:${targetLoss}
`);

    //포지션 객체 생성 및 배열에 객체 넣기
    const newPosition = {
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
    sellEntryCandleTime = currentCandleTime;
  }

  //매수 포지션 조건에 맞는 객체 찾기 (조건:익절금액이 현재가 보다 크거나,손절금액이 현재가보다 작음)
  const buyPositionObj = buyPositionAry.find(
    (obj) => currentPoint > obj.targetProfit || currentPoint < obj.targetLoss
  );

  //매도 포지션 조건에 맞는 객체 찾기 (조건:익절금액이 현재가 보다 작거나,손절금액이 현재가보다 큼)
  const sellPositionObj = sellPositionAry.find(
    (obj) => currentPoint < obj.targetProfit || currentPoint > obj.targetLoss
  );

  //매수 포지션 청산 로직
  if (buyPositionObj) {
    if (trailingStop) {
      if (!trailingBuyPositionAry.includes(currentPoint)) {
        trailingBuyPositionAry.push(currentPoint);
        maxValueTrailBuyPositionAry = Math.max(...trailingBuyPositionAry);
      }
    } else {
      await buyLiquidation(
        token,
        ACCOUNT,
        ACCOUNT_TYPE,
        TICKER,
        buyPositionObj,
        candleValue[0].stck_bsop_date
      );
      //포지션 배열에서 해당값 삭제
      const foundIndex = buyPositionAry.indexOf(buyPositionObj);
      buyPositionAry.splice(foundIndex, 1);
    }
  }

  //매도 포지션 청산 로직
  if (sellPositionObj) {
    if (trailingStop) {
    } else {
      await sellLiquidation(
        token,
        ACCOUNT,
        ACCOUNT_TYPE,
        TICKER,
        sellPositionObj,
        candleValue[0].stck_bsop_date
      );
    }

    //포지션 배열에서 해당값 삭제
    const foundIndex = sellPositionAry.indexOf(sellPositionObj);
    sellPositionAry.splice(foundIndex, 1);
  }

  //익절/손절 구간이 아니지만 장 종료전 청산 잔량이 남았을 때 청산 로직
  if (nowKoreaHour > FORCED_LIQUIDATE_START_TIME) {
    await sendTelegramMsg("청산시간입니당10초");
    buyEntryCandleTime = null;
    sellEntryCandleTime = null;

    if (buyPositionAry.length > 0) {
      //매수 포지션 강제 청산
      buyPositionAry.map(async (obj) => {
        await marketOrder(
          token,
          ACCOUNT,
          ACCOUNT_TYPE,
          "01", //01:매도, 02:매수
          TICKER,
          obj.orderQty //오더수량
        );
      });
      buyPositionAry = [];
    }

    if (sellPositionAry.length > 0) {
      //매도 포지션 강제 청산
      sellPositionAry.map(async (obj) => {
        await marketOrder(
          token,
          ACCOUNT,
          ACCOUNT_TYPE,
          "02", //01:매도, 02:매수
          TICKER,
          obj.orderQty //오더수량
        );
      });
      sellPositionAry = [];
    }
  }

  console.log(
    rsiData,
    "/ 현재가:",
    currentPoint,
    "/ 매수 포지션:",
    buyPositionAry.length,
    "/ 매도 포지션",
    sellPositionAry.length
  );
}
