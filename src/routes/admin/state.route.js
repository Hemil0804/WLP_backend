const express = require("express");
const router = express.Router();
const stateController = require("../../controllers/user/state.controller");
const { adminAuth } = require('../../middleware/verifyToken');


router.post("/list", adminAuth, stateController.stateList);

module.exports = router;