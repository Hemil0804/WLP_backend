const express = require('express');
const router = express.Router();
const pollTakerController = require('../../controllers/admin/polltaker_management/polltaker.controller');
const verifyToken = require('../../middleware/verifyToken');

router.post('/view-polltaker', verifyToken.adminAuth, pollTakerController.view);
router.post('/list-polltaker', verifyToken.adminAuth, pollTakerController.list);
router.post('/update-status', verifyToken.adminAuth, pollTakerController.updateStatus);
router.post('/delete-polltaker', verifyToken.adminAuth, pollTakerController.delete);

module.exports = router;