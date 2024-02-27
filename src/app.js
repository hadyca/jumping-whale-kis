import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import start from "./start";
const app = express();

app.get("/", async (req, res) => {
  const result = await start();
  res.send(result);
});

// app.get("/profile", handleProfile);

// app.use("/user", userRouter);

export default app;
