import sendTelegramMsg from "./telegramMsg";

let errorCount = 0;

export default async function getUserToken() {
  try {
    const { data } = await supabase
      .from("user")
      .select("*")
      .eq("id", 1)
      .single();
    return data;
  } catch (error) {
    errorCount++;
    console.log("userToken에러", error);
    // 에러 카운터가 10에 도달하면 함수 종료
    if (errorCount >= 10) {
      await sendTelegramMsg("supabase user토큰 조회 에러 10회 발생, 코드 중지");
      throw new Error(
        "에러가 10번 발생하여 getUserToken 함수 호출을 중지합니다."
      );
    }
    return getUserToken();
  }
}
