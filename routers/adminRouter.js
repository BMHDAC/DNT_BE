import { Router } from "express"
import * as adminMiddleware from "../middlewares/adminMiddleware.js"
import * as adminController from "../controllers/adminController.js"

const adminRouter = Router()

/** GET http://localhost:8080/api/admin/getAllUser */
adminRouter.get(
  "/getAllUser",
  adminMiddleware.checkAdmin,
  adminController.getAllUser,
)

/** DELETE http://localhost:8080/api/admin/deleteUser/:username */
adminRouter.delete(
  "/deleteUser/:username",
  adminMiddleware.checkAdmin,
  adminController.deleteUser,
)

/** GET http://localhost:8080/api/admin/getHelpRequestByUser/:username */
adminRouter.get(
  "/getHelpRequestByUser/:username",
  adminMiddleware.checkAdmin,
  adminController.getHelpRequestByUser,
)

/** GET http://localhost:8080/api/admin/getAllHelpRequest */
adminRouter.get(
  "/getAllHelpRequest",
  adminMiddleware.checkAdmin,
  adminController.getAllHelpRequest,
)

/** GET http://localhost:8080/api/admin/getAllOrganization */
adminRouter.get(
  "/getAllOrganization",
  adminMiddleware.checkAdmin,
  adminController.getAllOrganization,
)

/** GET http://localhost:8080/api/admin/getPostInOrganization/:organizationId */
adminRouter.get(
  "/getPostInOrganization/:organizationId",
  adminMiddleware.checkAdmin,
  adminController.getPostInOrganization,
)

/** DELETE http://localhost:8080/api/admin/deletePostInOrganization/:postId */
adminRouter.delete(
  "/deletePostInOrganization/:postId",
  adminMiddleware.checkAdmin,
  adminController.deletePostInOrganization,
)

export default adminRouter
