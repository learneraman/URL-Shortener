const mongoose = require("mongoose");

async function connectDB(url) {
  let retries = 0;
  const maxRetries = 5;

  const connect = async () => {
    try {
      await mongoose.connect(url);
      console.log("✓ MongoDB connected:", mongoose.connection.host);

      mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));
      mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err.message));

    } catch (err) {
      retries++;
      console.error(`❌ DB connection attempt ${retries}/${maxRetries} failed:`, err.message);
      if (retries < maxRetries) {
        console.log("🔄 Retrying in 5 seconds...");
        setTimeout(connect, 5000);
      } else {
        console.error("❌ Could not connect to MongoDB. Exiting.");
        process.exit(1);
      }
    }
  };

  await connect();
}

module.exports = connectDB;
