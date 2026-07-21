const express = require("express");
const incomeGoalController = require("../controllers/incomeGoalController");

const router = express.Router();

router.post("/preview", incomeGoalController.preview);
router.post("/", incomeGoalController.create);
router.get("/", incomeGoalController.list);
router.get("/:id", incomeGoalController.get);

module.exports = router;
