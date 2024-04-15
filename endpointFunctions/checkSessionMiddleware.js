const checkSessionMiddleware = async (req, res, next) => {
   console.log("checkSession executed");
   const storedSession = req.cookies ? req.cookies["spotify_session_token"] : null;
   console.log("storedSession.length:", storedSession.length);
   try {
      let user_session = await db("users").select("*").where("session", storedSession);
      // user_session = user_session[0].session;
      console.log("user_session.length:", user_session.length);
      if (user_session === storedSession) {
         console.log("User has same session:", true);
         next();
      } else {
         console.log("User Session invalid. Redirecting to /error");
         res.redirect("http://localhost:8888/error?Session_mismatch");
      }
   } catch (err) {
      console.error(
         err.response.data.error,
         `\n`,
         `\n`,
         "Session Storage Error. Redirecting to /error"
      );
      // console.log("Session Storage Error. Redirecting to /error");
      res.redirect("http://localhost:8888/error?User_session_database_error");
   }
};
module.exports = checkSessionMiddleware;
