import admin from "firebase-admin"
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" }

/** Khởi tạo ứng dụng Firebase */
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://volunteerapp-e7f94-default-rtdb.asia-southeast1.firebasedatabase.app/",
    storageBucket: "volunteerapp-e7f94.appspot.com",
  })
  console.log(">>> Kết nối với firebase thành công")
} catch (error) {
  console.log(">>> Xảy ra lỗi khi kết nối với firebase")
  console.log(">>> Lỗi khi kết nối firebase:", error)
}

/** Xuất đối tượng admin để sử dụng trong các tệp khác */
export default admin
