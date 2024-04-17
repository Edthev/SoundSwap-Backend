require("dotenv").config();
const axios = require("axios");
const google_client_id = process.env.GOOGLE_CLIENT_ID || null;
const google_client_secret = process.env.GOOGLE_CLIENT_SECRET || null;
const google_redirect_uri = process.env.GOOGLE_CALLBACK_URL;
const google_stateKey = "google_auth_state";
const qs = require("qs");
const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);
// // TODO make flow redirect to user with session token
// // TODO no response if successful only session token

const callback_google = async (req, res) => {
   console.log("Connected to /google_callback");
   const code = req.query.code || null;
   const state = 1; // const state = req.query.state || null;
   const storedState = 1; // const storedState = req.cookies ? req.cookies[google_stateKey] : null
   const storedSession = req.cookies ? req.cookies["google_session_token"] : null;
   res.clearCookie(google_stateKey);
   const url = "https://oauth2.googleapis.com/token";
   const options = {
      code: code,
      client_id: google_client_id,
      client_secret: google_client_secret,
      redirect_uri: google_redirect_uri,
      grant_type: "authorization_code",
   };
   try {
      console.log("Post request for tokens...");
      const response = await axios.post(url, qs.stringify(options), {
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
      });

      console.log("Request returned");
      const { refresh_token, access_token, expires_in } = response.data;

      try {
         const deleteID = "317ysrmblnathrkebehqlhnyq4eq";
         // // TODO check if spotify or youtube is signed in
         // // TODO make google session and add it to existing user
         // // TODO add tokens to existing user
         console.log("Fetching google user");
         const dbRes = await db("users")
            .select("*")
            .where("spotify_id", deleteID || null)
            .then(async (existingUser) => {
               if (existingUser.length === 0) {
                  return await db("users")
                     .insert({
                        google_access_token: access_token,
                        google_refresh_token: refresh_token,
                        google_token_expiry: expires_in,
                        google_session: storedSession,
                     })
                     .then(() => {
                        console.log(`User ${deleteID} created`);
                     });
               } else {
                  console.log(`\n` + `User ${deleteID} exists!`);
                  // console.log("storedSession", storedSession ? storedSession.length : 0);
                  // console.log("New Token:", access_token ? access_token.length : 0);

                  const resDb = await db("users").where("spotify_id", deleteID).update({
                     google_access_token: access_token,
                     google_refresh_token: refresh_token,
                     google_session: storedSession,
                  });
                  console.log("resDb", resDb);
                  console.log("Redirecting to merge page");
                  // res.redirect(`http://localhost:3000/merge?check`);
                  res.json({
                     Google_Callback: "Success",
                     Auth_Code: code,
                     response: response.data,
                  });
               }
            });
         console.log("dbRes", dbRes);
         console.log("Google access_token.length", access_token ? access_token.length : 0);
      } catch (err) {
         console.log("err:", err, "err");
         res.json({
            Error: err.message,
            Stack: err.stack,
            All: err,
         });
      }
   } catch (err) {
      console.error(err, `\n`, `\n`, "Failed to get Google token");
      res.json({
         Error: err.message,
         Stack: err.stack,
         All: err,
      });
   }
};
module.exports = callback_google;
