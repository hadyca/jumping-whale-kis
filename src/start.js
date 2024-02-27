require("dotenv").config();
import getCandle from "./api/candle";
import getClosingPrice from "./utils/reverse_closing";
import calculateRsi from "./utils/calculateRsi";
import getOverSeasCandle from "./api/overseasCandle";

export default async function start(req, res, next) {
  //candle값 가져오기
  const candleData = await getOverSeasCandle();

  //102개 종가 배열 [과거->최신순]
  // const closingPriceArr = getClosingPrice(candleData);

  // const rsiData = calculateRsi(closingPriceArr);
  // console.log(rsiData);
  // // 가져온 rsi값으로 매매하기
  // const finalResult = await trading({
  //   coinName: COIN_NAME,
  //   coin_pay: COIN_PAY,
  //   beforeRsi: rsiData.beforeRsi,
  //   nowRsi: rsiData.nowRsi,
  //   setRowRsi: SET_ROW_RSI,
  //   setHighRsi: SET_HIGH_RSI,
  // });

  // if (finalResult === undefined) {
  //   setTimeout(start, 1000);
  // } else {
  //   console.log("🎉 트레이딩 완료!");
  //   next();
  // }
}
