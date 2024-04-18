const knex = require("knex");
const knexConfig = require("../knexfile.js");
const db = knex(knexConfig);
const axios = require("axios");
const spotify_playlist = async (req, res) => {
   console.log("Connected to /playlists/spotify");

   const storedSession = req.query.spotify_session_token;
   console.log("storedSession", [storedSession]);
   try {
      await db
         .select("*")
         .from("users")
         .where("spotify_session", storedSession)
         .then(async (userRow) => {
            if (userRow.length > 0) {
               console.log("user exists");
               const user = userRow[0];
               const token = user.spotify_access_token;
               console.log("token", token);
               const options = {
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               };
               console.log("Getting Playlists...");
               await axios
                  .get(`https://api.spotify.com/v1/me/playlists?offset=0&limit=50`, options)
                  .then((apiRes) => {
                     console.log("...Done");
                     const myPlaylists = apiRes.data.items;
                     const myPlaylistsName = myPlaylists.map((playlist) => {
                        console.log("apiRes", playlist.name);
                        return playlist;
                     });
                     let all = apiRes;
                     res.status(200).json({
                        Signed_In: true,
                        playlists: myPlaylistsName,
                        // test: myPlaylists1,
                        // all: all,
                        User_Found: token ? true : false,
                     });
                  });
            } else {
               console.log("User not found with same session");
               res.redirect("/error?User_not_found");
            }
         })
         .catch((err) => {
            console.error("Error fetching user:", err);
         });
   } catch (err) {
      console.error(err, `\n`, `\n`, "Internal server error");
      // console.error("Internal server error:", err);
      res.status(500).send("internal server error", err);
   }
};
module.exports = spotify_playlist;
