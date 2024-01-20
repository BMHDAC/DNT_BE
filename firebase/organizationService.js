import admin from "./connect.js"

/** Tham chiếu đến nút organizations */
const organizationRef = admin.database().ref("organizations")
/** Tham chiếu đến nút members */
const memberOrganizationRef = admin.database().ref("memberOrganizations")
/** Tham chiếu đến nút requestJoinOrganizations */
const requestJoinOrganizationRef = admin
  .database()
  .ref("requestJoinOrganizations")

/** Thêm organization mới vào db */
export const createNewOrganization = async (
  infoCreateOrganization,
  username,
) => {
  try {
    const newOrganizationRef = organizationRef.push()
    const newOrganizationRefId = newOrganizationRef.key
    await newOrganizationRef.set({
      ...infoCreateOrganization,
      id: newOrganizationRefId,
    })
    await memberOrganizationRef.child(`${newOrganizationRefId}`).set({
      [username]: true,
    })
    return {
      ...infoCreateOrganization,
      id: newOrganizationRefId,
    }
  } catch (error) {
    console.log("Lỗi xảy ra khi thêm tổ chức vào database")
    console.log(error)
    return {}
  }
}

/** Lấy thông tin tổ chức dựa trên id */
export const getOrganization = async (organizationId) => {
  try {
    const orgRef = organizationRef.child(`${organizationId}`)
    const snapshot = await orgRef.once("value")
    const orgData = snapshot.val()
    if (orgData) {
      return orgData
    } else {
      console.log(`Tổ chức ${organizationId} không tồn tại`)
      return {}
    }
  } catch (error) {
    console.log(`Lỗi khi tìm kiếm thông tin tổ chức: ${organizationId}`)
    console.log(error)
    return {}
  }
}

/** Cập nhật thông tin tổ chức */
export const updateOrganization = async (
  organizationId,
  updatedOrganization,
) => {
  try {
    await organizationRef.child(`${organizationId}`).update(updatedOrganization)
  } catch (error) {
    console.log("Lỗi xảy ra khi cập nhật thông tin tổ chức")
    console.log(error)
  }
}

export const getOrganizationByUserService = async (username) => {
  const snapshot = await memberOrganizationRef
    .orderByChild(username)
    .equalTo(true)
    .once("value")
  const organizations = snapshot.val()
  const organizationIds = organizations ? Object.keys(organizations) : []
  if (organizationIds.length === 0) return []
  else {
    let listOrg = []
    for (let i = 0; i < organizationIds.length; i++) {
      const organizationInfoRef = organizationRef.child(`${organizationIds[i]}`)
      const snapshot = await organizationInfoRef.once("value")
      const orgData = snapshot.val()
      if (orgData) listOrg.push(orgData)
    }
    return listOrg
  }
}

export const checkRequestOfUser = async (username, organizationId) => {
  const snapshot = await requestJoinOrganizationRef
    .orderByChild("username")
    .equalTo(username)
    .once("value")
  /** Nếu người dùng chưa có bất kỳ yêu cầu tham gia tổ chức nào thì trả về false */
  if (!snapshot.val()) return false
  /** Nếu người dùng đã gửi một số yêu cầu nào đó thì lấy ra list các ID request */
  const listRequest = Object.keys(snapshot.val())
  /** Kiểm tra trong các req đã có req nào gửi đến organizationId này chưa */
  for (let i = 0; i < listRequest.length; i++) {
    const request = snapshot.val()[listRequest[i]]
    if (request.organizationId === organizationId) return true
  }
  return false
}

export const getPostByUserService = async (organizationIds) => {
  const ref = admin.database().ref("postInOrganization")
  const queries = organizationIds.map((orgId) => {
    return ref.orderByChild("organizationId").equalTo(orgId).once("value")
  })

  // Using Promise.all to execute all queries simultaneously and await their resolution
  try {
    const results = await Promise.all(queries)
    const posts = []
    results.forEach((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        posts.push(childSnapshot.val())
      })
    })
    return posts // Now this will return the posts after all the queries have been resolved
  } catch (error) {
    console.error("Error fetching posts:", error)
    // Handle the error appropriately
    throw error // Re-throw the error if you want to handle it further up the call stack
  }
}
