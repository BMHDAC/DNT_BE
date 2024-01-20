import admin from "./connect.js"

const helpRequestRef = admin.database().ref("helpRequests")

export const getAllHelpRequestService = async () => {
  const helpRequestData = await (await helpRequestRef.once("value")).val()

  const listHelpRequestId = Object.keys(helpRequestData)
  let data = []
  for (let i = 0; i < listHelpRequestId.length; i++) {
    const dataRes = (
      await helpRequestRef.child(`${listHelpRequestId[i]}`).once("value")
    ).val()
    data.push(dataRes)
  }
  return data
}

export const getHelpRequestByUserService = async (username) => {
  const helpRequestData = (
    await helpRequestRef
      .orderByChild("createdBy")
      .equalTo(username)
      .once("value")
  ).val()
  if (!helpRequestData) return []
  else {
    let data = []
    const listId = Object.keys(helpRequestData)
    for (let i = 0; i < listId.length; i++) {
      const dataRes = (
        await helpRequestRef.child(`${listId[i]}`).once("value")
      ).val()
      data.push(dataRes)
    }
    return data
  }
}
