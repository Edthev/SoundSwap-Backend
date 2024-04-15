export default function (req, res) {
   const refresh_token = req.query.refresh_token;
   const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
         "content-type": "application/x-www-form-urlencoded",
         Authorization:
            "Basic " + new Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      form: {
         grant_type: "refresh_token",
         refresh_token: refresh_token,
      },
      json: true,
   };

   request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
         const access_token = body.access_token,
            refresh_token = body.refresh_token;
         res.send({
            access_token: access_token,
            refresh_token: refresh_token,
         });
      }
   });
}
