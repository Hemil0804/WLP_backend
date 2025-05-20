const express = require('express');
const router = express.Router();
const polltakerController = require('../../../controllers/manager/pollTaker/pollTaker.controller');
const { managerAuth } = require('../../middleware/verifyToken');

router.get('/', (req, res) => res.send('Welcome to manager route'));

router.post('/addEdit', polltakerController.register);
router.post('/login', managerController.login);
router.post('/view ', managerAuth, managerController.viewProfile);
// router.post('/editProfile', managerAuth, managerController.editProfile);
// router.post('/verifyManager', managerController.verifyManager);
// router.post('/resendOtp', managerAuth, managerController.resendOtp);
// router.post('/forgot-password', managerController.forgotPassword);
// router.post('/reset-password',   managerController.resetPassword);
// router.post('/resetPasswordMobile', managerAuth, managerController.resetPasswordMobile);
// router.post('/change-password', managerAuth, managerController.changePassword);
// router.post('/log-out', managerAuth, managerController.logOut);

module.exports = router;
