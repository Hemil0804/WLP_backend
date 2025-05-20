const express = require("express");
const router = express.Router();
const cityController = require("../../controllers/user/city.controller");
const { adminAuth } = require('../../middleware/verifyToken');


router.post("/list", adminAuth, cityController.cityList);

module.exports = router;