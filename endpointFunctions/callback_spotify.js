require("dotenv").config();
const request = require("request");
const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

const spotify_redirect_uri = process.env.SPOTIFY_CALLBACK_URL;
const spotify_stateKey = "spotify_auth_state";
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID || null;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET || null;
// TODO make flow redirect to user with session token
// TODO no response if successful only session token
const callback_spotify = async (req, res) => {
   console.log("Connected to /callback");
   // your application requests refresh and access tokens
   // after checking the state parameter

   const code = req.query.code || null;
   const state = req.query.state || null;
   const storedState = req.cookies ? req.cookies[spotify_stateKey] : null;
   res.clearCookie(spotify_stateKey);

   const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
         code: code,
         redirect_uri: spotify_redirect_uri,
         grant_type: "authorization_code",
      },
      headers: {
         "content-type": "application/x-www-form-urlencoded",
         Authorization:
            "Basic " +
            new Buffer.from(spotify_client_id + ":" + spotify_client_secret).toString(
               "base64"
            ),
      },
      json: true,
   };
   try {
      request.post(authOptions, async (error, response, body) => {
         const access_token = body.access_token,
            refresh_token = body.refresh_token,
            expiry = body.expires_in,
            now = new Date(),
            expiration = now.valueOf() + expiry - 200;
         access_token && refresh_token
            ? console.log(
                 "access_token.length",
                 access_token.length,
                 `\n`,
                 "refresh_token.length",
                 refresh_token.length
              )
            : console.log("access_token.length: 0", `\n`, "refresh_token.length: 0");

         const options = {
            url: "https://api.spotify.com/v1/me",
            headers: { Authorization: "Bearer " + access_token },
            json: true,
         };

         // use the access token to access the Spotify Web API
         try {
            request.get(options, async (error, response, body) => {
               console.log(
                  "Signed into:",
                  body.email,
                  `\n`,
                  "URL:",
                  "https://open.spotify.com/user/" + body.id,
                  `\n`,
                  body
               );
               const storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
               console.log("storedSession.length", storedSession.length);
               console.log("storedSession", storedSession);
               if (storedSession !== null && storedSession && storedSession.length === 16) {
                  console.log("Stored Session exists");
               } else {
                  console.log();
                  console.error("Stored session mismatch");
                  console.log();
                  return res.json({ Error: "Stored session mismatch" });
               }

               // add user to database
               try {
                  await db("users")
                     .select("spotify_id")
                     .where("spotify_id", body.id)
                     .then(async (existingUser) => {
                        if (existingUser.length === 0) {
                           return db("users")
                              .insert({
                                 spotify_id: body.id,
                                 spotify_access_token: access_token,
                                 spotify_refresh_token: refresh_token,
                                 spotify_token_expiry: expiry,
                                 spotify_session: storedSession,
                              })
                              .then(() => {
                                 console.log(`User ${body.id} created`);
                                 res.redirect(`http://localhost:3000/merge?check`);
                              })
                              .catch((err) => {
                                 console.error(
                                    err.response.data.error,
                                    `\n`,
                                    `\n`,
                                    "Error inserting user data"
                                 );
                                 // console.error("Error inserting user data:", err);
                              });
                        } else {
                           console.log(`\n` + `User ${body.id} exists!`);
                           console.log("storedSession", storedSession.length);
                           console.log("New Token:", access_token.length);

                           const resDb = await db("users")
                              .where("spotify_id", body.id)
                              .update({
                                 spotify_access_token: access_token,
                                 spotify_refresh_token: refresh_token,
                                 spotify_session: storedSession,
                              });
                           console.log("resDb", resDb);
                           console.log("Redirecting to merge page");
                           res.redirect(`http://localhost:3000/merge?check`);
                        }
                     });
               } catch (err) {
                  console.error(
                     err.response.data.error,
                     `\n`,
                     `\n`,
                     "Error adding users to database"
                  );
                  // console.log("Error adding users to database (possibly undefined):", err);
               }

               if (body === "User not registered in the Developer Dashboard") {
                  console.log("User not registered on developer dashboard");
                  return res.redirect("/error?dev_program_error");
               } else {
               }
            });
         } catch (e) {
            console.err(err.response, `\n`, `\n`, "Failed to get Spotify Request");
            res.json({
               Error: err.message,
               Stack: err.stack,
               All: err,
            });
         }
         // redirect back to user
      });
   } catch (err) {
      console.err(err.response, `\n`, `\n`, "Failed to get Spotify token");
      res.json({
         Error: err.message,
         Stack: err.stack,
         All: err,
      });
   }
};
module.exports = callback_spotify;
