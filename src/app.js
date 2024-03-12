import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import supabase from "./supabaseClient";
import { startTrading, stopTrading } from "./startTrading";
const app = express();

app.get("/", async (req, res) => {
  //초기시작 supabase db에서 토큰값 및 토큰만료시간 조회
  const { data: userData, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", 1)
    .single();
  const token = userData?.token;
  const tokenExpirationTime = userData?.tokenExpirationTime;

  if (error) {
    console.log("userData조회에러", error);
  }
  console.log("🚀 트레이딩 시작");
  await startTrading(token, tokenExpirationTime);
  res.send("시작");
});

app.get("/stop", async (req, res) => {
  console.log("⛔ 트레이딩 정지");
  stopTrading();
  res.send("자동매매정지");
});

// app.get("/profile", handleProfile);

// app.use("/user", userRouter);

export default app;
