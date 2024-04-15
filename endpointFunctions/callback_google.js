require("dotenv").config();
const axios = require("axios");
const google_client_id = process.env.GOOGLE_CLIENT_ID || null;
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || null;
const google_redirect_uri = process.env.GOOGLE_CALLBACK_URL;
const qs = require("qs");

const callback_google = async (req, res) => {
   console.log("Connected to /google_callback");
   const code = req.query.code || null;
   // const state = req.query.state || null;
   const state = 1;
   // const storedState = req.cookies ? req.cookies[google_stateKey] : null
   const storedState = 1;
   // if (state === null || state !== storedState) {
   //    res.json({ Error: "State Mismatch" });
   // } else {
   //    // res.clearCookie(spotify_stateKey);
   // }
   const url = "https://oauth2.googleapis.com/token";
   const options = {
      code,
      client_id: google_client_id,
      client_secret: google_client_secret,
      redirect_uri: google_redirect_uri,
      grant_type: "authorization_code",
   };
   try {
      const response = await axios.post(url, qs.stringify(options), {
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
      });
      const { refresh_token, access_token, expires_in } = response.data;
      console.log("Google id_token.length", id_token ? id_token.length : 0);
      console.log("Google access_token.length", access_token ? access_token.length : 0);
      res.json({
         Google_Callback: "Success",
         Auth_Code: code,
         id_token: id_token || null,
         access_token: access_token || null,
         response: response.data,
      });
   } catch (err) {
      console.error(err.response, `\n`, `\n`, "Failed to get token");
      res.json({
         Error: err.message,
         Stack: err.stack,
         All: err,
      });
   }
};
module.exports = callback_google;
