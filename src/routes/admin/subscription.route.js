const express = require('express');
const router = express.Router();
const subscriptionController = require('../../controllers/admin/subscription.controller');
const { adminAuth } = require('../../middleware/verifyToken');
const subscriptionValidation = require("../../validations/admin/subscription.validation");
const { validatorFunction } = require("../../helpers/responseHelper");

router.get('/', (req, res) => res.send('Welcome to admin subscription route'));

router.post('/add-edit', adminAuth, subscriptionController.addEditSubscription);
router.post('/view-subscription', adminAuth, subscriptionController.viewSubscription);
router.post('/list-subscription', adminAuth, subscriptionController.listSubscription);
router.post('/delete-subscription', adminAuth, subscriptionController.deleteSubscription);

module.exports = router;