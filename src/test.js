export default async function test(num) {
  let BuyPositionAry = [{ targetProfit: "10", targetLoss: "5" }];

  const currentPrice = 4;

  const buyPositionObj = BuyPositionAry.find(
    (obj) => obj.targetProfit < currentPrice || obj.targetLoss > currentPrice
  );
  console.log(buyPositionObj);
}
