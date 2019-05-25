const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

exports.sendCreateNotification = functions.firestore.document('remoteDebts/{debtId}')
    .onCreate(async (snapshot) => {
        const data = snapshot.data();
        let tokens = await getTokens(data.initPersonUid === data.creditorUid ? data.debtorUid : data.creditorUid);
        let payload = await getCreateNotificationPayload(data);
        return admin.messaging().sendToDevice(tokens, payload);
    });

async function getTokens(uid) {
    let tokens = [];
    let allTokens = await admin.firestore()
        .collection("tokens")
        .doc(uid)
        .collection("pushTokens")
        .get();
    allTokens.forEach(tokenDoc => {
        tokens.push(tokenDoc.data().token);
    });
    return tokens;
}

async function getCreateNotificationPayload(data) {
    let personName = await getPersonName(data.initPersonUid === data.creditorUid ? data.creditorUid : data.debtorUid);
    let value = data.initPersonUid === data.creditorUid ? ('' + (data.value * -1)) : ('' + data.value);
    return {
        data: {
	    type: 'create',
            personName: personName,
            value: value
        }
    };
}

async function getPersonName(uid) {
    let userSnap = await admin.firestore()
        .collection("users")
        .doc(uid)
        .get();
    let userData = userSnap.data();
    return userData.firstName + ' ' + userData.lastName;
}
