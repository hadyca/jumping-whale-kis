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

//내 보유 포지션
let BuyPositionAry = [];
let SellPositionAry = [];

export default async function autoTrading(token) {
  const SET_ROW_RSI = 30;
  const SET_HIGH_RSI = 70;
  const TICKER = "105V03"; //미니 코스피200
  const INTERVAL = {
    "5m": 60 * 5,
  };

  const ACCOUNT = "46500144";
  const ACCOUNT_TYPE = "03";

  //수익 퍼센티지 설정
  const PROFIT_PERCENT = 0.001; //0.1%
  const LOSS_PERCENT = 0.001; //0.1%

  const POSITION_FIRST_ENTRY_TIME = "08:45:00";
  const POSITION_LAST_ENTRY_TIME = "15:20:00";
  const FORCED_LIQUIDATE_TIME = "15:30:00";

  //최종 거래일 기준 (최종거래일에는 아래 시간으로 세팅)
  const LASTDAY_POSITION_LAST_ENTRY_TIME = "14:50:00";
  const LASTDAY_FORCED_LIQUIDATE_TIME = "15:00:00";

  // 자동봇 거래시간
  const nowKoreaHour = getKoreaHour();

  //to-be최종거래일일 때 자동거래시간 세팅필요

  //첫번째 캔들값 (102개 조회)
  const candleValue = await getCandle(token, TICKER, INTERVAL["5m"]);

  // if (
  //   nowKoreaHour < POSITION_FIRST_ENTRY_TIME ||
  //   nowKoreaHour > FORCED_LIQUIDATE_TIME ||
  //   candleValue[0].stck_cntg_hour === "084500"
  // ) {
  //   console.log("자동 봇 매매 시간이 아닙니다.");
  //   return;
  // }
  const currentPrice = parseFloat(candleValue[0].futs_prpr);
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

  //같은 시간 대 중복 매매 되지 않도록 세팅
  const currentCandleTime = candleValue[0].stck_cntg_hour;
  const haveTimeBuyPosition = BuyPositionAry.some(
    (obj) => obj.contractCandleTime === currentCandleTime
  );
  const haveTimeSellPosition = SellPositionAry.some(
    (obj) => obj.contractCandleTime === currentCandleTime
  );

  // const contractResult = await getContractDetail(
  //   token,
  //   ACCOUNT,
  //   ACCOUNT_TYPE,
  //   candleValue[0].stck_bsop_date,
  //   "0000007453"
  // );
  // console.log(contractResult);

  //시장가 매수 포지션 진입
  if (
    rsiData.beforeRsi < SET_ROW_RSI &&
    rsiData.nowRsi > SET_ROW_RSI &&
    nowKoreaHour < POSITION_LAST_ENTRY_TIME &&
    !haveTimeBuyPosition
  ) {
    const marketBuyResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "02", //01:매도, 02:매수
      TICKER,
      "1" //오더수량
    );
    console.log(marketBuyResult);

    //매수 포지션 진입한 거래 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      candleValue[0].stck_bsop_date, //매매 당시 날짜
      marketBuyResult.ODNO //매매 주문 번호
    );

    //익절,손절 목표가 (포인트임)
    const targetProfit = currentPrice + currentPrice * PROFIT_PERCENT;
    const targetLoss = currentPrice - currentPrice * LOSS_PERCENT;

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
      contractCandleTime: candleValue[0].stck_cntg_hour, //매매 시간 구간
      unit: contractResult.tot_ccld_qty,
      point: contractResult.avg_idx,
      totalPrice: contractResult.tot_ccld_amt,
      targetProfit,
      targetLoss,
    };
    BuyPositionAry.push(newPosition);
  }

  //시장가 매도 포지션 진입
  if (
    rsiData.beforeRsi > SET_HIGH_RSI &&
    rsiData.nowRsi < SET_HIGH_RSI &&
    nowKoreaHour < POSITION_LAST_ENTRY_TIME &&
    !haveTimeSellPosition
  ) {
    const marketSellResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "01", //01:매도, 02:매수
      TICKER,
      "1" //오더수량
    );
    console.log(marketSellResult);

    //매도 포지션 진입한 거래 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      candleValue[0].stck_bsop_date, //매매 당시 날짜
      marketSellResult.ODNO //매매 주문 번호
    );

    //익절, 손절 목표가
    const targetProfit = currentPrice - currentPrice * PROFIT_PERCENT;
    const targetLoss = currentPrice + currentPrice * LOSS_PERCENT;

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
      contractCandleTime: candleValue[0].stck_cntg_hour, //매매 시간 구간
      unit: contractResult.tot_ccld_qty,
      point: contractResult.avg_idx,
      totalPrice: contractResult.tot_ccld_amt,
      targetProfit,
      targetLoss,
    };
    SellPositionAry.push(newPosition);
  }

  //매수 포지션 조건에 맞는 객체 찾기 (조건:익절금액이 현재가 보다 크거나,손절금액이 현재가보다 작음)
  const buyPositionObj = BuyPositionAry.find(
    (obj) =>
      obj["targetProfit"] > currentPrice || obj["targetLoss"] < currentPrice
  );

  //매도 포지션 조건에 맞는 객체 찾기 (조건:익절금액이 현재가 보다 작거나,손절금액이 현재가보다 큼)
  const sellPositionObj = SellPositionAry.find(
    (obj) =>
      obj["targetProfit"] < currentPrice || obj["targetLoss"] > currentPrice
  );

  //매수 포지션 청산 로직
  if (buyPositionObj) {
    //시장가 매도로 청산
    const marketSellResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "01", //01:매도, 02:매수
      TICKER,
      buyPositionObj.unit //오더수량
    );
    console.log(marketSellResult);

    //청산 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      candleValue[0].stck_bsop_date, //매매 당시 날짜
      marketSellResult.ODNO //매매 주문 번호
    );

    const totalPrice = contractResult.tot_ccld_amt;
    const commaTotalPrice = convertComma(totalPrice);

    const gapPrice = contractResult.tot_ccld_amt - buyPositionObj.totalPrice;
    const commaGapPrice = convertComma(gapPrice);

    await sendTelegramMsg(`
🔥매수 포지션 청산
진입 주문번호:${buyPositionObj.id}
청산 주문번호:${contractResult.odno}

청산 계약수량:${contractResult.tot_ccld_qty}
청산 평균체결:${contractResult.avg_idx}
청산 총체결금액:${commaTotalPrice}

🐋손익가:${commaGapPrice}
`);

    //포지션 배열에서 해당값 삭제
    const foundIndex = BuyPositionAry.indexOf(buyPositionObj);
    BuyPositionAry.splice(foundIndex, 1);
  }

  //매도 포지션 청산 로직
  if (sellPositionObj) {
    //시장가 매수로 청산
    const marketBuyResult = await marketOrder(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      "02", //01:매도, 02:매수
      TICKER,
      sellPositionObj.unit //오더수량
    );
    console.log(marketBuyResult);

    //청산 내역 조회
    const contractResult = await getContractDetail(
      token,
      ACCOUNT,
      ACCOUNT_TYPE,
      candleValue[0].stck_bsop_date, //매매 당시 날짜
      marketSellResult.ODNO //매매 주문 번호
    );

    const totalPrice = contractResult.tot_ccld_amt;
    const commaTotalPrice = convertComma(totalPrice);

    const gapPrice = sellPositionObj.totalPrice - contractResult.tot_ccld_amt;
    const commaGapPrice = convertComma(gapPrice);

    await sendTelegramMsg(`
🔥매도 포지션 청산
진입 주문번호:${sellPositionObj.id}
청산 주문번호:${contractResult.odno}

청산 계약수량:${contractResult.tot_ccld_qty}
청산 평균체결:${contractResult.avg_idx}
청산 총체결금액:${commaTotalPrice}

🐋손익가:${commaGapPrice}
`);

    //포지션 배열에서 해당값 삭제
    const foundIndex = sellPositionObj.indexOf(sellPositionObj);
    sellPositionObj.splice(foundIndex, 1);
  }

  //to-be:익절/손절 구간이 아니지만 장 종료전 청산 잔량이 남았을 때 청산 로직
  //(현재시간이 설정한 강제청산시간과 같을 때, 포지션 배열에 값이 남아있다면 청산 진행)
  //마지막 시간에 포지션 배열에 아무 값도 남아 있으면 안됨

  console.log(
    rsiData,
    "/ 현재가:",
    currentPrice,
    "/ 매수 포지션:",
    BuyPositionAry,
    "/ 매도 포지션",
    SellPositionAry
  );
}
