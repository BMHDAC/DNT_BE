import jwt from "jsonwebtoken"

export const checkAdmin = (req, res, next) => {
  const authHeader = req.header("Authorization")
  if (!authHeader) {
    res.status(400).json({ msg: "Chưa cung cấp Authorization", code: 1 })
  }
  const token = authHeader?.split(" ")[1]
  if (!token) {
    res.status(400).json({ msg: "Chưa cung cấp Token", code: 1 })
  }
  const decoded = jwt.verify(token, process.env.KEY_JWT)
  if (decoded.role !== "admin") {
    return res.status(403).json({ msg: "Không có quyền thực hiện", code: 1 })
  }
  next()
}

