const express = require('express');
const router = express.Router();
const surveyController = require('../../controllers/admin/survey_management/survey.controller');
const verifyToken = require('../../middleware/verifyToken');

router.post('/list', verifyToken.adminAuth, surveyController.list);
router.post('/view', verifyToken.adminAuth, surveyController.view);
router.post('/update-status', verifyToken.adminAuth, surveyController.updateStatus);
router.post('/view-submittedContact', verifyToken.adminAuth, surveyController.viewSubmitSurveyContact);
router.post('/delete', verifyToken.adminAuth, surveyController.delete);


module.exports = router;