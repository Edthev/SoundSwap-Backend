const express = require("express");
const request = require("request");
const crypto = require("crypto");
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const knex = require("knex");
const knexConfig = require("./knexfile.js");
const db = knex(knexConfig);
require("dotenv").config();

const PORT = process.env.PORT || 8889;
const client_id = process.env.CLIENT_ID || null;
const client_secret = process.env.CLIENT_SECRET || null;
const redirect_uri = process.env.FRONT_END_URL;
const stateKey = "spotify_auth_state";
const app = express();

const generateRandomString = (length) => {
   return crypto.randomBytes(60).toString("hex").slice(0, length);
};
app.use(express.static("./publicCopy")).use(cors()).use(cookieParser());

app.get("/login", function (req, res) {
   console.log("Connected to /login");
   const state = generateRandomString(16);
   res.cookie(stateKey, state);
   res.cookie("session_token", state);

   // your application requests authorization
   const scope =
      "user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public";
   res.redirect(
      "https://accounts.spotify.com/authorize?" +
         querystring.stringify({
            response_type: "code",
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
         })
   );
});

app.get("/callback", function (req, res) {
   console.log("Connected to /callback");
   // your application requests refresh and access tokens
   // after checking the state parameter

   const code = req.query.code || null;
   const state = req.query.state || null;
   const storedState = req.cookies ? req.cookies[stateKey] : null;
   if (state === null || state !== storedState) {
      res.json({ Error: "State Mismatch" });
   } else {
      res.clearCookie(stateKey);

      const authOptions = {
         url: "https://accounts.spotify.com/api/token",
         form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code",
         },
         headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization:
               "Basic " + new Buffer.from(client_id + ":" + client_secret).toString("base64"),
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
                  const storedSession = req.cookies ? req.cookies["session_token"] : null;
                  if (storedSession !== null && storedSession && storedSession.length === 16) {
                     console.log("Connected Session and User Session Found");
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
                                 .catch((error) => {
                                    console.error("Error inserting user data:", error);
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
                     console.log("Error adding users to database (possibly undefined):", err);
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
});

const checkSessionMiddleware = async (req, res, next) => {
   const storedSession = req.cookies ? req.cookies["session_token"] : null;
   try {
      let user_session = await db("users").select("session").where("session", storedSession);
      user_session = user_session[0].session;
      if (user_session === storedSession) {
         console.log("checkSessionMiddleware: User Session Valid");
      } else {
         console.log("User Session invalid. Redirecting to /login");
         res.redirect("http://localhost:8888/login");
      }
   } catch (err) {
      console.log("Session Storage Error. Redirecting to /login");
      res.redirect("http://localhost:8888/login");
   }

   next();
};

app.get("/", async (req, res) => {
   console.log("Connected to /");
   const storedSession = req.cookies ? req.cookies["session_token"] : null;
   try {
      const user_session = await db("users").select("*").where("session", storedSession);
      // user_session = user_session[0].session;
      console.log("Same Session:", storedSession == user_session);
      // const access_token = db("users").select("*").where("session", storedSession);
      console.log("test1");
      if (user_session == storedSession) {
         console.log("test");
         // const token = user_session.access_token;
         // console.log("token.length", token.length);

         async function fetchProfile(token) {
            const result = await fetch("https://api.spotify.com/v1/me", {
               method: "GET",
               headers: { Authorization: `Bearer ${token}` },
            });

            return await result;
         }
      }
      console.log("test2");
   } catch (err) {
      console.log("Error finding user with stored session");
   }
   res.status(200).json({ Signed_In_Spotify: true, session: storedSession });
});

app.get("/error", (req, res) => {
   console.log("err page:", Object.keys(req.query));
   res.status(200).json({ Error: Object.keys(req.query) });
});

app.get("/refresh_token", checkSessionMiddleware, async (req, res) => {
   console.log("Connected to /refresh_token");

   const storedSession = req.cookies ? req.cookies["session_token"] : null;
   let refresh_token;
   let old_token;
   try {
      await db
         .select("refresh_token")
         .from("users")
         .where("session", storedSession)
         .then((rows) => {
            if (rows.length > 0) {
               refresh_token = rows[0].refresh_token;
               old_token = refresh_token;
            } else {
               console.log("User not found with session");
            }
         })
         .catch((error) => {
            console.error("Error fetching user:", error);
         });
   } catch (err) {
      console.error("database error:", err);
   }
   const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
         "content-type": "application/x-www-form-urlencoded",
         Authorization:
            "Basic " + new Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      form: {
         grant_type: "refresh_token",
         refresh_token: refresh_token,
      },
      json: true,
   };
   request.post(authOptions, function (error, response, body) {
      try {
         if (!error && response.statusCode === 200) {
            const new_access_token = body.access_token,
               new_refresh_token = body.refresh_token;
            console.log("refresh_token NOT same:", old_token !== new_refresh_token);
            return db("users").where("session", storedSession).update({
               access_token: new_access_token,
               refresh_token: new_refresh_token,
            });
         }
      } catch (err) {
         console.error("New Token Request Error:", err);
      }
      console.log("out");
   });
});

app.get("/playlist", async (req, res) => {
   console.log("Connected to /playlist");
   const storedSession = req.cookies ? req.cookies["session_token"] : null;
   try {
      await db
         .select("*")
         .from("users")
         .where("session", storedSession)
         .then(async (userRow) => {
            if (userRow.length > 0) {
               const user = userRow[0];
               const token = user.access_token;

               try {
                  async function fetchWebApi(endpoint, method, body) {
                     const res = await fetch(`https://api.spotify.com/${endpoint}`, {
                        headers: {
                           Authorization: `Bearer ${token}`,
                        },
                        method,
                        body: JSON.stringify(body),
                     });
                     if (res === "User not r") {
                        return res;
                     }
                     return await res.json();
                  }
                  async function getAllPlaylists(index = 0) {
                     // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
                     return (
                        await fetchWebApi(
                           "v1/me/top/tracks?time_range=long_term&limit=5",
                           "GET"
                        )
                     ).items;
                  }
                  console.log("Getting Playlists...");
                  let myPlaylists = await getAllPlaylists();
                  console.log("...Done");

                  try {
                     console.log(
                        "myPlaylists:",
                        myPlaylists
                        // myPlaylists.map((playlist) => playlist.name)
                     );
                  } catch (err) {
                     console.log("Mapping Playlist Error:", err);
                  }
                  if (!myPlaylists) {
                     console.log("Error getting playlists");
                     res.redirect("/error?Playlist_fetch_error");
                  } else {
                     res.status(200).json({
                        Signed_In: true,
                        playlist: myPlaylists,
                        User_Found: token ? true : false,
                     });
                  }
               } catch (err) {
                  console.log("Couldn't connect to get playlists Err:", err);
               }
            } else {
               console.log("User not found with same session");
               res.redirect("/login");
            }
         })
         .catch((error) => {
            console.error("Error fetching user:", error);
         });
   } catch (err) {
      console.log("Error:", err);
      res.status(500).send("internal server error");
   }
});

console.log("Listening on http://localhost:" + PORT);
app.listen(PORT);
