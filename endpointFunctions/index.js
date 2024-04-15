const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

// TODO fix index
const index = async (req, res) => {
   console.log("Connected to /");
   const storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
   res.status(200).json({ Signed_In_Spotify: true, session: storedSession });
};
module.exports = index;
