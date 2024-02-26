require("dotenv").config();
import fetch from "node-fetch";
import getCandle from "./api/candle";

export default async function start() {
  const candle = await getCandle();
  return candle;
}
