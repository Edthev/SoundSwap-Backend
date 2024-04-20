const error = (req, res) => {
   console.log("Error Page:", Object.keys(req.query));
   res.status(400).json({ Error: Object.keys(req.query)[0] || "General Error" });
};
module.exports = error;
