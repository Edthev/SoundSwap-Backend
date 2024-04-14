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
   const state = generateRandomString(16);
   res.cookie(stateKey, state);

   // your application requests authorization
   const scope = "user-read-private user-read-email";
   //  TODO break the state(by changing a character) and to test the error response
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
   // your application requests refresh and access tokens
   // after checking the state parameter

   const code = req.query.code || null;
   const state = req.query.state || null;
   const storedState = req.cookies ? req.cookies[stateKey] : null;

   if (state === null || state !== storedState) {
      res.redirect(
         "/#" +
            querystring.stringify({
               error: "state_mismatch",
            })
      );
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
            const expiration = now.valueOf() + expiry - 200;

            const options = {
               url: "https://api.spotify.com/v1/me",
               headers: { Authorization: "Bearer " + access_token },
               json: true,
            };

            // use the access token to access the Spotify Web API
            request.get(options, function (error, response, body) {
               console.log();
               console.log("Connection successful signed into:", body.email);
               console.log("URL:", "https://open.spotify.com/user/" + body.id);
               console.log();
               // console.log(body);

               // add user to database
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
                              session: generateRandomString(8),
                           })
                           .then(() => {
                              console.log(`User ${body.id} created`, true);
                           })
                           .catch((error) => {
                              console.error("Error inserting user data:", error);
                           });
                     } else {
                        console.log(`User ${body.id} exists`, false);
                        console.log();
                        return db("users").where("spotify_id", body.id).update({
                           access_token: access_token,
                           refresh_token: refresh_token,
                        });
                     }
                  });
            });
            // redirect back to user
            res.redirect("http://localhost:3000/login");
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

app.get("/refresh_token", function (req, res) {
   const refresh_token = req.query.refresh_token;
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
      if (!error && response.statusCode === 200) {
         const access_token = body.access_token,
            refresh_token = body.refresh_token;
         res.send({
            access_token: access_token,
            refresh_token: refresh_token,
         });
      }
   });
});

console.log("Listening on http://localhost:" + PORT);
app.listen(PORT);
