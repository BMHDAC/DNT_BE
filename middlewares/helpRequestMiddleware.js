import { fileTypeFromBuffer } from "file-type"
import admin from "../firebase/connect.js"

export const checkExistToken = (req, res, next) => {
  const authHeader = req.header("Authorization")
  if (!authHeader) {
    return res
      .status(400)
      .json({ msg: "Chưa cung cấp Authorization Bearer Token", code: 1 })
  }
  if (authHeader) {
    const token = authHeader?.split(" ")[1]
    if (!token)
      return res.status(400).json({ msg: "Chưa cung cấp Token", code: 1 })
  }
  next()
}

export const checkFileTypes = async (req, res, next) => {
  try {
    const files = req.files
    if (files?.length === 0) {
      next()
    } else {
      for (const file of files) {
        // Use fromBuffer from the file-type module to check the file type from the buffer
        const type = await fileTypeFromBuffer(file.buffer)

        // Check if the file type is not an image
        if (!type || !type.mime.startsWith("image/")) {
          return res
            .status(400)
            .json({ msg: "Chỉ chấp nhận file ảnh", code: 1 })
        }
      }
      // If all files are images, continue processing the request
      next()
    }
  } catch (error) {
    return res.status(500).json({ msg: "Xảy ra lỗi", code: 1 })
  }
}

export const checkCreateHelpRequest = (req, res, next) => {
  const { title, description } = req.body
  if (!title || !description)
    return res.status(400).json({
      msg: "Vui lòng cung cấp đủ tiêu đề và mô tả cho yêu cầu hỗ trợ",
      code: 1,
    })
  next()
}

export const checkExistHelpRequest = async (req, res, next) => {
  const { helpRequestId } = req.body
  const helpRequestRef = admin.database().ref("helpRequests")
  const helpRequestDataRef = helpRequestRef.child(`${helpRequestId}`)
  const snapshot = await helpRequestDataRef.once("value")
  if (!snapshot.exists()) {
    return res
      .status(404)
      .json({ msg: "Yêu cầu hỗ trợ không tồn tại", code: 1 })
  }
  next()
}

export const checkExistHelpRequestParams = async (req, res, next) => {
  const { helpRequestId } = req.params
  const helpRequestRef = admin.database().ref("helpRequests")
  const helpRequestDataRef = helpRequestRef.child(`${helpRequestId}`)
  const snapshot = await helpRequestDataRef.once("value")
  if (!snapshot.exists()) {
    return res
      .status(404)
      .json({ msg: "Yêu cầu hỗ trợ không tồn tại", code: 1 })
  }
  next()
}

export const checkExistOrganization = async (req, res, next) => {
  const { organizationId } = req.body
  const organizationsRef = admin.database().ref("organizations")
  const organizationDataRef = organizationsRef.child(`${organizationId}`)
  const snapshot = await organizationDataRef.once("value")
  if (!snapshot.exists()) {
    return res.status(404).json({ msg: "Tổ chức không tồn tại", code: 1 })
  }
  next()
}

export const checkExistOrganizationParams = async (req, res, next) => {
  const { organizationId } = req.params
  const organizationsRef = admin.database().ref("organizations")
  const organizationDataRef = organizationsRef.child(`${organizationId}`)
  const snapshot = await organizationDataRef.once("value")
  if (!snapshot.exists()) {
    return res.status(404).json({ msg: "Tổ chức không tồn tại", code: 1 })
  }
  next()
}

