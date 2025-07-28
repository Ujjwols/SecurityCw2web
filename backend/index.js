// Load the correct .env file based on NODE_ENV
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

const connectDB = require("./db/db");
const app = require("./app");

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running in ${env} mode on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(`MongoDB connection failed: ${err}`);
  });
