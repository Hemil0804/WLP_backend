const express = require('express');
const router = express.Router();
const questionValidation = require('../../validations/admin/question.validation');
const questionController = require('../../controllers/admin/questions.controller');
const { adminAuth } = require('../../middleware/verifyToken');
const { validatorFunction } = require('../../helpers/responseHelper');
const { validMulterUploadMiddleware, uploadImage } = require("../../middleware/uploadImage")
router.get('/', (req, res) => res.send('Welcome to admin question route'));

router.post('/add-question', adminAuth, questionController.addEditQuestions);
router.post('/list-question', adminAuth, questionController.listQuestion);
router.post('/view-question', adminAuth, questionController.viewQuestion);
// router.post('/status-change', adminAuth, questionController.questionStatusChange);
router.post('/delete-question', adminAuth, questionController.deleteQuestion);

// router.post('/add-multiple-questions', adminAuth, questionController.addMultipleQuestions);
// router.post('/import-questions', adminAuth, validMulterUploadMiddleware(uploadImage), questionController.importQuestions);
// router.post('/download-sample-file', adminAuth, questionController.downloadQuestionSampleFile);

module.exports = router;

