const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const googleLogin = require("./endpointFunctions/login_google");
const loginSpotify = require("./endpointFunctions/login_spotify");
const callbackSpotify = require("./endpointFunctions/callback_spotify");
const callbackGoogle = require("./endpointFunctions/callback_google");
const checkSessionMiddleware = require("./endpointFunctions/checkSessionMiddleware");
const index = require("./endpointFunctions/index");
const getUserData_spotify = require("./endpointFunctions/getUserData_spotify");
const error = require("./endpointFunctions/error");
const refresh_token_spotify = require("./endpointFunctions/refresh_token_spotify");
const createYoutubePlaylist = require("./endpointFunctions/playlist_google");
const getSpotifyPlaylistSongs = require("./endpointFunctions/getSpotifyPlaylistSongs");
const searchYoutubeIDs = require("./endpointFunctions/searchYoutubeId");
const playlist_spotify = require("./endpointFunctions/playlist_spotify");
const addSpotifySongsToYoutube = require("./endpointFunctions/addSpotifySongsToYoutube");

const PORT = process.env.PORT || 8888;

const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET || null;
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID || null;
const spotify_redirect_uri = process.env.SPOTIFY_CALLBACK_URL;
const spotify_stateKey = "spotify_auth_state";

const app = express();
// TODO remove this static webpage
app.use(express.static("./publicCopy")).use(cors()).use(cookieParser());

// app.get("/", checkSessionMiddleware, index);
// app.get("/", checkSessionMiddleware, getUserData_spotify);
app.get("/", getSpotifyPlaylistSongs); /*(req, res) => {
   res.json({ Creator: "Edward", Welcome: "SoundSwap" });
});*/
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
// app.get("/playlist", spotify_playlists);
app.get("playlists/spotify", playlist_spotify);
app.get("/songs/spotify", getSpotifyPlaylistSongs);
app.get("/songs/youtube", addSpotifySongsToYoutube);
app.get("/playlist", createYoutubePlaylist);
// app.get("/playlist/spotify/songs/:playlistID", getSpotifyPlaylistSongs);
// app.get("/playlist/youtube/add?:playlistID?VideoID", getSpotifyPlaylistSongs);

app.get("/search/youtube?:videoName", searchYoutubeIDs);

// TODO update pathing
app.get("/playlists/spotify", playlist_spotify);
// app.get("/playlists/create/google", getSpotifyPlaylistSongs);

console.log("Listening on http://localhost:" + PORT);
app.listen(PORT);

// TODO TOP PRIORiTY: use selected song and send a request to backend to get songs (limit to 20 for now) call the yt music api with those names and get the result of the ids then add those ids to the google playlist after making one also grab the playlist name so they can be the same
// for listing
const google_playlist_url = "https://www.googleapis.com/youtube/v3/playlists";
const optionsList = {
   part: "snippet",
   mine: true,
   maxResults: 5,
};
// insert creates a new playlist
/*
new scopes to add:
Scope
https://www.googleapis.com/auth/youtubepartner
https://www.googleapis.com/auth/youtube
https://www.googleapis.com/auth/youtube.force-ssl

*/
const optionsInsert = {
   part: "snippet",
   mine: true,
   maxResults: 5,
};

// PlaylistItems: insert
