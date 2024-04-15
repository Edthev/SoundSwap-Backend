const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const googleLogin = require("./endpointFunctions/login_google");
const loginSpotify = require("./endpointFunctions/login_spotify");
const callbackSpotify = require("./endpointFunctions/callback_spotify");
const callbackGoogle = require("./endpointFunctions/callback_google");
const checkSessionMiddleware = require("./endpointFunctions/checkSessionMiddleware");
const index = require("./endpointFunctions/index");
const error = require("./endpointFunctions/error");
const spotify_playlists = require("./endpointFunctions/playlist_spotify");
const refresh_token_spotify = require("./endpointFunctions/refresh_token_spotify");

const PORT = process.env.PORT || 8888;

const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET || null;
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID || null;
const spotify_redirect_uri = process.env.SPOTIFY_CALLBACK_URL;
const spotify_stateKey = "spotify_auth_state";

const app = express();
// TODO remove this static webpage
app.use(express.static("./publicCopy")).use(cors()).use(cookieParser());

app.get("/", checkSessionMiddleware, index);
// TODO change frontend so this can be login_spotify
app.get("/login", loginSpotify);
app.get("/login_google", googleLogin);

// TODO change other code so this can be callback_spotify
app.get("/callback", callbackSpotify);
app.get("/google_callback", callbackGoogle);

app.get("/error", error);

// TODO change code so this is refresh_token_spotify
app.get("/refresh_token", checkSessionMiddleware, refresh_token_spotify);
// TODO change code so this is playlist_spotify
app.get("/playlist", spotify_playlists);

// TODO update pathing
app.get("/api/sessions/oauth/google", spotify_playlists);

console.log("Listening on http://localhost:" + PORT);
app.listen(PORT);
