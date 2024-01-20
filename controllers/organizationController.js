import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import {
  checkRequestOfUser,
  createNewOrganization,
  getOrganization,
  getPostByUserService,
  updateOrganization,
} from "../firebase/organizationService.js"
import admin from "../firebase/connect.js"
import { getOrganizationByUserService } from "../firebase/organizationService.js"
import { CHUA_XU_LY, DONG_Y, TU_CHOI } from "../utils/constraint.js"
import { v4 } from "uuid"

dotenv.config({ path: "../.env.development" })
/** Tạo storage bucket */
const bucket = admin.storage().bucket()

export const createOrganization = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  /** Giải token */
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    /** Tạo nhóm */
    const { name, description, contactinfo } = req.body
    try {
      const organizationInfo = await createNewOrganization(
        {
          name,
          description,
          contactinfo,
          createdAt: new Date().toString(),
          creator: decoded.username,
        },
        decoded.username,
      )
      return res.status(200).json({
        msg: "Tạo tổ chức thành công thành công",
        code: 0,
        data: organizationInfo,
      })
    } catch (error) {
      console.log("Xảy ra lỗi khi tạo tổ chức")
      return res
        .status(500)
        .json({ msg: "Xảy ra lỗi khi tạo tổ chức", code: 3 })
    }
  } catch (error) {
    console.log("Xảy ra lỗi khi phân giải token")
    return res
      .status(500)
      .json({ msg: "Xảy ra lỗi khi phân giải token", code: 2 })
  }
}

export const uploadAvatarOrganization = async (req, res) => {
  const { organizationId } = req.params
  const file = req.file
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  if (!token) {
    return res.status(401).json({ msg: "Chưa cung cấp token", code: 2 })
  }
  try {
    const decoded = jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    console.log("Xảy ra lỗi khi upload")
    return res.status(500).json({ msg: "Xảy ra lỗi upload avatar", code: 3 })
  }

  if (!token || !file) {
    return res
      .status(400)
      .json({ msg: "Thiếu thông tin về token hoặc tệp", code: 4 })
  }
  /** Lấy thông tin tổ chức dựa trên Id sau đó xác định quyền của người dùng */
  try {
    const organizationData = await getOrganization(organizationId)
    if (organizationData.creator !== username) {
      return res.status(403).json({
        msg: "Bạn không có quyền thay đổi thông tin của tổ chức này",
        code: 4,
      })
    }
  } catch (error) {
    console.log("Lỗi khi lấy dữ liệu tổ chức")
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy dữ liệu từ tổ chức", code: 5 })
  }
  /** Đường dẫn trên Firebase Storage */
  const remoteFilePath = `organization/${organizationId}/${file.originalname}`
  console.log("remoteFilePath:", remoteFilePath)
  /** Tải lên tệp vào Firebase Storage */
  const blob = bucket.file(remoteFilePath)
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  })

  blobStream.on("error", (error) => {
    console.error("Lỗi khi tải lên tệp:", error)
    return res.status(500).json({ msg: "Lỗi khi tải lên tệp", code: 6 })
  })

  blobStream.on("finish", () => {
    /** Lấy URL tải xuống */
    blob.getSignedUrl(
      {
        action: "read",
        expires: "01-01-2030",
      },
      async (err, url) => {
        if (err) {
          console.error("Lỗi khi lấy URL tải xuống:", err)
          return res
            .status(500)
            .json({ msg: "Lỗi khi lấy URL tải xuống", code: 7 })
        } else {
          console.log("Tệp đã được tải lên thành công.")
          console.log("URL của tệp đã tải lên:", url)
          /** Sau khi có url của ảnh, lấy url để làm avatar cho tổ chức */
          try {
            /** Update thông tin tổ chức */
            await updateOrganization(organizationId, { urlAvatar: url })
            /** Lấy dữ liệu tổ chức */
            const orgData = await getOrganization(organizationId)
            return res.status(200).json({
              msg: "Tệp đã được tải lên thành công",
              code: 0,
              orgData,
            })
          } catch (error) {
            console.log("Xảy ra lỗi khi cập nhật avatar tổ chức")
            return res.status(500).json({
              msg: "Xảy ra lỗi khi cập nhật avatar tổ chức",
              code: 8,
            })
          }
        }
      },
    )
  })

  blobStream.end(file.buffer)
}

