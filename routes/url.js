const express = require("express");
const router = express.Router();

const { createShortUrl, getShortUrl,getallShortUrl, deleteShortUrl, getUrlAnalytics} = require("../controllers/url");

router.post("/", createShortUrl);
router.get("/", getallShortUrl);
router.get("/:shortId", getShortUrl);
router.get("/analytics/:shortId", getUrlAnalytics);
router.delete("/:shortId", deleteShortUrl);



module.exports = router;