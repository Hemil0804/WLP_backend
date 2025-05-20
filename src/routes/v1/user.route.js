const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/user.controller');
const pollTakerController = require('../../controllers/user/pollTaker/pollTaker.controller');
const contactController = require('../../controllers/user/contact.controller');
const questionController = require('../../controllers/user/question.controller');
const { userAuth } = require('../../middleware/verifyToken');
const userValidation = require('../../validations/user/user.validation');
const { validatorFunction } = require('../../helpers/responseHelper');
const { validMulterUploadMiddleware, uploadImage } = require('../../middleware/uploadImage');
const subscriptionController = require('../../controllers/admin/subscription.controller');

router.post('/', (req, res) => res.send('Welcome to user route'));

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/view', userAuth, userController.viewProfile);
router.post('/edit-profile', userAuth, validMulterUploadMiddleware(uploadImage), userController.editProfile);
router.post('/verifyuser', userController.verifyUser);
router.post('/resendOtp', userAuth, userController.resendOtp);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/resetPasswordMobile', userAuth, userController.resetPasswordMobile);
router.post('/change-password', userAuth, userController.changePassword);
router.post('/purchase-subscription', userAuth, userController.buySubscriptionPlan);
router.post('/list-master', userAuth, userController.masterList);
router.post('/list-presence', userAuth, userController.masterUserPresenceList);   
router.post('/list-statistics', userAuth, userController.statisticsList);
router.post('/add-preference', userAuth, userController.addPreference);

//view preferences
router.post('/get-preference', userAuth, userController.getPreference);


router.post('/log-out', userAuth, userController.logOut);

// contact .....
router.post('/list-contact', userAuth, contactController.listContact);
router.post('/view-contact', userAuth, contactController.viewContact);

//polltaker......
router.post('/add-polltaker', userAuth, pollTakerController.addPollTaker);
router.post('/view-polltaker', userAuth, pollTakerController.viewPollTaker);
router.post('/delete-polltaker', userAuth, pollTakerController.deletePollTaker);
router.post('/list-polltaker', userAuth, pollTakerController.listPollTaker);

//question....
router.post('/add-question', userAuth, questionController.addEditQuestions);
router.post('/view-question', userAuth, questionController.viewQuestion);
router.post('/list-question', userAuth, questionController.listQuestion);

//subscription
router.post('/list-subscription', userAuth, subscriptionController.listSubscription);
router.post('/view-subscription', userAuth, subscriptionController.viewSubscription);

module.exports = router;
