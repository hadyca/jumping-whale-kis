export default function getKoreaTime() {
  const utcOffset = 9; // 한국 표준시(KST)의 UTC 시차는 +9시간
  const now = new Date();
  const date = new Date(now.getTime() + utcOffset * 60 * 60 * 1000);
  const formattedDate = date.toISOString().replace("T", " ").split(".")[0];
  return formattedDate;
}
