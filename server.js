import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import router from "./routers/index.js"
import CryptoJS from "crypto-js"

/** Setup app express and read .env */
const app = express()
dotenv.config({ path: ".env.development" })

/** Middlewares */
app.use(express.json())
app.use(cors())
app.use(morgan("tiny")) in app.disable("x-powered-by")

/** Router */
app.use("/api", router)

/** Setup PORT */
const port = process.env.PORT || 8080

console.log(CryptoJS.AES.encrypt("1234567", process.env.KEY_AES).toString())
console.log(CryptoJS.AES.encrypt("123456", process.env.KEY_AES).toString())

/** Start server */
app.listen(port, () => {
  console.log(`>>> Server đang chạy tại http://localhost:${port}`)
})
