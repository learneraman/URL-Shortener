const express = require("express");
// const {nanoid} = require("nanoid");
const shortid = require("shortid"); // npm i shortid
const URL = require("../models/url"); // importing model

async function createShortUrl(req, res) {
  const body = req.body;
  // console.log(body);
 
  if (!body.url) return res.status(400).json({ error: "url is required" });
  
  let existing = await URL.findOne({originalUrl:body.url});
  if (existing) {
    // Return existing shortID if already present
    return res.render("home", { shortID: existing.shortId });
  }
  const shortID = shortid.generate();
  const url = await URL.create({
    shortId: shortID,
    originalUrl: body.url,
    visitHistory: [],
  });
  return res.render("home", { shortID });
  // return res.json(url.shortId);
}
async function getallShortUrl(req, res) {
  const urls = await URL.find();
  if (!urls) {
    return res.status(404).json({ error: "Short URL not found" });
  }
  return res.status(200).json(urls);
}
// redirect ShortID to original URL
// redirect karne ke liye DB(model) se data fetch karna hai aur fir url update karke redirect karna hai..
async function getShortUrl(req, res) {
  if (!req.params.shortId)
    return res.status(400).json({ error: "shortId is required" });
  const entry = await URL.findOneAndUpdate(
    { shortId: req.params.shortId },
    { $push: { visitHistory: { timestamp: Date.now() } } }
  );
  if (!entry) {
    return res.status(404).json({ error: "URL not found" });
  }
  return res.redirect(entry.originalUrl);
}
async function deleteShortUrl(req, res) {
    const { shortId } = req.params;
  if (!shortId)
    return res.status(400).json({ error: "shortId is required" });
  await URL.findOneAndDelete({ shortId });
  return res.status(200).json({ message: "URL deleted successfully" });
}
async function getUrlAnalytics(req, res) {
    const { shortId } = req.params;
    const url = await URL.findOne({ shortId });
    if (!url) {
      return res.status(404).json({ error: "URL not found" });
    }
    return res.status(200).json({ totalVisits: url.visitHistory.length, visitHistory: url.visitHistory });
}
// $push is used to add data in array , add current date in visitHistory according to URl visit

module.exports = {
  createShortUrl,
  getShortUrl,
  getallShortUrl,
  deleteShortUrl,
  getUrlAnalytics
};` `