export const getOrganizationByUser = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  try {
    const decoded = jwt.verify(token, process.env.KEY_JWT)
    const username = decoded.username
    try {
      const orangizations = await getOrganizationByUserService(username)
      return res
        .status(200)
        .json({ msg: "Thành công", code: 0, data: orangizations })
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ msg: "Lỗi khi lấy danh sách tổ chức thỏa mãn", code: 2 })
    }
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 1 })
  }
}

export const getAllOrganization = async (req, res) => {
  try {
    const organizationsRef = admin.database().ref("organizations")
    let listOrg = []
    try {
      await organizationsRef.once("value", (snapshot) => {
        if (snapshot.val() !== null) listOrg = Object.values(snapshot.val())
      })
    } catch (error) {
      console.log(error)
      console.log(listOrg)
    }

    return res.status(200).json({ msg: "Thành công", code: 0, data: listOrg })
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy toàn bộ danh sách tổ chức", code: 1 })
  }
}

export const addUserToOrganization = async (req, res) => {
  const { username, organizationId } = req.body
  /** Lấy dữ liệu tổ chức */
  const organizationData = await getOrganization(organizationId)
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  /** Verify token */
  try {
    const decoded = jwt.verify(token, process.env.KEY_JWT)
    /** Kiểm tra quyền thực hiện của người dùng */
    if (decoded.username !== organizationData.creator) {
      return res
        .status(403)
        .json({ msg: "Không có quyền thực hiện thao tác", code: 3 })
    }
    /** Nếu có quyền thực hiện thì tiếp tục kiểm tra xem người dùng đã có sẵn trong nhóm chưa*/
    /** Tham chiếu đến nút memberOrganizations sau đó lấy ra Object chứa các thành viên */
    const memberOrganizationRef = admin.database().ref("memberOrganizations")
    const memberOrganizationsData = memberOrganizationRef.child(
      `${organizationId}`,
    )
    const snapshot = await memberOrganizationsData.once("value")
    const dataMemeberInOrganization = snapshot.val()
    /** Kiểm tra xem người dùng đã có trong tổ chức hay chưa */
    if (dataMemeberInOrganization[username]) {
      return res.status(403).json({
        msg: "Yêu cầu bị từ chối do người dùng đã tồn tại trong tổ chức",
        code: 4,
      })
    }
    /** Nếu người dùng chưa có trong tổ chức thì tiến hành thêm người dùng */
    try {
      await memberOrganizationRef.child(`${organizationId}`).set({
        ...dataMemeberInOrganization,
        [username]: true,
      })
      return res.status(200).json({ msg: "Thành công", code: 0 })
    } catch (error) {
      console.log("Xảy ra lỗi khi thêm người dùng vào tổ chức")
      return res
        .status(500)
        .json({ msg: "Xảy ra lỗi khi thêm người dùng vào tổ chức", code: 5 })
    }
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ msg: "Xảy ra lỗi khi xác minh token", code: 2 })
  }
}

