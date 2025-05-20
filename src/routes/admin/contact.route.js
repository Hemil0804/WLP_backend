const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/admin/contact.controller');
const verifyToken = require('../../middleware/verifyToken');
const { validMulterUploadMiddleware, uploadImage } = require("../../middleware/uploadImage");
const userController = require('../../controllers/user/user.controller');

router.get('/', (req, res) => res.send('Welcome to Contact route'));

//admin
router.post('/add-edit', verifyToken.adminAuth, contactController.addEditContact);
router.post('/view-contact', verifyToken.adminAuth, contactController.viewContact);
// router.post('/list-contact', verifyToken.adminAuth, contactController.list);
router.post('/list-contact', verifyToken.adminAuth, contactController.listContact);
router.post('/list-presence', verifyToken.adminAuth, userController.masterUserPresenceList);
router.post('/delete-contact', verifyToken.adminAuth, contactController.deleteContact);
router.post('/import-contacts', verifyToken.adminAuth, validMulterUploadMiddleware(uploadImage), contactController.importContacts);
router.post('/download', verifyToken.adminAuth, validMulterUploadMiddleware(uploadImage), contactController.downloadDummyFile);
router.post('/export-contacts', verifyToken.adminAuth, contactController.downloadFile);

module.exports = router;