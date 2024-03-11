import fetch from "node-fetch";

export default async function sendTelegramMsg(msg) {
  try {
    const body = {
      chat_id: process.env.TELEGRAM_CHAT_ID, //향 후 chat_id는 env가 아닌 db로 연동
      text: msg,
    };
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };
    await fetch(process.env.TELEGRAM_URL, options);
    return;
  } catch (error) {
    console.log("텔레그램 메시지 전송 에러:", error);
  }
}
