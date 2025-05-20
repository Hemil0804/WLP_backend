const express = require("express");
const router = express.Router();
const stateController = require("../../controllers/user/state.controller");


router.post("/list", stateController.stateList);
 
module.exports = router;