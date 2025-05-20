const express = require('express');
const router = express.Router();
const managerController = require('../../controllers/user/team_owner/manager.controller');
const { userAuth } = require('../../middleware/verifyToken');

router.post('/addEdit-manager', userAuth, managerController.addEditManager);
router.post('/view-manager', userAuth, managerController.view);
router.post('/list-manager', userAuth, managerController.list);
// router.post('/create-team', userAuth, managerController.createTeam);
router.post('/update-status', userAuth, managerController.updateStatus);
router.post('/master-manager-list', userAuth, managerController.allManagerList);
router.post('/delete-manager', userAuth, managerController.delete);

module.exports = router;