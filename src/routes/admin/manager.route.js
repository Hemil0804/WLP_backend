const express = require('express');
const router = express.Router();
const managerController = require('../../controllers/admin/manager_management/manager.controller');
const verifyToken = require('../../middleware/verifyToken');

router.post('/assign-contacts', verifyToken.adminAuth, managerController.assignContacts);
router.post('/get-manager-preference', verifyToken.adminAuth, managerController.getManagerPreference);
router.post('/view', verifyToken.adminAuth, managerController.view);
router.post('/list', verifyToken.adminAuth, managerController.list);
router.post('/all-manager-list', verifyToken.adminAuth, managerController.allManagerList);
router.post('/update-status', verifyToken.adminAuth, managerController.updateStatus);
router.post('/delete', verifyToken.adminAuth, managerController.delete);

module.exports = router;