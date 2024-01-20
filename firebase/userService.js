import admin from "./connect.js"

/** Tham chiếu đến nút users */
const usersRef = admin.database().ref("users")

/** Thêm user mới vào users */
export const addUser = async (username, infoUser) => {
  try {
    await usersRef.child(`${username}`).set(infoUser)
  } catch (error) {
    console.log("Lỗi xảy ra khi thêm người dùng vào database")
    console.log(error)
  }
}

/** Cập nhật thông tin user */
export const updateUser = async (username, updatedUser) => {
  try {
    await usersRef.child(`${username}`).update(updatedUser)
  } catch (error) {
    console.log("Lỗi xảy ra khi cập nhật thông tin người dùng")
    console.log(error)
  }
}

/** Xóa thông tin người dùng */
export const deleteUser = async (username) => {
  try {
    await usersRef.child(`${username}`).remove()
  } catch (error) {
    console.log("Lỗi xảy ra khi xóa người dùng")
    console.log(error)
  }
}

/** Lấy thông tin người dùng */
export const getUser = async (username) => {
  try {
    const userRef = usersRef.child(`${username}`)
    const snapshot = await userRef.once("value")
    /** Lấy ra dữ liệu tại nút userRef, thực hiện truy vấn và trả về đối tượng snapshot, sau đó chuyển thành dạng JSON */
    const userData = snapshot.val()
    if (userData) {
      console.log("User data:", userData)
      return userData
    } else {
      console.log(`Người dùng ${username} không tìm thấy`)
      return {}
    }
  } catch (error) {
    console.log(`Lỗi khi tìm kiếm thông tin người dùng: ${username}`)
    console.log(error)
    return {}
  }
}
