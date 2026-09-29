require("dotenv").config();
//enviroment variables from the docker

if (
  !process.env.MONGO_URI ||
  !process.env.JWT_ACCESS_SECRET ||
  !process.env.JWT_REFRESH_SECRET
) {
  throw new Error("Environment variable not there");
}

const config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
};

module.exports = config;
