const { google } = require('googleapis');
const path = require('path');

// Path to your service account file
const serviceAccountPath = path.join(__dirname, 'realtimenoti-387d2-firebase-adminsdk-fbsvc-984ccc43cc.json');

// Create an auth client using the service account
const auth = new google.auth.GoogleAuth({
    keyFile: serviceAccountPath,
    scopes: 'https://www.googleapis.com/auth/firebase.messaging',  // Required for FCM
});

// Get OAuth 2.0 Access Token
async function getAccessToken() {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
}

getAccessToken()
    .then((token) => {
        console.log('Access Token:', token);
    })
    .catch((error) => {
        console.error('Error getting access token:', error);
    });