export const requestJoinOrganization = async (req, res) => {
  const { organizationId } = req.body
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    console.log("Xảy ra lỗi khi xác minh token")
    return res
      .status(500)
      .json({ msg: "Xảy ra lỗi khi xác minh token", code: 2 })
  }
  /** Sau khi lấy ra được username thì tiến hành kiểm tra xem người dùng đã có trong tổ chức hay chưa */
  const memberOrganizationRef = admin.database().ref("memberOrganizations")
  const memberOrganizationsData = memberOrganizationRef.child(
    `${organizationId}`,
  )
  const snapshot = await memberOrganizationsData.once("value")
  const dataMemeberInOrganization = snapshot.val()
  /** Kiểm tra xem người dùng đã có trong tổ chức hay chưa */
  if (dataMemeberInOrganization[username]) {
    return res.status(403).json({
      msg: "Yêu cầu bị từ chối do người dùng đã tồn tại trong tổ chức",
      code: 4,
    })
  }
  /** Nếu chưa tham gia thì Kiểm tra xem người dùng đã gửi yêu cầu tham gia trước đó chưa */
  const check = await checkRequestOfUser(username, organizationId)
  if (check) {
    return res
      .status(400)
      .json({ msg: "Bạn đã gửi yêu cầu tham gia tổ chức này rồi", code: 5 })
  }
  /** Tạo ra một requestJoinOrganization */
  const requestJoinOrganizationRef = admin
    .database()
    .ref("requestJoinOrganizations")
  const newRequestRef = requestJoinOrganizationRef.push()
  const newRequestId = newRequestRef.key
  try {
    await newRequestRef.set({
      id: newRequestId,
      username: username,
      organizationId: organizationId,
      status: CHUA_XU_LY,
    })
    return res.status(200).json({
      msg: "Gửi yêu cầu tham gia tổ chức thành công",
      code: 0,
      data: {
        id: newRequestId,
        username,
        organizationId,
        status: CHUA_XU_LY,
      },
    })
  } catch (error) {
    console.log("Xảy ra lỗi khi thêm requestJoinOrganization")
    return res
      .status(500)
      .json({ msg: "Xảy ra lỗi khi thêm requestJoinOrganization", code: 3 })
  }
}

export const getOrganizationByCreator = async (req, res) => {
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
  /** Sau khi lấy ra được user */
  const organizationsRef = admin.database().ref("organizations")
  try {
    const snapshot = await organizationsRef
      .orderByChild("creator")
      .equalTo(username)
      .once("value")
    if (!snapshot.val())
      return res.status(200).json({ msg: "Thành công", data: [], code: 0 })
    const listOrganizationId = Object.keys(snapshot.val())
    let data = []
    for (let i = 0; i < listOrganizationId.length; i++) {
      const _snapshot = await organizationsRef
        .child(`${listOrganizationId[i]}`)
        .once("value")
      data.push(_snapshot.val())
    }
    return res.status(200).json({ msg: "Thành công", data: data, code: 0 })
  } catch (error) {
    console.log("Lỗi khi thực hiện lấy các tổ chức mà người dùng tạo ra")
    return res.status(500).json({
      msg: "Lỗi khi thực hiện lấy các tổ chức mà người dùng tạo ra",
      code: 3,
    })
  }
}

