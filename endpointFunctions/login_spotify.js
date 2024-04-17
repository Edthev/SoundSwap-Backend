const crypto = require("crypto");
require("dotenv").config();
const querystring = require("querystring");

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID || null;
const spotify_redirect_uri = process.env.SPOTIFY_CALLBACK_URL;

// TODO change endpoint path to /login/spotify
const loginSpotify = (req, res) => {
   console.log("Connected to /login");

   const generateRandomString = (length) => {
      return crypto.randomBytes(60).toString("hex").slice(0, length);
   };
   const state = generateRandomString(16);
   const spotify_stateKey = "spotify_auth_state";
   res.cookie(spotify_stateKey, state);

   res.cookie("spotify_session_token", state);
   console.log("Spotify session created");

   const scope =
      "user-read-private user-read-email playlist-read-private playlist-modify-private playlist-modify-public";
   console.log("Redirecting to Spotify for auth token");
   res.redirect(
      "https://accounts.spotify.com/authorize?" +
         querystring.stringify({
            response_type: "code",
            client_id: spotify_client_id,
            scope: scope,
            redirect_uri: spotify_redirect_uri,
            state: state,
         })
   );
};
module.exports = loginSpotify;
