const express = require("express");
const router = express.Router();
const countryController = require("../../controllers/user/country.controller");
const { adminAuth } = require('../../middleware/verifyToken');


router.post("/list",adminAuth, countryController.listCountry);

module.exports = router;