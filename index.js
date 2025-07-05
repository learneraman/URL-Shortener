const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = 3000;
app.listen(PORT, () => console.log("Server started at port : " + `${PORT}`));

const connectDB = require("./connection");
connectDB("mongodb://localhost:27017/ShortURL");

// importing routes
const shortURL = require("./routes/url");
app.use("/api/shorturl", shortURL);

// setting up view engine
app.set("view engine", "ejs");
const path = require("path"); 
app.set("views", path.resolve("./views"));
const URL = require("./models/url"); 

app.get("/urlhistory",async (req, res) => {
  const urls = await URL.find({});
  return res.render("urlhistory",{urls});
});

const staticRoute = require("./routes/static");
app.use("/", staticRoute);


