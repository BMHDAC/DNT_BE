import dotenv from "dotenv"
import mime from "mime-types"

dotenv.config({ path: "../.env.development" })

export const checkUploadAvatar = (req, res, next) => {
  const file = req.file
  const authHeader = req.header("Authorization")

  if (!authHeader) {
    return res
      .status(401)
      .json({ msg: "Chưa cung cấp Authorization trong Header" })
  }

  if (!file) {
    return res.status(400).json({ msg: "Chưa cung cấp file" })
  }

  /** Kiểm tra loại nội dung của tệp */
  const contentType = mime.lookup(file.originalname)

  if (!contentType || !contentType.startsWith("image/")) {
    return res.status(400).json({ msg: "Tệp không phải là ảnh" })
  }

  next()
}
