import getContractDetail from "../api/contractDetail";
import marketOrder from "../api/marketOrder";
import convertComma from "./commas";
import sendTelegramMsg from "./telegramMsg";

export default async function buyLiquidation(
  token,
  ACCOUNT,
  ACCOUNT_TYPE,
  TICKER,
  buyPositionObj,
  contractDate
) {
  //시장가 매도로 청산
  const marketSellResult = await marketOrder(
    token,
    ACCOUNT,
    ACCOUNT_TYPE,
    "01", //01:매도, 02:매수
    TICKER,
    buyPositionObj.orderQty //오더수량
  );

  //청산 내역 조회
  const contractResult = await getContractDetail(
    token,
    ACCOUNT,
    ACCOUNT_TYPE,
    contractDate, //매매 당시 날짜
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
  return;
}
