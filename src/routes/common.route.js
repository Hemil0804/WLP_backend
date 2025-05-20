const express = require('express');
const router = express.Router();

// // End user and Organizer LRF routes
const userRoutes = require('./v1/user.route');
router.use('/api/v1/user/', userRoutes);

// survey
const surveyRoutes = require('./v1/survey.route');
router.use('/api/v1/survey', surveyRoutes);

// City 
const cityRoute = require('./v1/city.route');
router.use('/api/v1/cities', cityRoute);

// state 
const stateRoute = require('./v1/state.route');
router.use('/api/v1/state', stateRoute);

// country 
const countryRoute = require('./v1/country.route');
router.use('/api/v1/country', countryRoute);

// Admin manager
const teamOwner = require('./v1/team_owner.route');
router.use('/api/v1/team-owner', teamOwner);

// // CMS route
// const cmsRoutes = require('./api/v1/cms.route');
// router.use('/api/v1/cms', cmsRoutes);

// // Admin City 
// router.use('/admin/cities', cityRoute);

// // Admin Country 
// const countryRoute = require('./api/v1/country.route');
// router.use('/admin/countries', countryRoute);

// // Subscription
// const userSubscription = require('../routes/api/v1/contactUs.route');
// router.use('/api/v1/subscription', userSubscription);


// //-----------------------------------------Admin routes---------------------------------------------------

// // Admin
const admin = require('./admin/admin.route');
router.use('/admin', admin);

// Admin contact
const contact = require('./admin/contact.route');
router.use('/admin/contact', contact);

// Admin Question Route
const questionRoutes = require('./admin/question.route');
router.use('/admin/questions/', questionRoutes);

// Admin manager
const manager = require('./admin/manager.route');
router.use('/admin/manager', manager);

// Admin side survey routes
const survey = require('./admin/survey.route');
router.use('/admin/survey', survey);

// Admin side PollTaker routes
const pollTaker = require('./admin/polltaker.route');
router.use('/admin/user', pollTaker);


// City 
const cityAdminRoute = require('./admin/city.route');
router.use('/admin/cities', cityRoute);

// state 
const stateAdminRoute = require('./admin/state.route');
router.use('/admin/state', stateRoute);

// country 
const countryAdminRoute = require('./admin/country.route');
router.use('/admin/country', countryRoute);


// // Admin CMS
// const cms = require('./admin/cms.route');
// router.use('/admin/cms', cms);

// // Admin Contact-us
// const contactUs = require('./admin/contactUs.route');
// router.use('/admin/contact-us', contactUs);

// // Admin Config
// const config = require('./admin/config.route');
// router.use('/admin/config', config);

// Admin Subscription
const subscription = require('./admin/subscription.route');
router.use('/admin/subscription', subscription);

// // Admin Notification Route
// const adminNotificationRoute = require('./admin/notification.route');
// router.use('/admin/notifications/', adminNotificationRoute);




module.exports = router;