export const handleRequestJoinOrganization = async (req, res) => {
  const { requestJoinOrganizationId, option } = req.body
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  /** Lấy username */
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    console.log("Lỗi khi xác minh token")
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 5 })
  }
  /** Lấy thông tin của requestJoinOrganization */
  const requestJoinOrganizationRef = admin
    .database()
    .ref("requestJoinOrganizations")
  const requestRef = requestJoinOrganizationRef.child(
    `${requestJoinOrganizationId}`,
  )
  const snapshotRequest = await requestRef.once("value")
  if (!snapshotRequest.exists())
    return res.status(404).json({ msg: "Id yêu cầu không tồn tại", code: 2 })
  const requestData = snapshotRequest.val()
  const userWantJoin = requestData.username
  const organizationWantJoin = requestData.organizationId
  /** Kiểm tra xem organizationWantJoin có tồn tại hay không */
  const organizationRef = admin.database().ref("organizations")
  const snapshotOrganization = await organizationRef
    .child(`${organizationWantJoin}`)
    .once("value")
  if (!snapshotOrganization.exists())
    return res.status(404).json({ msg: "Id tổ chức không tồn tại", code: 3 })
  /** Kiểm tra xem userWantJoin có tồn tại hay không */
  const userRef = admin.database().ref("users")
  const snapshotUser = await userRef.child(`${userWantJoin}`).once("value")
  if (!snapshotUser.exists())
    return res
      .status(404)
      .json({ msg: "Người dùng yêu cầu không tồn tại", code: 4 })
  /** Kiểm tra quyền thực hiện của người dùng */
  if (username !== snapshotOrganization.val().creator)
    return res.json({
      msg: "Không có quyền thực hiện xử lý yêu cầu đăng ký",
      code: 6,
    })
  if (option === TU_CHOI) {
    admin
      .database()
      .ref(`requestJoinOrganizations/${requestJoinOrganizationId}`)
      .remove()
      .then(() => {
        console.log("Đã từ chối yêu cầu tham gia tổ chức")
        res
          .status(200)
          .json({ msg: "Đã từ chối yêu cầu tham gia tổ chức", code: 0 })
      })
      .catch(() => {
        console.log("Lỗi khi từ chối yêu cầu")
        res.status(500).json({ msg: "Lỗi khi từ chối yêu cầu", code: 7 })
      })
    return
  }
  if (option === DONG_Y) {
    /** Lấy ra thông tin thành viên hiện tại của tổ chức */
    const snapshotMemberOrganization = await admin
      .database()
      .ref("memberOrganizations")
      .child(`${organizationWantJoin}`)
      .once("value")
    const dataSnapshotMemberOrganization = snapshotMemberOrganization.val()
    /** Thêm thành viên mới */
    await admin
      .database()
      .ref("memberOrganizations")
      .child(`${organizationWantJoin}`)
      .set({
        ...dataSnapshotMemberOrganization,
        [userWantJoin]: true,
      })
    /** Xóa requestJoinOrganization */
    admin
      .database()
      .ref(`requestJoinOrganizations/${requestJoinOrganizationId}`)
      .remove()
      .then(() => {
        console.log("Đã đồng ý yêu cầu tham gia tổ chức")
        res
          .status(200)
          .json({ msg: "Đã đồng ý yêu cầu tham gia tổ chức", code: 0 })
      })
      .catch(() => {
        console.log("Lỗi khi từ chối yêu cầu")
        res.status(500).json({ msg: "Lỗi khi đồng ý yêu cầu", code: 8 })
      })
    return
  }
}

export const getRequestJoinOrganization = async (req, res) => {
  const { organizationId } = req.body
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
  /** Lấy ra thông tin tổ chức */
  const organizationData = (
    await admin
      .database()
      .ref("organizations")
      .child(`${organizationId}`)
      .once("value")
  ).val()
  /** Kiểm tra quyền truy cập */
  if (username !== organizationData.creator)
    return res
      .status(403)
      .json({ msg: "Không có quyền truy cập dữ liệu", code: 3 })
  /** Có quyền truy cập -> Lấy ra toàn bộ các yêu cầu của tổ chức */
  const requestData = (
    await admin
      .database()
      .ref("requestJoinOrganizations")
      .orderByChild("organizationId")
      .equalTo(organizationId)
      .once("value")
  ).val()
  if (!requestData)
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", data: [], code: 0 })
  const listRequestId = Object.keys(requestData)
  let data = []
  for (let i = 0; i < listRequestId.length; i++) {
    const dataRes = (
      await admin
        .database()
        .ref("requestJoinOrganizations")
        .child(`${listRequestId[i]}`)
        .once("value")
    ).val()
    data.push(dataRes)
  }
  return res
    .status(200)
    .json({ msg: "Lấy dữ liệu thành công", data: data, code: 0 })
}

export const getUserInOrganization = async (req, res) => {
  const { organizationId } = req.params
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy ra được username sau đó tiến hành kiểm tra */
  const memberOrganizationsDataRef = admin
    .database()
    .ref(`memberOrganizations/${organizationId}`)
  const memberData = (await memberOrganizationsDataRef.once("value")).val()
  if (!memberData)
    return res.status(200).json({ msg: "Thành công", code: 0, data: [] })
  try {
    const trueMembers = []
    for (const [key, value] of Object.entries(memberData)) {
      if (value === true) {
        trueMembers.push(key)
      }
    }
    let dataPoint = {}
    for (const member of trueMembers) {
      console.log(member)
      const pointMember = (
        await admin
          .database()
          .ref(`points/${organizationId + "*" + member}`)
          .once("value")
      ).val()
      dataPoint = {
        ...dataPoint,
        [member]: pointMember ? pointMember.point : 0,
      }
    }
    // console.log(data)
    return res.status(200).json({
      msg: "Lấy thành viên thành công",
      code: 0,
      data: trueMembers,
      dataPoint,
    })
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy danh sách thành viên của nhóm", code: 1 })
  }
  // const listMember = Object.keys(memberData)
  // if (!listMember.includes(username))
  //   return res.status(400).json({
  //     msg: "Người dùng không thể xem được thông tin thành viên của nhóm này",
  //     code: 3,
  //   })
  // return res
  //   .status(200)
  //   .json({ msg: "Thành công", code: 0, data: Object.keys(memberData) })
}

