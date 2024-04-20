const crypto = require("crypto");
require("dotenv").config();

const google_client_id = process.env.GOOGLE_CLIENT_ID || null;
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || null;
const google_redirect_uri = process.env.GOOGLE_CALLBACK_URL;

const callback_google = (req, res) => {
   console.log("Connect to /login_google");
   const generateRandomString = (length) => {
      return crypto.randomBytes(60).toString("hex").slice(0, length);
   };
   const state = generateRandomString(16);
   const google_stateKey = "google_auth_state";
   res.cookie(google_stateKey, state);

   res.cookie("google_session_token", state);
   console.log("Google session created");

   const google_scope =
      "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtubepartner https://www.googleapis.com/auth/youtube.force-ssl";
   console.log("Redirecting to Google for auth token");

   res.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth` +
         `?scope=${google_scope}` +
         `&access_type=offline` +
         `&include_granted_scopes=true` +
         `&response_type=code` +
         `&prompt=consent` +
         `&state=state_parameter_passthrough_value` +
         `&redirect_uri=${google_redirect_uri}` +
         `&client_id=${google_client_id}`
   );
};
module.exports = callback_google;
