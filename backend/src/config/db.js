const mongoose = require("mongoose");
const config = require("./config");

const ConnectDB = async function () {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Database Connected");
  } catch (err) {
    console.error("Failed to start server error: ", err);
    process.exit(1);
  }
};

module.exports = ConnectDB;