export const checkUserJoinOrganization = async (req, res) => {
  const { username, organizationId } = req.body
  const resRef = admin
    .database()
    .ref(`memberOrganizations/${organizationId}/${username}`)
  const check = (await resRef.once("value")).val()
  if (!check) return res.status(200).json({ msg: "Thành công", check: false })
  else return res.status(200).json({ msg: "Thành công", check: true })
}

export const updateInfoOrganization = async (req, res) => {
  const { organizationId } = req.params
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** So sánh username với creator của tổ chức */
  let dataOrganization = (
    await admin.database().ref(`organizations/${organizationId}`).once("value")
  ).val()
  if (username !== dataOrganization.creator) {
    return res
      .status(403)
      .json({ msg: "Bạn không có quyền thay đổi dữ liệu tổ chức", code: 3 })
  }
  const { contactinfo, name, description } = req.body
  if (contactinfo) dataOrganization = { ...dataOrganization, contactinfo }
  if (name) dataOrganization = { ...dataOrganization, name }
  if (description) dataOrganization = { ...dataOrganization, description }
  /** Update */
  try {
    await admin
      .database()
      .ref(`organizations/${organizationId}`)
      .set({
        ...dataOrganization,
      })
    return res.status(200).json({
      msg: "Cập nhật dữ liệu thành công",
      code: 0,
      data: dataOrganization,
    })
  } catch (error) {
    console.log("Lỗi khi update thông tin tổ chức")
    return res
      .status(500)
      .json({ msg: "Lỗi khi update thông tin tổ chức", code: 4 })
  }
}

export const createPostInOrganization = async (req, res) => {
  const { organizationId, description } = req.body
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Kiểm tra quyền đăng bài */
  const check = await (
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}/${username}`)
      .once("value")
  ).val()
  if (!check)
    return res
      .status(403)
      .json({ msg: "Bạn không có quyền đăng bài trong tổ chức này", code: 3 })
  /** Kiểm tra file ảnh */
  const imageUrls = []
  if (req.files) {
    for (const file of req.files) {
      const fileRef = admin
        .storage()
        .bucket()
        .file(`postInOrganization/${organizationId}/${file.originalname}`)
      await fileRef.save(file.buffer)
      const url = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      })
      imageUrls.push(url[0])
    }
  }
  /** Đăng bài trong tổ chức */
  const _id = v4()
  const data = {
    id: _id,
    creator: username,
    organizationId: organizationId,
    description: description,
    imageUrls: imageUrls,
    createdAt: Date.now().toString(),
    updatedAt: Date.now().toString(),
  }
  await admin.database().ref(`postInOrganization/${_id}`).set(data)
  return res.status(200).json({ msg: "Đăng bài thành công", data, code: 0 })
}

export const getRequestJoinOrganizationByUser = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy các yêu cầu tham gia của người dùng username */
  try {
    const requestByUser = (
      await admin
        .database()
        .ref("requestJoinOrganizations")
        .orderByChild("username")
        .equalTo(username)
        .once("value")
    ).val()
    console.log(requestByUser)
    if (!requestByUser)
      return res
        .status(200)
        .json({ msg: "Lấy dữ liệu thành công", data: [], code: 0 })
    const listIdRequest = Object.keys(requestByUser)
    let data = []
    for (let i = 0; i < listIdRequest.length; i++) {
      const dataRequest = (
        await admin
          .database()
          .ref(`requestJoinOrganizations/${listIdRequest[i]}`)
          .once("value")
      ).val()
      data.push(dataRequest)
    }
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", data, code: 0 })
  } catch (error) {
    console.log("Xảy ra lỗi khi lấy yêu cầu tham gia của người dùng:", error)
    return res.status(500).json({
      msg: "Xảy ra lỗi khi lấy yêu cầu tham gia của người dùng",
      code: 3,
    })
  }
}

export const getPostInOrganization = async (req, res) => {
  const { organizationId } = req.params
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Kiểm tra xem người dùng có thuộc vào tổ chức hay không */
  const check = (
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}/${username}`)
      .once("value")
  ).val()
  if (!check)
    return res
      .status(403)
      .json({ msg: "Người dùng không có quyền truy cập", code: 3 })
  else {
    /** Lấy các post của nhón*/
    const dataPost = (
      await admin
        .database()
        .ref("postInOrganization")
        .orderByChild("organizationId")
        .equalTo(organizationId)
        .once("value")
    ).val()
    if (!dataPost)
      return res
        .status(200)
        .json({ msg: "Lấy dữ liệu thành công", data: [], code: 0, total: 0 })
    const idPost = Object.keys(dataPost)
    const data = []
    for (let i = 0; i < idPost.length; i++) {
      const dataRes = (
        await admin
          .database()
          .ref(`postInOrganization/${idPost[i]}`)
          .once("value")
      ).val()
      data.push(dataRes)
    }
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      data,
      code: 0,
      total: data.length,
    })
  }
}

