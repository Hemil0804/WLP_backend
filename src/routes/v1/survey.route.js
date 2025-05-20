const express = require('express');
const router = express.Router();
const surveyController = require('../../controllers/user/survey.controller');
const { userAuth } = require('../../middleware/verifyToken');

router.post('/add-edit', userAuth, surveyController.addEdit);
router.post('/list', userAuth, surveyController.list);
router.post('/view', userAuth, surveyController.view);
router.post('/incompContact-submit', userAuth, surveyController.submitIncompleteSurveyContact);
router.post('/contact-submit', userAuth, surveyController.submitSurveyContact);
router.post('/view-submittedContact', userAuth, surveyController.viewSubmitSurveyContact);
router.post('/delete', userAuth, surveyController.delete);

module.exports = router;
