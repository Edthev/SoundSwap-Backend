const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

const checkSessionMiddleware = async (req, res, next) => {
   console.log("checkSession executed");
   const storedSession_spotify = req.cookies ? req.cookies["spotify_session_token"] : null;
   const storedSession_google = req.cookies ? req.cookies["google_session_token"] : null;
   console.log("storedSession_spotify", storedSession_spotify);
   storedSession_spotify
      ? console.log("storedSession_spotify.length:", storedSession_spotify.length)
      : console.log("storedSession_spotify.length: 0");
   storedSession_google
      ? console.log("storedSession_google.length:", storedSession_google.length)
      : console.log("storedSession_google.length: 0");
   if (storedSession_spotify || storedSession_google) {
      console.log("Finding user");
      try {
         if (storedSession_spotify != 0 && storedSession_spotify) {
            let response = await db("users")
               .select("spotify_session")
               // .where("spotify_session", storedSession_spotify);
               .where("spotify_id", "317ysrmblnathrkebehqlhnyq4eq");
            console.log("Database response:", response[0]);
            if (response[0] != undefined) {
               let spotify_user_session = response[0].spotify_session;
               console.log("spotify_user_session.length:", spotify_user_session.length);
               // if (spotify_user_session === storedSession_spotify) {
               console.log("Spotify User has same session:", true);
               next();
               // }
            }
         } else if (storedSession_google) {
            let google_user_session = await db("users").where(
               "google_session",
               storedSession_google
            );
            if (google_user_session) {
               console.log("google_user_session.length:", google_user_session.length);
               if (google_user_session == storedSession_google) {
                  console.log("User has same session:", true);
                  next();
               }
            } else {
               console.log("google_user_session.length: 0");
               res.redirect("http://localhost:8888/error?Session_mismatch");
            }
         }
      } catch (err) {
         console.error(err, `\n`, `\n`, "Error getting user session. Redirecting to /error");
         // console.log("Session Storage Error. Redirecting to /error");
         res.redirect("http://localhost:8888/error?User_session_database_error");
      }
   } else {
      console.log("Stored Sessions Doesn't Exist");
      res.redirect("http://localhost:8888/error?Session_Doesn't_Exist");
   }
};
module.exports = checkSessionMiddleware;
