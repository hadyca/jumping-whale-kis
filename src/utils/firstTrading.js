export default async function firstTrading({
  setRowRsi,
  setHighRsi,
  beforeRsi,
  nowRsi,
}) {
  console.log(
    `🚀 트레이딩 감시 중...직전 RSI:${beforeRsi}, 현재 RSI:${nowRsi}`
  );
  if (beforeRsi < setRowRsi && nowRsi > setRowRsi) {
    //시장가 매수
    return; //리턴 값은 매수 id
  }
  if (beforeRsi > setHighRsi && nowRsi < setHighRsi) {
    //시장가 매도
    return; //리턴 값은 매도 id
  }
}
