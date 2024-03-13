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

//내 포지션, 자동 매매 봇 정지하면 초기화 됨
let BuyPositionAry = [];
let SellPositionAry = [];

export default async function autoTrading(token) {
  const POSITION_FIRST_ENTRY_TIME = "08:45:00";
  const POSITION_LAST_ENTRY_TIME = "15:20:00";
  const FORCED_LIQUIDATE_TIME = "15:30:00";

  //최종 거래일 기준 (최종거래일에는 아래 시간으로 세팅)
  const LASTDAY_POSITION_LAST_ENTRY_TIME = "14:50:00";
  const LASTDAY_FORCED_LIQUIDATE_TIME = "15:00:00";

  // 자동봇 거래시간
  const nowKoreaHour = getKoreaHour();

  if (
    nowKoreaHour < POSITION_FIRST_ENTRY_TIME ||
    nowKoreaHour > FORCED_LIQUIDATE_TIME
  ) {
    console.log("자동 봇 매매 시간이 아닙니다.");
    return;
  }

  //to-be최종거래일일 때 자동거래시간 세팅필요

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

  //주문 가능수량 조회
  // const qty = await getAvailableQty(
  //   token,
  //   ACCOUNT,
  //   ACCOUNT_TYPE,
  //   TICKER,
  //   "02"
  // );
  // console.log(qty);

  //수익 퍼센티지 설정
  const PROFIT_PERCENT = 0.001; //0.1%
  const LOSS_PERCENT = 0.001;

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

    //익절,손절 목표가
    const profitPrice =
      candleValue[0].futs_prpr + candleValue[0].futs_prpr * PROFIT_PERCENT;
    const lossPrice =
      candleValue[0].futs_prpr - candleValue[0].futs_prpr * LOSS_PERCENT;

    //텔레그램 알람
    await sendTelegramMsg(`
🔼매수 포지션 진입
계약수량:${contractResult.tot_ccld_qty}
평균체결가:${contractResult.avg_idx}
익절목표가:${profitPrice}
손절목표가:${lossPrice}
    `);

    //포지션 객체 생성 및 배열에 객체 넣기
    const newPosition = {
      id: marketBuyResult.ODNO, //주문 번호
      side: "buy",
      contractCandleTime: candleValue[0].stck_cntg_hour, //매매 시간 구간
      unit: contractResult.tot_ccld_qty,
      price: contractResult.avg_idx,
      totalPrice: contractResult.tot_ccld_amt,
      profitPrice,
      lossPrice,
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
    const profitPrice =
      candleValue[0].futs_prpr - candleValue[0].futs_prpr * PROFIT_PERCENT;
    const lossPrice =
      candleValue[0].futs_prpr + candleValue[0].futs_prpr * LOSS_PERCENT;

    //텔레그램 알람
    await sendTelegramMsg(`
🔽매도 포지션 진입
계약수량:${contractResult.tot_ccld_qty}
평균체결가:${contractResult.avg_idx}
익절목표가:${profitPrice}
손절목표가:${lossPrice}
`);

    //포지션 객체 생성 및 배열에 객체 넣기
    const newPosition = {
      id: marketSellResult.ODNO, //주문 번호
      side: "sell",
      contractCandleTime: candleValue[0].stck_cntg_hour, //매매 시간 구간
      unit: contractResult.tot_ccld_qty,
      price: contractResult.avg_idx,
      totalPrice: contractResult.tot_ccld_amt,
      profitPrice,
      lossPrice,
    };
    SellPositionAry.push(newPosition);
  }

  //to-be:익절/손절 구간 시 청산 로직  (find함수 써야할듯?)
  // if(매수 포지션에 익절금액이 현재가 보다 크거나,손절금액이 현재가보다 작으면){
  //   시장가 매도 처리 후 매수 포지션 배열에서 해당 객체 삭제
  // }
  // if(매도 포지션에 익절금액이 현재가 보다 작거나,손절금액이 현재가보다 크면){
  //   시장가 매수 처리 후 매도 포지션 배열에서 해당 객체 삭제
  // }

  //to-be:익절/손절 구간이 아니지만 장 종료전 청산 잔량이 남았을 때 청산 로직(현재시간이 설정한 강제청산시간과 같을 때, 포지션 배열에 값이 남아있다면 청산 진행)
  console.log(
    rsiData,
    "/ 현재가:",
    candleValue[0].futs_prpr,
    "/ 매수 포지션:",
    BuyPositionAry,
    "/ 매도 포지션",
    SellPositionAry
  );
}
