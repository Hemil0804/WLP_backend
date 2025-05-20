const express = require('express');
const router = express.Router();
const cmsController = require('../../controllers/admin/cms.controller');
const { adminAuth } = require('../../middleware/verifyToken');
const cmsValidation = require('../../validations/cms.validation');
const { validatorFunction } = require('../../helpers/responseHelper');


router.get('/', (req, res) => res.send('Welcome to admin cms route'));

router.post('/add-edit', adminAuth,cmsValidation.cmsAddEditValidation, validatorFunction, cmsController.addEdit);
router.post('/view', adminAuth,cmsValidation.cmsViewValidation, validatorFunction, cmsController.viewCms);
router.post('/list', adminAuth, /*cmsValidation.cmsViewValidation,*/ validatorFunction, cmsController.listCms);
router.post('/delete', adminAuth, /*cmsValidation.cmsViewValidation,*/ validatorFunction, cmsController.deleteCms);

module.exports = router;
