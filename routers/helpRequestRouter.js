import { Router } from "express"
import * as helpRequestMiddleware from "../middlewares/helpRequestMiddleware.js"
import * as helpRequestController from "../controllers/helpRequestController.js"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage() })
const helpRequestRouter = Router()

/** POST http://localhost:8080/api/helpRequest/create */
helpRequestRouter.post(
  "/create",
  upload.array("images"),
  (error, req, res, next) => {
    if (error) {
      return res
        .status(500)
        .json({ msg: "Cần có ảnh cung cấp về hoàn cảnh cần hỗ trợ", code: 1 })
    }
    next()
  },
  helpRequestMiddleware.checkExistToken,
  helpRequestMiddleware.checkFileTypes,
  helpRequestMiddleware.checkCreateHelpRequest,
  helpRequestController.createHelpRequest,
)

/** GET http://localhost:8080/api/helpRequest/getAllHelpRequest */
helpRequestRouter.get(
  "/getAllHelpRequest",
  helpRequestController.getAllHelpRequest,
)

/** GET http://localhost:8080/api/helpRequest/getHelpRequestByUser */
helpRequestRouter.get(
  "/getHelpRequestByUser",
  helpRequestMiddleware.checkExistToken,
  helpRequestController.getHelpRequestByUser,
)

/** POST http://localhost:8080/api/helpRequest/sendRequestToOrganization */
helpRequestRouter.post(
  "/sendRequestToOrganization",
  helpRequestMiddleware.checkExistToken,
  helpRequestMiddleware.checkExistHelpRequest,
  helpRequestMiddleware.checkExistOrganization,
  helpRequestController.sendRequestToOrganization,
)

/** GET http://localhost:8080/api/helpRequest/getHelpRequestReceivedByOrganization/:organizationId */
helpRequestRouter.get(
  "/getHelpRequestReceivedByOrganization/:organizationId",
  helpRequestMiddleware.checkExistOrganizationParams,
  helpRequestController.getHelpRequestReceivedByOrganization,
)

/** GET http://localhost:8080/api/helpRequest/getOrganizationByHelpRequest/:helpRequestId */
helpRequestRouter.get(
  "/getOrganizationByHelpRequest/:helpRequestId",
  helpRequestMiddleware.checkExistHelpRequestParams,
  helpRequestController.getOrganizationByHelpRequest,
)

export default helpRequestRouter
