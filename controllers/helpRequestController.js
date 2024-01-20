import admin from "../firebase/connect.js"
import jwt from "jsonwebtoken"
import {
  getAllHelpRequestService,
  getHelpRequestByUserService,
} from "../firebase/helpRequestService.js"
import { v4 } from "uuid"
import { CHUA_HOAN_THANH } from "../utils/constraint.js"

export const createHelpRequest = async (req, res) => {
  const { title, description } = req.body
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ msg: "Lỗi xảy ra khi xác minh token", code: 2 })
  }
  const files = req.files
  const imageUrls = []

  // Upload các ảnh lên Firebase Storage và lấy URL
  for (const file of files) {
    const fileRef = admin
      .storage()
      .bucket()
      .file(`helpRequest/${username}/${file.originalname}`)
    await fileRef.save(file.buffer)
    const url = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    })
    imageUrls.push(url[0])
  }
  try {
    /** Lấy thông tin người đăng */
    const dataUser = (
      await admin.database().ref(`users/${username}`).once("value")
    ).val()
    /** Sau khi lấy được imageUrls và thông tin người dùng thì lưu thông tin yêu cầu hỗ trợ */
    const helpRequestRef = admin.database().ref("helpRequests").push()
    const data = {
      id: helpRequestRef.key,
      title,
      description,
      images: imageUrls,
      createdBy: username,
      displayName: dataUser?.displayName ? dataUser?.displayName : null,
      urlAvatar: dataUser?.urlAvatar ? dataUser?.urlAvatar : null,
      createAt: new Date().toISOString(),
      status: 0,
    }
    await helpRequestRef.set(data)
    return res.status(200).json({
      msg: "Tạo yêu cầu hỗ trợ thành công",
      code: 0,
      data: data,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ msg: "Xảy ra lỗi khi tạo yêu cầu", code: 3 })
  }
}

export const getAllHelpRequest = async (req, res) => {
  try {
    const data = await getAllHelpRequestService()
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", data, code: 0 })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy các yêu cầu hỗ trợ", code: 2 })
  }
}

export const getHelpRequestByUser = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    console.log("Lỗi khi xác minh token")
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 3 })
  }
  try {
    const data = await getHelpRequestByUserService(username)
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", code: 0, data })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy các yêu cầu hỗ trợ của người dùng", code: 2 })
  }
}

export const sendRequestToOrganization = async (req, res) => {
  const { organizationId, helpRequestId } = req.body
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    console.log("Lỗi khi xác minh token")
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy thông tin organization, kiểm tra quyền nhận yêu cầu */
  const organizationData = (
    await admin.database().ref(`organizations/${organizationId}`).once("value")
  ).val()
  if (organizationData.creator !== username)
    return res.status(403).json({ msg: "Không có quyền thực hiện", code: 3 })
  /** Kiểm tra xem tổ chức này đã nhận helpRequest này hay chưa */
  const helpRequestOrganizationData = (
    await admin
      .database()
      .ref(`helpRequestOrganization/${helpRequestId}/${organizationId}`)
      .once("value")
  ).val()
  if (helpRequestOrganizationData) {
    return res
      .status(403)
      .json({ msg: "Tổ chức của bạn đã nhận hỗ trợ này rồi", code: 4 })
  }
  /** Tổ chức có thể nhận helpRequest này */
  try {
    const helpRequestReceiveData = (
      await admin
        .database()
        .ref(`helpRequestOrganization/${helpRequestId}`)
        .once("value")
    ).val()
    /** Lưu thông tin tổ chức đã nhận helpRequest vào db helpRequestOrganization */
    await admin
      .database()
      .ref(`helpRequestOrganization/${helpRequestId}`)
      .set({
        ...helpRequestReceiveData,
        [organizationId]: true,
      })
    /** Lưu thông tin helpRequest vào db helpRequestReceived */
    /** Lấy thông tin của helpRequest */
    const helpRequestData = (
      await admin.database().ref(`helpRequests/${helpRequestId}`).once("value")
    ).val()
    await admin
      .database()
      .ref(`helpRequestReceived/${helpRequestId + organizationId}`)
      .set({
        ...helpRequestData,
        organizationId: organizationId,
        receivedDate: Date.now().toString(),
        status: CHUA_HOAN_THANH,
      })
    return res
      .status(200)
      .json({ msg: "Nhận yêu cầu hỗ trợ thành công", code: 0 })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ msg: "Có lỗi xảy ra", code: 5 })
  }
}

export const getHelpRequestReceivedByOrganization = async (req, res) => {
  const { organizationId } = req.params
  const dataRes = (
    await admin
      .database()
      .ref(`helpRequestOrganization`)
      .orderByChild(organizationId)
      .equalTo(true)
      .once("value")
  ).val()
  let listIdHelpRequest = []
  let listHelpRequest = []
  if (dataRes) {
    listIdHelpRequest = Object.keys(dataRes)
    for (let i = 0; i < listIdHelpRequest.length; i++) {
      const dataHelpRequest = (
        await admin
          .database()
          .ref(`helpRequests/${listIdHelpRequest[i]}`)
          .once("value")
      ).val()
      listHelpRequest.push(dataHelpRequest)
    }
  }
  return res.status(200).json({
    msg: "Lấy các yêu cầu hỗ trợ thành công",
    code: 0,
    listHelpRequest,
    total: listHelpRequest.length,
  })
}

export const getOrganizationByHelpRequest = async (req, res, next) => {
  const { helpRequestId } = req.params
  try {
    const dataRes = (
      await admin
        .database()
        .ref(`helpRequestOrganization/${helpRequestId}`)
        .once("value")
    ).val()
    let data = []
    if (dataRes) {
      data = Object.keys(dataRes)
    }
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", code: 0, data })
  } catch (error) {
    console.log("Lỗi khi lấy các tổ chức nhận yêu cầu hỗ trợ")
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy các tổ chức nhận yêu cầu hỗ trợ", code: 2 })
  }
}
