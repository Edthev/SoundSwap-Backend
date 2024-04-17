const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

// TODO fix index
const getUserData = async (req, res) => {
   console.log('Connected to "/" getting user data');
   const spotify_storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
   const google_storedSession = req.cookies ? req.cookies["google_session_token"] : null;
   try {
      console.log("Finding user in Database");
      const response = await db("users")
         .select("*")
         .where("spotify_id", "317ysrmblnahrkebehqlhnyq4eq");
      let token = response[0].spotify_access_token;
      console.log("Token length:", token.length);
      console.log("Token:", token.slice());
      try {
         async function fetchWebApi(endpoint, method, body) {
            console.log("Fetching Web Api");
            const res = await fetch(`https://api.spotif.com/v1/${endpoint}`, {
               headers: {
                  Authorization: `Bearer ${token}`,
               },
               method,
               body: JSON.stringify(body),
            });
            return await res.json();
         }
         async function getUserData() {
            console.log("Getting User Data");
            return (await fetchWebApi("me", "GET")).items;
         }
         const User_data = await getUserData();
         console.log("User_data", User_data);
         res.status(200).json({
            Signed_In_Spotify: true,
            Spotify_Session: spotify_storedSession,
            User_data: User_data,
         });
      } catch (err) {
         console.log("Couldnt fetch data");
         res.status(200).json({
            Err: "Couldnt fetch data",
            Error: err,
         });
      }
   } catch (err) {
      console.log(err, "error getting user");
      res.status(400).json({ Error: "Fetch Error", Error_Response: err.TypeError });
   }
};
module.exports = getUserData;
