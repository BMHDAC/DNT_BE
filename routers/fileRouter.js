import { Router } from "express"
import multer from "multer"
import * as fileController from "../controllers/fileController.js"
import * as fileMiddleware from "../middlewares/fileMiddleware.js"

const fileRouter = Router()
// Cấu hình Multer để xử lý tải lên tệp
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

/** POST http://localhost:8080/api/file/uploadAvatar */
fileRouter.post(
  "/uploadAvatar",
  upload.single("file"),
  fileMiddleware.checkUploadAvatar,
  fileController.uploadFile,
)

export default fileRouter
