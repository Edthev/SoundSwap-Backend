// TODO receive proper format from frontend with correct verification
// TODO create playlists
const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);
const createYoutubePlaylist = async (req, res, next) => {
   const google_session = req.cookies["google_session_token"],
      spotify_session = req.cookies["spotify_session_token"];

   db("users").where(google_session, body.id);

   res.json({
      Google_Session: req.cookies["google_session_token"],
      Spotify_Session: req.cookies["spotify_session_token"],
   });
   next();
};
module.exports = createYoutubePlaylist;
