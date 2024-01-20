import admin from "../firebase/connect.js"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { getUser, updateUser } from "../firebase/userService.js"

dotenv.config({ path: "../.env.development" })
/** Tạo storage bucket */
const bucket = admin.storage().bucket()

export const uploadFile = async (req, res) => {
  const file = req.file
  const token = req.header("Authorization")?.split(" ")[1]
  let username, gmail
  if (!token)
    return res.status(401).json({ msg: "Chưa cung cấp token", code: 1 })
  try {
    const decoded = jwt.verify(token, process.env.KEY_JWT)
    username = decoded.username
    gmail = decoded.gmail
  } catch (error) {
    console.log("Xảy ra lỗi khi phân tích token: ", error)
    return res
      .status(500)
      .json({ msg: "Xảy ra lỗi khi phân tích token", code: 2 })
  }

  if (!token || !file) {
    return res
      .status(400)
      .json({ msg: "Thiếu thông tin người dùng hoặc tệp", code: 3 })
  }
  /** Đường dẫn trên Firebase Storage */
  const remoteFilePath = `user/${username}/${file.originalname}`
  /** Tải lên tệp vào Firebase Storage */
  const blob = bucket.file(remoteFilePath)
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  })

  blobStream.on("error", (error) => {
    console.error("Lỗi khi tải lên tệp:", error)
    return res.status(500).json({ msg: "Lỗi khi tải lên tệp", code: 4 })
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
            .json({ msg: "Lỗi khi lấy URL tải xuống", code: 5 })
        } else {
          console.log("Tệp đã được tải lên thành công.")
          console.log("URL của tệp đã tải lên:", url)
          /** Sau khi có url của ảnh, lấy url để làm avatar cho người dùng */
          try {
            /** Update thông tin user */
            await updateUser(username, { urlAvatar: url })
            /** Lấy dữ liệu người dùng */
            const userData = await getUser(username)
            delete userData.password
            return res.status(200).json({
              msg: "Tệp đã được tải lên thành công",
              code: 0,
              userData,
            })
          } catch (error) {
            console.log("Xảy ra lỗi khi cập nhật avatar người dùng")
            return res.status(500).json({
              msg: "Xảy ra lỗi khi cập nhật avatar người dùng",
              code: 6,
            })
          }
        }
      },
    )
  })

  blobStream.end(file.buffer)
}
