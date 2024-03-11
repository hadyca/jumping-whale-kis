import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import start from "./start";
import stop from "./stop";
import supabase from "./supabaseClient";
const app = express();

app.get("/", async (req, res) => {
  const result = await start();
  res.send(result);
});

app.get("/stop", async (req, res) => {
  stop();
  res.send("멈춰~");
});

// app.get("/profile", handleProfile);

// app.use("/user", userRouter);

export default app;
