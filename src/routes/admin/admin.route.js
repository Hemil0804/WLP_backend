const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin/admin.controller');
const verifyToken = require('../../middleware/verifyToken');
const { validMulterUploadMiddleware, uploadImage } = require('../../middleware/uploadImage')

router.get('/', (req, res) => res.send('Welcome to admin route'));

//admin
// router.post('/login', adminController.login);
router.post('/view', verifyToken.adminAuth, adminController.viewProfile);
router.post('/edit-profile', verifyToken.adminAuth, validMulterUploadMiddleware(uploadImage), adminController.editProfile);
router.post('/change-password', verifyToken.adminAuth, adminController.changePassword);
router.post('/reset-password', adminController.resetPassword);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/resendOtp', adminController.resendOtp);
router.post('/log-out', verifyToken.adminAuth, adminController.logout);

module.exports = router;