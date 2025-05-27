require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3001;

const path = require("path");
app.arguments(express.static(path.join(__dirname, "..", "pulic")));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
