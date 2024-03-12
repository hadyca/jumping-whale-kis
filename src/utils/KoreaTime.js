export function getKoreaTime() {
  const koreaOffset = 9 * 60 * 60 * 1000; // 한국 표준시(KST)의 UTC 시차는 +9시간 (밀리초 단위)
  const now = new Date();
  const date = new Date(now.getTime() + koreaOffset);
  const formattedDate = date.toISOString().replace("T", " ").split(".")[0];
  return formattedDate;
}

export function getKoreaHour() {
  const koreaOffset = 9 * 60 * 60 * 1000; // 한국 표준시(KST)의 UTC 시차는 +9시간 (밀리초 단위)
  const now = new Date();
  const koreaTime = new Date(now.getTime() + koreaOffset);
  const formattedTime = koreaTime.toISOString().split("T")[1].split(".")[0];
  return formattedTime;
}
