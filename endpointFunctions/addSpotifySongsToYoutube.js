const axios = require("axios");
const knex = require("knex");
const knexConfig = require("../knexfile.js");
const db = knex(knexConfig);
const index = async (req, res) => {
   console.log("addings songs to youtube");
   const playlist_id = req.query.playlistID;
   const spotify_session_token = req.query.spotify_session_token;
   const playlistName = req.query.playlistName;
   console.log("spotify_session_token", [spotify_session_token]);
   console.log("playlist_id", [playlist_id]);
   console.log("playlistName", [playlistName]);
   try {
      await db
         .select("*")
         .from("users")
         .where("spotify_session", spotify_session_token)
         .then(async (userRow) => {
            console.log("user", userRow.length);
            if (userRow.length > 0) {
               console.log("user exists");
               const user = userRow[0];
               const google_token = user.google_access_token;
               console.log("Google token", google_token);
               console.log("Creating Playlist Named:", playlistName);
               const ytNewPlaylistNameData = {
                  snippet: {
                     title: playlistName,
                  },
               };
               const ytNewPlaylistOptions = {
                  headers: {
                     Authorization: `Bearer ${google_token}`,
                  },
               };
               await axios
                  .post(
                     "https://www.googleapis.com/youtube/v3/playlists?part=id,snippet",
                     ytNewPlaylistNameData,
                     ytNewPlaylistOptions
                  )
                  .then(async (res) => {
                     console.log(`NEW PLAYLIST RES:`, res.data.id);
                     const newYoutubePlaylistID = res.data.id;
                     await axios
                        .get(
                           `http://localhost:8888/songs/spotify?playlistID=${playlist_id}&spotify_session_token=${spotify_session_token}`
                        )
                        .then((res) => {
                           const spotifySongsArray = res.data.Songs;
                           console.log("getting songs:", res.data.Songs);
                           spotifySongsArray.map(async (song) => {
                              console.log("Searching:", song);
                              await axios
                                 .get(`http://localhost:8888/search/youtube?${song}`)
                                 .then(async (res) => {
                                    const songID = res.data.ID;
                                    console.log("Song Id", songID);
                                    if (songID) {
                                       const ytNewPlaylistSongData = {
                                          snippet: {
                                             playlistId: newYoutubePlaylistID,
                                             resourceId: {
                                                kind: "youtube#video",
                                                videoId: songID,
                                             },
                                          },
                                       };
                                       await axios
                                          .post(
                                             "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
                                             ytNewPlaylistSongData,
                                             ytNewPlaylistOptions
                                          )
                                          .then(() => {})
                                          .catch((err) => {
                                             console.log("Error:", err.response);
                                          });
                                    }
                                 });
                           });
                        });
                  })
                  .catch((err) => console.log(err.data));
            }
         });
      //   res.redirect("https://www.youtube.com/playlist?list=" + newYoutubePlaylistID);
      res.status(200).json({
         Added_To_Youtube: true,
         link: "https://www.youtube.com/playlist?list=" + newYoutubePlaylistID,
      });
   } catch (error) {
      res.json({ Error: error });
   }
};
module.exports = index;
