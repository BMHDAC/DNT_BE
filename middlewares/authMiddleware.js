import { checkValidGmail } from "../utils/utilsEmail.js"
import { checkValidPhoneNumber } from "../utils/utilsPhone.js"
import dotenv from "dotenv"
import CryptoJS from "crypto-js"
import { checkUsername } from "../utils/checkUsername.js"

dotenv.config({ path: "../.env.development" })

/** Kiểm tra dữ liệu đăng ký gửi lên server */
export const checkRegister = async (req, res, next) => {
  const { username, gmail, password, phone, gender } = req.body
  /** Kiểm tra định dạng dữ liệu gửi lên */
  if (!username || !gmail || !password || !gender) {
    return res.status(400).json({ msg: "Vui lòng điền đầy đủ thông tin" })
  }
  /** Kiểm tra tính hợp lệ của gmail */
  if (!checkValidGmail(gmail)) {
    return res.status(400).json({ msg: "Địa chỉ gmail không hợp lệ" })
  }
  /** Kiểm tra tính hợp lệ của username */
  if (!checkUsername(username)) {
    return res.status(400).json({ msg: "Tên đăng nhập không hợp lệ" })
  }
  /** Kiểm tra tính hợp lệ của password */
  const _password = CryptoJS.AES.decrypt(
    password,
    process.env.KEY_AES,
  ).toString(CryptoJS.enc.Utf8)
  if (_password && _password.length < 6) {
    return res
      .status(400)
      .json({ msg: "Mật khẩu phải có độ dài ít nhất 6 ký tự" })
  }
  /** Kiểm tra tính hợp lệ của phone nếu có cung cấp */
  if (phone && !checkValidPhoneNumber(phone)) {
    return res.status(400).json({ msg: "Số điện thoại không hợp lệ" })
  }
  /** Kiểm tra tính hợp lệ của gender */
  if (gender !== "male" && gender !== "female") {
    return res
      .status(400)
      .json({ msg: "Cung cấp thông tin giới tính không hợp lệ" })
  }
  next()
}

export const checkVerifyOTP = (req, res, next) => {
  const { otp } = req.body
  if (!otp) {
    return res.status(400).json({ msg: "Cần cung cấp kèm OTP" })
  }
  if (otp && otp.length !== 6) {
    return res.status(400).json({ msg: "Cần cung cấp OTP bao gồm 6 chữ số" })
  }
  next()
}

export const checkSignIn = (req, res, next) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res
      .status(400)
      .json({ msg: "Cần cung cấp đầy đủ thông tin đăng nhập" })
  }
  /** Kiểm tra tính hợp lệ của username */
  if (!checkUsername(username)) {
    return res.status(400).json({ msg: "Tên đăng nhập không hợp lệ" })
  }
  next()
}
