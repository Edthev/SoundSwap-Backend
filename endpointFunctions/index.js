const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

// TODO fix index
const index = async (req, res) => {
   console.log("Connected to /");
   const spotify_storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
   const google_storedSession = req.cookies ? req.cookies["google_session_token"] : null;
   res.status(200).json({ Signed_In_Spotify: true, Spotify_Session: spotify_storedSession });
};
module.exports = index;
