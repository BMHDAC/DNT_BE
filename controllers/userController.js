import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import admin from "../firebase/connect.js"
import { updateUser } from "../firebase/userService.js"
import CryptoJS from "crypto-js"
import bcrypt from "bcrypt"

dotenv.config({ path: "../.env.development" })

export const getUserData = async (req, res) => {
  /** Lấy token và xác định username */
  const token = req.header("Authorization")?.split(" ")[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.KEY_JWT)
  } catch (error) {
    console.log(error)
    return res.status(401).json({ msg: "Lỗi khi giải mã token", code: 3 })
  }
  const username = decoded?.username
  const _username = req.params.username
  /** Nếu là lấy thông tin người dùng khác */
  if (username !== _username) {
    const userData = (
      await admin.database().ref(`users/${_username}`).once("value")
    ).val()
    if (!userData)
      return res
        .status(400)
        .json({ msg: "Người dùng này không tồn tại", code: 4, user: {} })
    delete userData.password
    // if (userData?.phone ? delete userData?.phone : null) delete userData?.phone
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      user: userData,
    })
  } else {
    /** Lấy thông tin chính bản thân mình */
    const usersRef = admin.database().ref("users")
    const user = usersRef.child(`${username}`)
    const snapshot = await user.once("value")
    /** Nếu người dùng không tồn tại */
    if (!snapshot.exists()) {
      return res
        .status(404)
        .json({ msg: "Không tìm thấy thông tin người dùng", code: 2 })
    }
    /** Lấy dữ liệu người dùng và trả về */
    const userData = snapshot.val()
    delete userData.password
    return res
      .status(200)
      .json({ msg: "Lấy dữ liệu thành công", code: 0, user: userData })
  }
}

export const updateUserData = async (req, res) => {
  /** Lấy token và xác định username */
  const token = req.header("Authorization")?.split(" ")[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.KEY_JWT)
  } catch (error) {
    console.log(error)
    return res.status(401).json({ msg: "Lỗi khi giải mã token", code: 3 })
  }

  const _username = decoded?.username
  const { username } = req.params
  if (_username !== username) {
    return res.status(200).json({
      msg: "Thông tin token không chính xác với người dùng tương ứng",
      code: 1,
    })
  }
  /** Lấy dữ liệu update và cập nhật */
  const dataUpdate = req.body
  try {
    await updateUser(username, dataUpdate)
    return res.status(200).json({ msg: "Update dữ liệu thành công", code: 0 })
  } catch (error) {
    console.log("Lỗi khi update thông tin người dùng:", error)
    return res
      .status(500)
      .json({ msg: "Lỗi khi update thông tin người dùng", code: 2 })
  }
}

export const changePassword = async (req, res) => {
  /** Lấy token và xác định username */
  const token = req.header("Authorization")?.split(" ")[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.KEY_JWT)
  } catch (error) {
    console.log(error)
    return res.status(401).json({ msg: "Lỗi khi giải mã token", code: 7 })
  }

  const username = decoded?.username
  const _username = req.params.username
  if (username !== _username) {
    return res.status(200).json({
      msg: "Thông tin token không chính xác với người dùng tương ứng",
      code: 1,
    })
  }
  /** Lấy thông tin người dùng */
  const usersRef = admin.database().ref("users")
  const user = usersRef.child(`${username}`)
  const snapshot = await user.once("value")
  /** Nếu người dùng không tồn tại */
  if (!snapshot.exists()) {
    return res
      .status(404)
      .json({ msg: "Không tìm thấy thông tin người dùng", code: 2 })
  }
  const userData = snapshot.val()
  /** Xử lý currentPassword và newPassword */
  const { currentPassword, newPassword } = req.body
  /** Giải mã currentPassword và newPassword */
  const _currentPassword = CryptoJS.AES.decrypt(
    currentPassword,
    process.env.KEY_AES,
  ).toString(CryptoJS.enc.Utf8)
  const _newPassword = CryptoJS.AES.decrypt(
    newPassword,
    process.env.KEY_AES,
  ).toString(CryptoJS.enc.Utf8)
  /** Kiểm tra currentPassword với mật khẩu hiện tại trong db */
  try {
    const checkCurrentPassword = await bcrypt.compare(
      _currentPassword,
      userData.password,
    )
    if (!checkCurrentPassword) {
      return res
        .status(401)
        .json({ msg: "Mật khẩu người dùng không chính xác", code: 3 })
    }
    /** Khi chính xác thì thực hiện việc băm newPassword và cập nhật user */
    try {
      const hashedPassword = await bcrypt.hash(_newPassword, 10)
      /** Update user */
      try {
        await updateUser(username, { password: hashedPassword })
        return res
          .status(200)
          .json({ msg: "Cập nhật mật khẩu mới thành công", code: 0 })
      } catch (error) {
        console.log("Lỗi khi lưu mật khẩu mới của người dùng")
        return res
          .status(500)
          .json({ msg: "Lỗi khi lưu mật khẩu mới của người dùng", code: 5 })
      }
    } catch (error) {
      console.log("Xảy ra lỗi khi băm mật khẩu")
      return res.status(500).json({ msg: "Lỗi khi băm mật khẩu mới", code: 4 })
    }
  } catch (error) {
    console.log("Lỗi khi xác định mật khẩu hiện tại của người dùng")
    return res.status(500).json({
      msg: "Lỗi khi xác định mật khẩu hiện tại của người dùng",
      code: 6,
    })
  }
}

export const getTotalPoint = async (req, res) => {
  try {
    const { username } = req.params
    const dataUser = (
      await admin.database().ref(`users/${username}`).once("value")
    ).val()
    if (!dataUser) {
      return res.status(404).json({ msg: "Người dùng không tồn tại", code: 1 })
    }
    let point = 0
    const dataRes = (await admin.database().ref(`points`).once("value")).val()
    for (const [key, value] of Object.entries(dataRes)) {
      if (key.endsWith(`*${username}`)) {
        point += value.point
      }
    }
    return res
      .status(200)
      .json({ msg: "Lấy điểm của người dùng thành công", code: 0, point })
  } catch (error) {
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy điểm của người dùng", code: 1 })
  }
}
