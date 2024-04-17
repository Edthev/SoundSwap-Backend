const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);
// const getSongIds = require("./getSongIds");

// TODO fix index
const getSpotifyPlaylists = async (req, res) => {
   console.log('Connected to "/" getting spotify playlists function');
   const playlist_id = req.params.playlistID;
   console.log("playlist_id", playlist_id);
   const spotify_storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
   try {
      const deleteID = "317ysrmblnathrkebehqlhnyq4eq";
      console.log("Finding user in Database");
      const response = await db("users").select("*").where("spotify_id", deleteID);
      let token = response[0].spotify_access_token;
      console.log("Token Length:", token.length);
      console.log("User ID:", response[0].id);

      async function fetchWebApi(endpoint, method, body) {
         console.log("Fetching Web Api");
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
         console.log("response:", [response.statusText]);
         return await response.json();
      }
      async function getPlaylistSongs() {
         console.log("Getting Playlist Songs Data");
         return (await fetchWebApi("v1/me/", "GET")).items;
      }
      const songs = await getPlaylistSongs();
      console.log("Amount of Songs:", songs ? songs.length : null);
      const songNames = songs.map((songTrack) => {
         return songTrack.track.name;
      });
      console.log("...done");
      res.status(200).json({
         Getting_Playlist_Songs: true,
         Spotify_Session: spotify_storedSession,
         Songs: songs ? songNames : "none",
      });
   } catch (err) {
      console.log(err, "error getting user");
      res.status(400).json({ Error: "Fetch Error", Error_Response: err.TypeError });
   }
};
module.exports = getSpotifyPlaylists;
