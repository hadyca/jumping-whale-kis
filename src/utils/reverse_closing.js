export default function getClosingPrice(candleData) {
  //가장 최근값을 배열 맨 앞으로 둠
  const reveredResult = candleData.reverse();

  //가장 최근값을 맨 뒤로 둠
  const values = reveredResult.slice(0, 200).reverse();

  //종가만 뽑아옴, 최종적 배열은, 종가만 뽑아내서 가장 최근값이 맨 뒤로감
  const closingPriceArr = values.map((v) => parseInt(v[2]));
  return closingPriceArr;
}
