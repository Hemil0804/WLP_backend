const express = require("express");
const router = express.Router();
const cityController = require("../../controllers/user/city.controller");


router.post("/list", cityController.cityList);

module.exports = router;