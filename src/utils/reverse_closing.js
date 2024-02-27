export default function getClosingPrice(candleValue) {
  //가장 최근값을 배열 맨 뒤로 둠
  const reveredResult = candleValue.reverse();
  //종가만 뽑아옴, 최종적 배열은, 종가만 뽑아내서 가장 최근값이 맨 뒤로감 [종가, 과거->최신순]
  const closingPriceArr = reveredResult.map((item) => item.futs_prpr);
  return closingPriceArr;
}
