const express = require("express");
const router = express.Router();
const countryController = require("../../controllers/user/country.controller");


router.post("/list", countryController.listCountry);

module.exports = router;