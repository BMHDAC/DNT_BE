import { Router } from "express"
import * as authController from "../controllers/authController.js"
import * as authMiddleware from "../middlewares/authMiddleware.js"

const authRouter = Router()

/** POST http://localhost:8080/api/auth/register */
authRouter.post(
  "/register",
  authMiddleware.checkRegister,
  authController.register,
)

/** POST http://localhost:8080/api/auth/verifyOTP */
authRouter.post(
  "/verifyOTP",
  authMiddleware.checkRegister,
  authMiddleware.checkVerifyOTP,
  authController.verifyOTP,
)

/** POST http://localhost:8080/api/auth/siggin */
authRouter.post("/signin", authMiddleware.checkSignIn, authController.signIn)

export default authRouter
