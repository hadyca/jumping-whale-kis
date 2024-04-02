import { autoTrading } from "./utils/autoTrading";

let startTradingTimeout;

export async function startTrading(token, tokenExpirationTime) {
  const userSettingAry = [
    { TICKER: "106V06", USER_ORDER_QTY: "2" }, // 코스닥
    { TICKER: "105V04", USER_ORDER_QTY: "1" }, // 미니 코스피
  ];
  userSettingAry.forEach(async (obj) => {
    await autoTrading(token, false, obj.TICKER, obj.USER_ORDER_QTY);
  });
  startTradingTimeout = setTimeout(
    () => startTrading(token, tokenExpirationTime),
    1000
  );
}
