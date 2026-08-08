const express = require("express");
const router = express.Router();
const publicChatHandler = require("../../api/public-chat");

router.post("/", (req, res) => {
  return publicChatHandler(req, res);
});

module.exports = router;
