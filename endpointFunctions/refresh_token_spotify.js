const refresh_token_spotify = async (req, res) => {
   console.log("Connected to /refresh_token");

   const storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
   let refresh_token;
   let old_token;
   try {
      await db
         .select("refresh_token")
         .from("users")
         .where("session", storedSession)
         .then((rows) => {
            if (rows.length > 0) {
               refresh_token = rows[0].refresh_token;
               old_token = refresh_token;
            } else {
               console.log("User not found with session");
            }
         })
         .catch((error) => {
            console.error("Error fetching user:", error);
         });
   } catch (err) {
      console.error(err.response.data.error, `\n`, `\n`, "database error");
      // console.error("database error:", err);
   }
   const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
         "content-type": "application/x-www-form-urlencoded",
         Authorization:
            "Basic " +
            new Buffer.from(spotify_client_id + ":" + spotify_client_secret).toString(
               "base64"
            ),
      },
      form: {
         grant_type: "refresh_token",
         refresh_token: refresh_token,
      },
      json: true,
   };
   request.post(authOptions, function (error, response, body) {
      try {
         if (!error && response.statusCode === 200) {
            const new_access_token = body.access_token,
               new_refresh_token = body.refresh_token;
            console.log("refresh_token NOT same:", old_token !== new_refresh_token);
            return db("users").where("session", storedSession).update({
               access_token: new_access_token,
               refresh_token: new_refresh_token,
            });
         }
      } catch (err) {
         console.error(err.response.data.error, `\n`, `\n`, "Failed to get refresh token");
         // console.error("New Token Request Error:", err);
      }
      console.log("out");
   });
};
module.exports = refresh_token_spotify;
