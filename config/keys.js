require("dotenv").config();
module.exports = {
  mongoURI: process.env.DB_PROD,
  jwtSecret: process.env.JWT_SECRET,
};
