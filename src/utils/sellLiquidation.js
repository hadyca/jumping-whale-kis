import getAvailableQty from "../api/availableQty";
import getContractDetail from "../api/contractDetail";
import marketOrder from "../api/marketOrder";
import convertComma from "./commas";
import sendTelegramMsg from "./telegramMsg";

export default async function sellLiquidation(
  token,
  ACCOUNT,
  ACCOUNT_TYPE,
  ticker,
  sellPositionObj,
  contractDate
) {
  const availQty = await getAvailableQty(
    token,
    ACCOUNT,
    ACCOUNT_TYPE,
    ticker,
    "02" // 매수
  );
  if (parseInt(sellPositionObj.orderQty) > parseInt(availQty.lqd_psbl_qty1)) {
    console.log(
      "티커:",
      ticker,
      "청산요청수량:",
      sellPositionObj.orderQty,
      "청산가능수량:",
      availQty.lqd_psbl_qty1,
      "매도 청산가능수량이 부족합니다. 주문수량을 확인하세요."
    );
    return;
  }

  //시장가 매수로 청산
  const marketBuyResult = await marketOrder(
    token,
    ACCOUNT,
    ACCOUNT_TYPE,
    "02", //01:매도, 02:매수
    ticker,
    sellPositionObj.orderQty //오더수량
  );

  //청산 내역 조회
  const contractResult = await getContractDetail(
    token,
    ACCOUNT,
    ACCOUNT_TYPE,
    contractDate, //매매 당시 날짜
    marketBuyResult.ODNO //매매 주문 번호
  );

  const totalPrice = contractResult.tot_ccld_amt;
  const commaTotalPrice = convertComma(totalPrice);

  const gapPrice = sellPositionObj.totalPrice - contractResult.tot_ccld_amt;
  const commaGapPrice = convertComma(gapPrice);

  await sendTelegramMsg(`
  🔥매도 포지션 청산
  티커:${ticker}
  진입 주문번호:${sellPositionObj.id}
  청산 주문번호:${contractResult.odno}
  
  청산 계약수량:${contractResult.tot_ccld_qty}
  청산 평균체결:${contractResult.avg_idx}
  청산 총체결금액:${commaTotalPrice}
  
  🐋손익가:${commaGapPrice}
  `);
  return;
}
