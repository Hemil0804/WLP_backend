// const ADMIN = require('firebase-admin');
let FCM = require('fcm-node');

const { ObjectId } = require('mongoose').Types;
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const UserToken = require('../models/userToken.model')
const Admin = require('../models/admin.model');
const constants = require('../../config/constants');
const { NOTIFICATION_SERVER_KEY, BASE_URL } = require('../../config/key')


exports.sendNotification = async function (data, notificationType, title = {}, body = {}, userType = '', isAdmin = false) {

    try {

        let userTokenData = [];

        let query = { status: constants.STATUS.ACTIVE };

        if (ObjectId.isValid(userType)) {
            query['_id'] = userType;
        } else if (userType.split(',').length) {
            let isMultipleUsers = userType.split(',').every(x => ObjectId.isValid(x))
            isMultipleUsers && (query['_id'] = { $in: userType.split(',') })
        }

        let userIds = await User.find(query).distinct('_id');

        if (isAdmin) {
            userIds = await Admin.find({}).distinct('_id');
        }
        console.log('notificationType', notificationType);
        console.log('notificationType', typeof (notificationType));

        if (!isAdmin && userType != 'ORGANIZER') {

            userTokenData = await UserToken.find({ userId: { $in: userIds }, status: constants.STATUS.ACTIVE }).select('deviceToken userId userType language').lean();
            let userToken = userTokenData.map(x => x.deviceToken);

            let serverkey = NOTIFICATION_SERVER_KEY;
            let fcm = new FCM(serverkey);

            if (userToken.length) {
                let notificationObj = {
                    registration_idsEN: [],
                    registration_idsDE: [],
                    dataEN: { type: title.notificationTitle, ...data, notificationType },
                    dataDE: { type: title.notificationTitleDe, ...data, notificationType },
                    notificationEN: {
                        title: title.notificationTitle,
                        body: body.notificationBody,
                        priority: 'high',
                        sound: 'default'
                    },
                    notificationDE: {
                        title: title.notificationTitleDe,
                        body: body.notificationBodyDe,
                        priority: 'high',
                        sound: 'default'
                    },
                };

                if (notificationType == constants.NOTIFICATION_TYPE.NEW_PROMOCODE_AVAILABLE) {
                    notificationObj.dataEN.image = `${BASE_URL}/public/images/temp_discount.png`;
                    notificationObj.dataDE.image = `${BASE_URL}/public/images/temp_discount.png`;
                } else if (notificationType == constants.NOTIFICATION_TYPE.CHECK_IN) {
                    notificationObj.dataEN.image = `${BASE_URL}/public/images/temp_calendar.png`;
                    notificationObj.dataDE.image = `${BASE_URL}/public/images/temp_calendar.png`;
                } else if (notificationType == constants.NOTIFICATION_TYPE.EVENT_REMAINDER || notificationType == constants.NOTIFICATION_TYPE.PAYMENT_SUCCESS) {
                    notificationObj.dataEN.image = data.image;
                    notificationObj.dataDE.image = data.image;
                }

                let registration_idsEN = [], registration_idsDE = [];
                for (let i = 0; i < userTokenData.length; i++) {
                    let eachUserToken = userTokenData[i];
                    if (eachUserToken.language == 'it') {
                        registration_idsDE.push(eachUserToken.deviceToken);
                        notificationObj.registration_idsDE.push(eachUserToken.deviceToken);
                    } else {
                        registration_idsEN.push(eachUserToken.deviceToken);
                        notificationObj.registration_idsEN.push(eachUserToken.deviceToken);
                    }
                }

                let messageEN = {
                    registration_ids: registration_idsEN, // Device token array
                    data: notificationObj.dataEN,
                    notification: notificationObj.notificationEN,
                    priority: 'high',
                    timeToLive: 60 * 60 * 24
                };

                let messageDE = {
                    registration_ids: registration_idsDE, // Device token array
                    data: notificationObj.dataDE,
                    notification: notificationObj.notificationDE,
                    priority: 'high',
                    timeToLive: 60 * 60 * 24
                };

                console.log('messageEN', messageEN.notification);
                console.log('messageDE', messageDE.notification);
                if (notificationObj.registration_idsEN.length) {

                    fcm.send(messageEN, function (err, response) {
                        if (err) {
                            console.log(messageEN);
                            console.log('Something has gone wrong !', err);
                        } else {
                            console.log('Successfully sent with resposne :', response);
                        }
                    });
                }
                if (notificationObj.registration_idsDE.length) {

                    fcm.send(messageDE, function (err, response) {
                        if (err) {
                            console.log(messageDE);
                            console.log('Something has gone wrong !', err);
                        } else {
                            console.log('Successfully sent with resposne :', response);
                        }
                    });
                }
            }
        }

        let notificationArr = [];

        let usersDataLength = userIds.length;
        for (let c = 0; c < usersDataLength; c++) {

            let eachUser = userIds[c];

            let obj = {
                userId: eachUser,
                isAdminNotification: isAdmin ? true : false,
                title: title.notificationTitle,
                titleDe: title.notificationTitleDe,
                body: body.notificationBody,
                bodyDe: body.notificationBodyDe,
                notification: data,
                notificationType: notificationType
            };

            if (notificationType == constants.NOTIFICATION_TYPE.NEW_PROMOCODE_AVAILABLE) {
                obj.image = `${BASE_URL}/public/images/temp_discount.png`;
                obj.discountId = data.discountId;
            } else if (notificationType == constants.NOTIFICATION_TYPE.CHECK_IN) {
                obj.image = `${BASE_URL}/public/images/temp_calendar.png`;
                obj.eventId = data.eventId;
            } else if (notificationType == constants.NOTIFICATION_TYPE.EVENT_REMAINDER) {
                obj.image = data.image;
                obj.eventId = data.eventId;
            } else if (notificationType == constants.NOTIFICATION_TYPE.ADMIN_ACCEPT_EVENT || notificationType == constants.NOTIFICATION_TYPE.ADMIN_REJECT_EVENT || notificationType == constants.NOTIFICATION_TYPE.NEW_EVENT_CREATED || notificationType == constants.NOTIFICATION_TYPE.USER_JOIN_EVENT) {
                obj.eventId = data.eventId;
            } else if (notificationType == constants.NOTIFICATION_TYPE.NEW_ORGANIZER_ADDED || notificationType == constants.NOTIFICATION_TYPE.NEW_USER_ADDED) {
                obj.newUserAddedId = data.userId;
            }

            notificationArr.push(obj);
        }

        console.log('notificationArr--->', notificationArr.length);
        (notificationArr.length) && await Notification.insertMany(notificationArr);
    } catch (err) {
        console.log('Error(sendNotification): ', err);
        throw err;
    }
}