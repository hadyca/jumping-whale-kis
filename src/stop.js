import start from "./start";

export default async function stop() {
  start(true);
  console.log("stop함수실행");
}
