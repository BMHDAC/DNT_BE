import admin from "../firebase/connect.js"

export const getAllUser = async (req, res) => {
  try {
    const dataRes = (
      await admin
        .database()
        .ref(`users`)
        .orderByChild("role")
        .equalTo("user")
        .once("value")
    ).val()
    let dataUser = []
    if (!dataRes) dataUser = []
    else dataUser = Object.values(dataRes)
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data: dataUser,
      total: dataUser.length,
    })
  } catch (error) {
    console.log("Lỗi khi lấy dữ liệu người dùng")
    return res
      .status(500)
      .json({ msg: "Lỗi khi lấy dữ liệu người dùng", code: 2 })
  }
}

export const getHelpRequestByUser = async (req, res) => {
  try {
    const { username } = req.params
    const dataRes = (
      await admin
        .database()
        .ref(`helpRequests`)
        .orderByChild("createdBy")
        .equalTo(username)
        .once("value")
    ).val()
    let dataHelpRequest = []
    if (!dataRes) dataHelpRequest = []
    else dataHelpRequest = Object.values(dataRes)
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data: dataHelpRequest,
      total: dataHelpRequest.length,
    })
  } catch (error) {
    console.log("Lỗi khi lấy yêu cầu hỗ trợ")
    return res.status(500).json({ msg: "Lỗi khi lấy yêu cầu hỗ trợ", code: 2 })
  }
}

export const deleteUser = async (req, res) => {
  const { username } = req.params
  /** Kiểm tra người dùng */
  const dataUser = await admin
    .database()
    .ref(`users`)
    .child(`${username}`)
    .once("value")
  if (!dataUser.exists())
    return res.status(404).json({ msg: "Không tồn tại người dùng", code: 2 })
  try {
    /** Xóa các yêu cầu tham gia tổ chức của người dùng */
    const dataResRequestJoinOrg = (
      await admin
        .database()
        .ref(`requestJoinOrganizations`)
        .orderByChild("username")
        .equalTo(username)
        .once("value")
    ).val()
    let listIdRequestJoinOrg = []
    if (dataResRequestJoinOrg) {
      listIdRequestJoinOrg = Object.keys(dataResRequestJoinOrg)
      for (let i = 0; i < listIdRequestJoinOrg.length; i++) {
        await admin
          .database()
          .ref(`requestJoinOrganizations/${listIdRequestJoinOrg[i]}`)
          .remove()
      }
    }
    /** Xóa các postInOrganization */
    const dataResPostInOrganization = (
      await admin
        .database()
        .ref(`postInOrganization`)
        .orderByChild("creator")
        .equalTo(username)
        .once("value")
    ).val()
    let listIdPostInOrganization = []
    if (dataResPostInOrganization) {
      listIdPostInOrganization = Object.keys(dataResPostInOrganization)
      for (let i = 0; i < listIdPostInOrganization.length; i++) {
        await admin
          .database()
          .ref(`postInOrganization/${listIdPostInOrganization[i]}`)
          .remove()
      }
    }
    /** Xóa thành viên này trong danh sách member */
    const dataResMemberOrganization = (
      await admin
        .database()
        .ref(`memberOrganizations`)
        .orderByChild(username)
        .equalTo(true)
        .once("value")
    ).val()
    if (dataResMemberOrganization) {
      const listIdMemberOrganization = Object.keys(dataResMemberOrganization)
      for (let i = 0; i < listIdMemberOrganization.length; i++) {
        await admin
          .database()
          .ref(`memberOrganizations/${listIdMemberOrganization[i]}/${username}`)
          .remove()
      }
    }
    /** Xóa người dùng */
    await admin.database().ref(`users/${username}`).remove()
    return res.status(200).json({ msg: "Xóa người dùng thành công", code: 0 })
  } catch (error) {
    console.log("Lỗi khi xóa người dùng", error)
    return res.status(500).json({ msg: "Lỗi khi xóa người dùng", code: 3 })
  }
}

export const getAllOrganization = async (req, res) => {
  try {
    const dataRes = (
      await admin.database().ref(`organizations`).once("value")
    ).val()
    let dataOrganization = []
    if (!dataRes) dataOrganization = []
    else dataOrganization = Object.values(dataRes)
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data: dataOrganization,
      total: dataOrganization.length,
    })
  } catch (error) {
    console.log("Lỗi khi lấy dữ liệu tổ chức")
    return res.status(500).json({ msg: "Lỗi khi lấy dữ liệu tổ chức", code: 2 })
  }
}

export const getPostInOrganization = async (req, res) => {
  const { organizationId } = req.params
  const dataOrganization = await admin
    .database()
    .ref(`organizations/${organizationId}`)
    .once("value")
  if (!dataOrganization.exists())
    return res.status(404).json({ msg: "Tổ chức không tồn tại", code: 2 })
  try {
    const dataRes = (
      await admin
        .database()
        .ref(`postInOrganization`)
        .orderByChild("organizationId")
        .equalTo(organizationId)
        .once("value")
    ).val()
    let dataPost = []
    if (!dataRes) dataPost = []
    else dataPost = Object.values(dataRes)
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data: dataPost,
      total: dataPost.length,
    })
  } catch (error) {
    console.log("Lỗi khi lấy dữ liệu")
    return res.status(500).json({ msg: "Lỗi khi lấy dữ liệu", code: 3 })
  }
}

export const getAllHelpRequest = async (req, res) => {
  try {
    const dataRes = (
      await admin.database().ref(`helpRequests`).once("value")
    ).val()
    let listHelpRequest = []
    if (!dataRes) listHelpRequest = []
    else listHelpRequest = Object.values(dataRes)
    return res.status(200).json({
      msg: "Lấy dữ liệu thành công",
      code: 0,
      data: listHelpRequest,
      total: listHelpRequest.length,
    })
  } catch (error) {
    console.log("Lỗi khi lấy dữ liệu")
    return res.status(500).json({ msg: "Lỗi khi lấy dữ liệu", code: 3 })
  }
}

export const deletePostInOrganization = async (req, res) => {
  const { postId } = req.params
  const dataPost = await admin
    .database()
    .ref(`postInOrganization/${postId}`)
    .once("value")
  if (!dataPost.exists())
    return res.status(404).json({ msg: "Bài đăng không tồn tại", code: 2 })
  try {
    await admin.database().ref(`postInOrganization/${postId}`).remove()
    return res.status(200).json({ msg: "Xóa bài đăng thành công", code: 0 })
  } catch (error) {
    return res.status(500).json({ msg: "Lỗi khi xóa bài đăng", code: 3 })
  }
}
