// const express = require("express");
// const app = express();
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config();

// //!
// const PORT = process.env.PORT || 8080;
// const client_id = process.env.C_ID || "err";
// const client_secret = process.env.C_SECRET || "err";
// const redirect_url = process.env.REDIRECT_URL || "err";

// //!middleware
// app.use(cors());
// app.use(express.json());

// //! basic routes for the APIs
// app.use("/", (_req, res) => {
//    res.status(200).json({
//       Project: "SoundSwap",
//       Description: "Swap Playlists Across Platforms!",
//       Creator: "Edward Vargas",
//       ID: client_id,
//       Secret: client_secret,
//       Callback: redirect_url,
//    });
// });

// app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

var express = require("express");
var request = require("request");
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
require("dotenv").config();

var PORT = process.env.PORT || 8080;
var client_id = process.env.C_ID;
var client_secret = process.env.C_SECRET;
var redirect_uri = process.env.REDIRECT_URL;

var stateKey = "spotify_auth_state";

var app = express();

app.use(express.static(__dirname + "/public"))
   .use(cors())
   .use(cookieParser());

app.get("/login", function (req, res) {
   res.cookie(stateKey);

   // your application requests authorization
   var scope =
      "user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-private user-read-playback-state playlist-modify-public";
   res.redirect(
      "https://accounts.spotify.com/authorize?" +
         querystring.stringify({
            response_type: "code",
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
         })
   );
});

app.get("/callback", function (req, res) {
   // your application requests refresh and access tokens
   // after checking the state parameter
   console.log(req.query);
   var code = req.query.code || null;
   // TODO fix protection against attacks such as cross-site request forgery
   /*
   //    if (state === null || state !== storedState) {
   //       res.redirect(
   //          "/#" +
   //             querystring.stringify({
   //                error: "state_mismatch",
   //             })
   //       );
   //    } else {
    */
   var authOptions = {
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
         var access_token = body.access_token,
            refresh_token = body.refresh_token;

         var options = {
            url: "https://api.spotify.com/v1/me",
            headers: { Authorization: "Bearer " + access_token },
            json: true,
         };

         // use the access token to access the Spotify Web API
         request.get(options, function (error, response, body) {
            console.log(body);
         });

         // we can also pass the token to the browser to make requests from there
         res.redirect(
            "/#" +
               querystring.stringify({
                  access_token: access_token,
                  refresh_token: refresh_token,
               })
         );
      } else {
         res.redirect(
            "/#" +
               querystring.stringify({
                  error: "invalid_token",
               })
         );
      }
   });
   //    }
});

app.get("/refresh_token", function (req, res) {
   var refresh_token = req.query.refresh_token;
   var authOptions = {
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
         var access_token = body.access_token,
            refresh_token = body.refresh_token;
         res.send({
            access_token: access_token,
            refresh_token: refresh_token,
         });
      }
   });
});

console.log("Listening on", PORT);
app.listen(PORT);
