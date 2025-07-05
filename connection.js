const mongoose = require("mongoose");

async function connectDB(url) {
    await mongoose
        .connect(url)
        .then(() => console.log("connected db"))
        .catch((err) => console.log("error occurred", err));
}

module.exports = connectDB;