export const getPostByUser = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy ra một mảng ID các tổ chức mà người dùng tham gia*/
  const memberOrganizationRef = admin.database().ref("memberOrganizations")
  const snapshot = await memberOrganizationRef
    .orderByChild(username)
    .equalTo(true)
    .once("value")
  const organizations = snapshot.val()
  const organizationIds = organizations ? Object.keys(organizations) : []
  if (organizationIds.length === 0)
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", data: [], code: 0, total: 0 })
  try {
    const postData = await getPostByUserService(organizationIds)
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data: postData,
      total: postData.length,
    })
  } catch (error) {
    console.log("Lỗi xảy ra khi lấy danh sách các bài đăng")
    return res
      .status(500)
      .json({ msg: "Lỗi xảy ra khi lấy danh sách các bài đăng", code: 3 })
  }
}

export const cancelRequestJoinOrganization = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy ra thông tin request */
  const { requestId } = req.body
  const requestData = (
    await admin
      .database()
      .ref(`requestJoinOrganizations/${requestId}`)
      .once("value")
  ).val()
  if (!requestData)
    return res.status(404).json({ msg: "Không có yêu cầu này", code: 3 })
  /** Kiểm tra chính chủ của yêu cầu */
  if (username !== requestData.username) {
    return res
      .status(403)
      .json({ msg: "Không có quyền thao tác với yêu cầu này", code: 4 })
  }
  /** Xóa yêu cầu */
  try {
    await admin.database().ref(`requestJoinOrganizations/${requestId}`).remove()
    return res.status(200).json({ msg: "Đã hủy yêu cầu thành công", code: 0 })
  } catch (error) {
    console.log("Xảy ra lỗi khi xóa yêu cầu")
    return res.status(500).json({ msg: "Xảy ra lỗi khi xóa yêu cầu", code: 5 })
  }
}

