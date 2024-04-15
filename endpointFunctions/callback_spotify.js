require("dotenv").config();
const request = require("request");
const querystring = require("querystring");
const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

const spotify_redirect_uri = process.env.SPOTIFY_CALLBACK_URL;
const spotify_stateKey = "spotify_auth_state";
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID || null;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET || null;

const callback_spotify = (req, res) => {
   console.log("Connected to /callback");
   // your application requests refresh and access tokens
   // after checking the state parameter

   const code = req.query.code || null;
   const state = req.query.state || null;
   const storedState = req.cookies ? req.cookies[spotify_stateKey] : null;
   if (state === null || state !== storedState) {
      res.json({ Error: "State Mismatch" });
   } else {
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

      request.post(authOptions, function (error, response, body) {
         if (!error && response.statusCode === 200) {
            const now = new Date();
            const access_token = body.access_token,
               refresh_token = body.refresh_token,
               expiry = body.expires_in;
            console.log("access_token.length", access_token.length);
            console.log("refresh_token.length", refresh_token.length);
            const expiration = now.valueOf() + expiry - 200;
            const options = {
               url: "https://api.spotify.com/v1/me",
               headers: { Authorization: "Bearer " + access_token },
               json: true,
            };

            // use the access token to access the Spotify Web API
            request.get(options, function (error, response, body) {
               if (body.email) {
                  console.log("Signed into:", body.email);
                  console.log("URL:", "https://open.spotify.com/user/" + body.id);
                  console.log();
                  console.log(body);
                  res.cookie("display_name", body.display_name);
                  res.cookie("id", body.id);
                  res.cookie("email", body.email);
                  const storedSession = req.cookies
                     ? req.cookies["spotify_session_token"]
                     : null;
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
                     db("users")
                        .select("spotify_id")
                        .where("spotify_id", body.id)
                        .then((existingUser) => {
                           if (existingUser.length === 0) {
                              return db("users")
                                 .insert({
                                    spotify_id: body.id,
                                    access_token: access_token,
                                    refresh_token: refresh_token,
                                    token_expiry: expiry,
                                    session: storedSession,
                                 })
                                 .then(() => {
                                    console.log(`User ${body.id} created`);
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
                              console.log();
                              console.log(`User ${body.id} exists`);
                              db("users").where("spotify_id", body.id).update({
                                 access_token: access_token,
                                 refresh_token: refresh_token,
                                 session: storedSession,
                              });
                              console.log("Redirecting to merge page");
                              res.redirect(
                                 `http://localhost:3000/merge?token=${access_token}`
                              );
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
               }
               if (body === "User not registered in the Developer Dashboard") {
                  console.log("User not registered on developer dashboard");
                  return res.redirect("/error?dev_program_error");
               } else {
               }
            });
            // redirect back to user
         } else {
            // TODO break this to test invalid token
            res.redirect(
               "/#" +
                  querystring.stringify({
                     error: "invalid_token",
                  })
            );
         }
      });
   }
};
module.exports = callback_spotify;
