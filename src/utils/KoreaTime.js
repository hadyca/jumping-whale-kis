//현재 한국 날짜-시간
export function getKoreaTime() {
  const koreaOffset = 9 * 60 * 60 * 1000; // 한국 표준시(KST)의 UTC 시차는 +9시간 (밀리초 단위)
  const now = new Date();
  const date = new Date(now.getTime() + koreaOffset);
  const formattedDate = date.toISOString().replace("T", " ").split(".")[0];
  return formattedDate;
}

//한국 현재 시간에서 1분 더한거(토큰 발급용)
export function getKoreaTime_plus1m() {
  const koreaOffset = 9 * 60 * 60 * 1000; // 한국 표준시(KST)의 UTC 시차는 +9시간 (밀리초 단위)
  const now = new Date();
  const date = new Date(now.getTime() + 60000 + koreaOffset);
  const formattedDate = date.toISOString().replace("T", " ").split(".")[0];
  return formattedDate;
}

//현재 한국 시간
export function getKoreaHour() {
  const koreaOffset = 9 * 60 * 60 * 1000; // 한국 표준시(KST)의 UTC 시차는 +9시간 (밀리초 단위)
  const now = new Date();
  const koreaTime = new Date(now.getTime() + koreaOffset);
  const formattedTime = koreaTime.toISOString().split("T")[1].split(".")[0];
  return formattedTime;
}
