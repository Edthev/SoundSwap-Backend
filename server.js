const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
require("dotenv").config();

//!
const PORT = process.env.PORT || 8080;
const client_id = process.env.C_ID || "err";
const client_secret = process.env.C_SECRET || "err";

//!middleware
app.use(cors());
app.use(express.json());

//! basic routes for the APIs
app.use("/", (_req, res) => {
   res.status(200).json({
      Project: "SoundSwap",
      Description: "Swap Playlists Across Platforms!",
      Creator: "Edward Vargas",
      Response: "1",
      ID: client_id,
      Secret: client_secret,
   });
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
