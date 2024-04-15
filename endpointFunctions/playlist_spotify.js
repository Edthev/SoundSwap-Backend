const knex = require("knex");
const knexConfig = require("../knexfile.js");
const db = knex(knexConfig);
const spotify_playlist = async (req, res) => {
   console.log("Connected to /playlist");
   const storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
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
                     console.error(
                        err.response.data.error,
                        `\n`,
                        `\n`,
                        "Mapping Playlist Error"
                     );
                     // console.log("Mapping Playlist Error:", err);
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
                  console.error(
                     err.response.data.error,
                     `\n`,
                     `\n`,
                     "Couldn't connect to get playlists"
                  );
                  // console.log("Couldn't connect to get playlists Err:", err);
               }
            } else {
               console.log("User not found with same session");
               res.redirect("/login");
            }
         })
         .catch((err) => {
            console.error("Error fetching user:", err);
         });
   } catch (err) {
      console.error(err.response.data.error, `\n`, `\n`, "Internal server error");
      // console.error("Internal server error:", err);
      res.status(500).send("internal server error");
   }
};
module.exports = spotify_playlist;
