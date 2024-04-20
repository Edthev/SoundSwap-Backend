const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);
// const getSongIds = require("./getSongIds");

// TODO fix index
const getSpotifyPlaylists = async (req, res) => {
   console.log('Connected to "/playlists/spotify/songs" getting spotify playlist songs');
   const playlist_id = req.query.playlistID;
   const spotify_session_token = req.query.spotify_session_token;
   console.log("playlist_id", playlist_id);
   console.log("spotify_session_token", [spotify_session_token]);
   try {
      console.log("Finding user in Database");
      const response = await db("users")
         .select("*")
         .where("spotify_session", spotify_session_token);
      console.log("res:", response.length);
      let token = response[0].spotify_access_token;
      console.log("Token Length:", token.length);
      console.log("User ID:", response[0].id);

      async function fetchWebApi(endpoint, method, body) {
         console.log(`Fetching ${playlist_id}`);
         const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=10`,
            {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
               method,
               body: JSON.stringify(body),
            }
         );
         // console.log("response:", [response.statusText]);
         console.log("response:", [response]);
         return await response.json();
      }
      async function getPlaylistSongs() {
         console.log("Getting Playlist Songs Data");
         return (await fetchWebApi("v1/me/", "GET")).items;
      }
      const songs = await getPlaylistSongs();
      console.log("...done");
      console.log("Amount of Songs:", songs ? songs.length : songs);
      if (songs) {
         const songNames = songs.map((songTrack) => {
            return songTrack.track.name;
         });
         const songImages = songs.map((songTrack) => {
            return songTrack.track.name;
         });

         res.status(200).json({
            Getting_Playlist_Songs: true,
            Spotify_Session: spotify_session_token,
            Songs: songs ? songNames : "none",
         });
      }
   } catch (err) {
      console.log(err, "error getting user");
      res.status(400).json({ Error: "Fetch Error", Error_Response: err.TypeError });
   }
};
module.exports = getSpotifyPlaylists;
