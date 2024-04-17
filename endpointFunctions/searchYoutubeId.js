const YoutubeMusicApi = require("youtube-music-api");
const api = new YoutubeMusicApi();

const getVideoID = async (req, res) => {
   console.log("searching video");
   const songName = Object.keys(req.query)[0];
   //    const videoID = JSON.stringify(req.query);
   console.log("songName", songName);
   try {
      console.log("Searching song...");
      const getSongIds = async (songName) => {
         console.log(`Fetching ${songName}...`);
         await api.initalize().then((info) => {
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
               });
               //    return await result.content;
               return await result;
            });
         });
      };
      const addToYoutubePlaylist = async (songID) => {
         const api_key = "";
      };
      getSongIds(songName);
      // addToYoutubePlaylist(getSongIds(songName))
   } catch (err) {
      console.log(err, "Error fetching YTmusic api");
   }
};
module.exports = getVideoID;
