import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import supabase from "./supabaseClient";
import { startTrading, stopTrading } from "./startTrading";
import test from "./test";
import getUserToken from "./utils/userToken";
const app = express();

app.get("/", async (req, res) => {
  //초기시작 supabase db에서 토큰값 및 토큰만료시간 조회
  await stopTrading();

  const userData = await getUserToken();
  console.log("🚀 트레이딩 시작");
  await startTrading(userData.token, userData.tokenExpirationTime);
  res.send("시작");
});

app.get("/stop", async (req, res) => {
  console.log("⛔ 트레이딩 정지");
  await stopTrading();
  res.send("자동매매정지");
});

app.get("/test", async (req, res) => {
  console.log("테스트 함수 실행");
  test();
  res.send("테스트 화면");
});

export default app;
