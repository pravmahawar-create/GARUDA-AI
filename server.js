const app = require("./src/app");
const connectDB = require("./src/database/db");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

(async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`?? GARUDA AI running on http://localhost:${PORT}`);
    });
})();
