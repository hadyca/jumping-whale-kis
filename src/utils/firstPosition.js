import sendTelegramMsg from "./telegramMsg";

export default async function firstPosition({
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
    //시장가 매수 관련 정보 텔레그램 알람 (계약수량, 평균체결가, 총체결가)
    await sendTelegramMsg("매수성공");
    return; //리턴 값은 매수 id
  }
  if (beforeRsi > setHighRsi && nowRsi < setHighRsi) {
    //시장가 매도
    //시장가 매도 관련 정보 텔레그램 알람
    return; //리턴 값은 매도 id
  }
}