export const deleteOrganization = async (req, res) => {
  const { organizationId } = req.params
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy thông tin tổ chức */
  const organizationData = (
    await admin.database().ref(`organizations/${organizationId}`).once("value")
  ).val()
  if (username !== organizationData.creator) {
    return res
      .status(403)
      .json({ msg: "Bạn không có quyền thực hiện", code: 3 })
  }
  try {
    /** Thực hiện xóa tổ chức */
    /** Xóa memberOrganizations */
    await admin.database().ref(`memberOrganizations/${organizationId}`).remove()
    /** Xóa các postInOrganization */
    await admin
      .database()
      .ref(`postInOrganization`)
      .orderByChild("organizationId")
      .equalTo(organizationId)
      .once("value", (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          childSnapshot.ref
            .remove()
            .then(() => {
              console.log(`Đã xóa post có id: ${childSnapshot.key}`)
            })
            .catch((error) => console.log("Lỗi khi xóa post:", error))
        })
      })
    /** Xóa các requestJoinOrganizations */
    await admin
      .database()
      .ref(`requestJoinOrganizations`)
      .orderByChild("organizationId")
      .equalTo(organizationId)
      .once("value", (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          childSnapshot.ref
            .remove()
            .then(() => {
              console.log(
                `Đã xóa requestJoinOrganization có id ${childSnapshot.key}`,
              )
            })
            .catch((error) => {
              console.log("Lỗi khi xóa requestJoinOrganization:", error)
            })
        })
      })
    /** Xóa organization */
    await admin.database().ref(`organizations/${organizationId}`).remove()
    return res.status(200).json({ msg: "Xóa tổ chức thành công", code: 0 })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ msg: "Lỗi khi xóa tổ chức", code: 4 })
  }
}

export const leaveOrganization = async (req, res) => {
  const { organizationId } = req.params
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Kiểm tra xem người dùng có trong nhóm hay không */
  const check = (
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}/${username}`)
      .once("value")
  ).val()
  if (!check) {
    return res.status(500).json({
      msg: "Thao tác không thành công do bạn không có trong tổ chức này",
      code: 3,
    })
  }
  /** Xóa thành viên */
  try {
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}/${username}`)
      .remove()
    return res.status(200).json({ msg: "Rời nhóm thành công", code: 0 })
  } catch (error) {
    console.log("Lỗi khi rời nhóm")
    return res
      .status(500)
      .json({ msg: "Lỗi xảy ra khi thực hiện rời nhóm", code: 4 })
  }
}

