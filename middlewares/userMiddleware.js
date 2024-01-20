import { checkUsername } from "../utils/checkUsername.js"

export const checkExistToken = (req, res, next) => {
  const { username } = req.params
  if (!checkUsername(username)) {
    return res.status(400).json({ msg: "Đường dẫn không hợp lệ" })
  }
  const authHeader = req.header("Authorization")
  if (!authHeader) {
    return res
      .status(400)
      .json({ msg: "Chưa cung cấp Authorization Bearer Token" })
  }
  if (authHeader) {
    const token = authHeader?.split(" ")[1]
    if (!token) return res.status(400).json({ msg: "Chưa cung cấp Token" })
  }
  next()
}

export const checkDataUpdate = (req, res, next) => {
  const dataUpdate = req.body
  const allowedFields = [
    "displayName",
    "phone",
    "gender",
    "fundTime",
    "personalDesc",
    "abilitySupport",
    "address",
  ]
  for (const key in dataUpdate) {
    if (!allowedFields.includes(key)) {
      return res.status(400).json({
        msg: `Trường "${key}" không hợp lệ`,
      })
    }
  }
  next()
}

export const checkChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Chưa cung cấp đầy đủ mật khẩu mới và mật khẩu hiện tại" })
  }
  next()
}
