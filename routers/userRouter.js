import { Router } from "express"
import * as userMiddleware from "../middlewares/userMiddleware.js"
import * as userController from "../controllers/userController.js"

const userRouter = Router()

/** GET http://localhost:8080/api/user/:username */
userRouter.get(
  "/:username",
  userMiddleware.checkExistToken,
  userController.getUserData,
)
/** PUT http://localhost:8080/api/user/update/:username */
userRouter.put(
  "/update/:username",
  userMiddleware.checkExistToken,
  userMiddleware.checkDataUpdate,
  userController.updateUserData,
)

/** PUT http://localhost:8080/api/user/changePassword/:username */
userRouter.put(
  "/changePassword/:username",
  userMiddleware.checkExistToken,
  userMiddleware.checkChangePassword,
  userController.changePassword,
)

/** PUT http://localhost:8080/api/user/getTotalPoint/:username */
userRouter.get("/getTotalPoint/:username", userController.getTotalPoint)

export default userRouter