export const deleteMemeber = async (req, res) => {
  const { organizationId } = req.params
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Kiểm tra xem có phải đang xóa chính mình */
  const { member } = req.body
  if (!member) {
    return res
      .status(400)
      .json({ msg: "Chưa cung cấp đối tượng cần xóa", code: 5 })
  }
  if (member === username) {
    return res.status(400).json({ msg: "Không thể xóa chính mình", code: 6 })
  }
  /** Kiểm tra xem thành viên member đã thuộc tổ chức hay chưa */
  try {
    const checkMember = (
      await admin
        .database()
        .ref(`memberOrganizations/${organizationId}/${member}`)
        .once("value")
    ).val()
    if (!checkMember) {
      return res
        .status(404)
        .json({ msg: "Người dùng không thuộc trong nhóm này", code: 4 })
    }
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Lỗi khi kiểm tra thông tin người dùng bị xóa", code: 3 })
  }
  /** Kiểm tra quyền thực hiện */
  const creator = (
    await admin
      .database()
      .ref(`organizations/${organizationId}/creator`)
      .once("value")
  ).val()
  if (username !== creator) {
    return res.status(403).json({ msg: "Không có quyền thực hiện", code: 7 })
  }
  /** Xóa người dùng */
  try {
    const dataMember = await (
      await admin
        .database()
        .ref(`memberOrganizations/${organizationId}`)
        .once("value")
    ).val()
    delete dataMember[member]
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}`)
      .set(dataMember)
    return res.status(200).json({ msg: "Xóa thành viên thành công", code: 0 })
  } catch (error) {
    console.log("Lỗi xảy ra khi xóa người dùng")
    return res
      .status(500)
      .json({ msg: "Lỗi xảy ra khi xóa thành viên", code: 8 })
  }
}

export const createReport = async (req, res) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Lấy ra organizationId */
  const { organizationId, titleReport } = req.body
  /** Kiểm tra quyền của người dùng */
  try {
    const adminOrg = (
      await admin
        .database()
        .ref(`organizations/${organizationId}/creator`)
        .once("value")
    ).val()
    if (username !== adminOrg)
      return res
        .status(403)
        .json({ msg: "Không có quyền thực hiện đăng báo cáo", code: 3 })
    /** Lấy ra file */
    const file = req.file
    /** Lấy ra urlFile */
    const fileRef = admin
      .storage()
      .bucket()
      .file(`reportOfOrganization/${organizationId}/${file.originalname}`)
    await fileRef.save(file.buffer)
    const urlFile = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    })
    /** Đăng tải lên db */
    const uuid = v4()
    const data = {
      id: uuid,
      creator: username,
      organizationId,
      titleReport,
      urlFile,
      originalName: file.originalname,
      createdAt: Date.now().toString(),
    }
    await admin.database().ref(`report/${uuid}`).set(data)
    return res
      .status(200)
      .json({ msg: "Đăng báo cáo thành công", code: 0, data })
  } catch (error) {
    console.log("Có lỗi xảy ra khi upload hoặc đăng báo cáo")
    return res
      .status(500)
      .json({ msg: "Có lỗi xảy ra khi upload hoặc đăng báo cáo", code: 4 })
  }
}

export const getReportByOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params
    const dataRes = (
      await admin
        .database()
        .ref(`report`)
        .orderByChild("organizationId")
        .equalTo(organizationId)
        .once("value")
    ).val()
    let data = []
    if (dataRes) {
      data = Object.values(dataRes)
    }
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data,
      total: data.length,
    })
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Lỗi xảy ra khi lấy thông tin các báo cáo", code: 2 })
  }
}

export const updatePoint = async (req, res, next) => {
  /** Lấy ra token được cung cấp */
  const token = req.header("Authorization")?.split(" ")[1]
  let _username
  try {
    const decoded = await jwt.verify(token, process.env.KEY_JWT)
    _username = decoded.username
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xác minh token", code: 2 })
  }
  /** Kiểm tra quyền thực hiện */
  const { username, organizationId, point } = req.body
  const dataOrg = (
    await admin.database().ref(`organizations/${organizationId}`).once("value")
  ).val()
  if (dataOrg.creator !== _username) {
    return res
      .status(403)
      .json({ msg: "Không có quyền thực hiện việc này", code: 3 })
  }
  /** Kiểm tra username có thuộc về organizationId hay không */
  const checkMemberInOrg = (
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}/${username}`)
      .once("value")
  ).val()
  if (!checkMemberInOrg) {
    return res
      .status(404)
      .json({ msg: "Không tìm thấy thành viên này trong tổ chức", code: 4 })
  }
  try {
    /** Tăng điểm cho người dùng trong tổ chức */
    let dataPoint = (
      await admin
        .database()
        .ref(`points/${organizationId + "*" + username}`)
        .once("value")
    ).val()
    if (!dataPoint) {
      /** Nếu chưa có điểm */
      dataPoint = {
        point: 0,
      }
    }
    /** Nếu đã có điểm thì cộng thêm */
    await admin
      .database()
      .ref(`points/${organizationId + "*" + username}`)
      .set({
        ...dataPoint,
        point: dataPoint.point + point,
      })
    return res.status(200).json({ msg: "Cập nhật điểm thành công", code: 0 })
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ msg: "Lỗi xảy ra khi thêm điểm cho người dùng", code: 5 })
  }
}

export const getPointOfOrganization = async (req, res) => {
  const { organizationId } = req.body
  const dataRes = (
    await admin
      .database()
      .ref(`memberOrganizations/${organizationId}`)
      .once("value")
  ).val()
  try {
    const trueMembers = []
    for (const [key, value] of Object.entries(dataRes)) {
      if (value === true) {
        trueMembers.push(key)
      }
    }
    let data = {}
    for (const member of trueMembers) {
      console.log(member)
      const pointMember = (
        await admin
          .database()
          .ref(`points/${organizationId + "*" + member}`)
          .once("value")
      ).val()
      data = { ...data, [member]: pointMember ? pointMember.point : 0 }
    }
    // console.log(data)
    return res
      .status(200)
      .json({ msg: "Lấy điểm các thành viên thành công", code: 0, data })
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy điểm của thành viên", code: 1 })
  }
}
