const YoutubeMusicApi = require("youtube-music-api");
const api = new YoutubeMusicApi();
const axios = import("axios");

var https = require("follow-redirects").https;
var fs = require("fs");

const getVideoID = async (req, res) => {
   console.log("searching video");
   const songName = Object.keys(req.query)[0];
   //    const videoID = JSON.stringify(req.query);
   console.log("songName", songName);
   try {
      console.log("Searching song...");
      const getSongIds = async (songName) => {
         console.log(`Fetching ${songName}...`);
         api.initalize().then((info) => {
            api.search(songName).then(async (result) => {
               console.log(
                  // "result",
                  // result,
                  "Song Search Result Name:",
                  [result.content[0].name],
                  "https://www.youtube.com/watch?v=" + result.content[0].videoId
               );
               // return result.content[0].videoId
               res.json({
                  Song_Name: songName,
                  Name: result.content[0].name,
                  ID: result.content[0].videoId,
                  Link: "https://www.youtube.com/watch?v=" + result.content[0].videoId,
                  PlaylistLink:
                     "https://www.youtube.com/playlist?list=PLGC5MgMeIoTZuEtiMJuXE_GdMYUsqzyu7",
               });
               return result.content;
            });
         });
      };
      const addToYoutubePlaylist = async (songID) => {
         const google_api_key =
            "ya29.a0Ad52N3-fMix_xTYQO5OVHKd7WCqo6XPssVTVWr-Wmwsx5YV3_hzjsAFoF7-kLgrflh8o_WYOaMlsJwcLvc8IythjcGMOdKzILRMrLT8tGLw90Xyoip-iotdboPd-akxhEfDKdaxeQEDYok9FUEhu5VSBnaD_8pHedpmJaCgYKAWASARMSFQHGX2MigC4ZulPGyrYEyVXv0ZEelA0171";

         var options = {
            method: "POST",
            hostname: "www.googleapis.com",
            path: "/youtube/v3/playlistItems?part=snippet",
            headers: {
               Authorization:
                  "Bearer ya29.a0Ad52N3-fMix_xTYQO5OVHKd7WCqo6XPssVTVWr-Wmwsx5YV3_hzjsAFoF7-kLgrflh8o_WYOaMlsJwcLvc8IythjcGMOdKzILRMrLT8tGLw90Xyoip-iotdboPd-akxhEfDKdaxeQEDYok9FUEhu5VSBnaD_8pHedpmJaCgYKAWASARMSFQHGX2MigC4ZulPGyrYEyVXv0ZEelA0171",
               "Content-Type": "application/json",
            },
            maxRedirects: 20,
         };

         var req = await https.request(options, function (res) {
            var chunks = [];

            res.on("data", function (chunk) {
               chunks.push(chunk);
            });

            res.on("end", function (chunk) {
               var body = Buffer.concat(chunks);
               console.log(body.toString());
            });

            res.on("error", function (error) {
               console.error(error);
            });
         });

         var postData = JSON.stringify({
            snippet: {
               playlistId: "PLGC5MgMeIoTZuEtiMJuXE_GdMYUsqzyu7",
               resourceId: {
                  kind: "youtube#video",
                  videoId: "J-7knuczw2E", //{ songID }, //
               },
            },
         });

         req.write(postData);

         req.end();
      };
      const id = await getSongIds(songName);
      // addToYoutubePlaylist(getSongIds(id));
   } catch (err) {
      console.log(err, "Error fetching YTmusic api");
   }
};
module.exports = getVideoID;
