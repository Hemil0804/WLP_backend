const helper = require('../../helpers/helper')

exports.transformAdmin = (data) => {
    console.log(data)
    return {
        adminId: data?._id ? data._id : '',
        fullName: data?.fullName ? data.fullName : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        email: data?.email ? data.email : '',
        profilePicture: data?.profilePicture ? helper.imageURL(data.profilePicture, 'admin', "profileImage") : helper.imageURL("adminDefaultProfileImage.png", 'admin', "profileImage"),
        status: data?.status ? data.status : 0
    };
};

const adminProfileTransform = (data) => {

    return {
        id: data?._id ? data._id : '',
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        userType: data?.userRole ? data?.userRole : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        isVerified: data?.isVerified ? data.isVerified : false,
        address: data?.address ? data?.address : '',
        status: data?.status ? data.status : 0,
        isSubscribed: data?.isSubscribed ? data.isSubscribed : false,
        subscription_type: "",
        subscription_detail: {
            allowed_contacts: 0,
            allowed_question: 0
        }
        // profileImage: data?.profileImage ? data.profileImage : '',
        // socialType: data?.socialType ? data?.socialType : '',
        // isSocialmanager: data?.isSocialmanager ? data?.isSocialmanager : false
    };
};


exports.adminViewProfileTransformer = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = adminProfileTransform(arrayData);
    }
    return responseData;
};

exports.adminTransformer = (arrayData) => {
    let adminData = null;
    if (arrayData) {
        adminData =  adminProfileTransform(arrayData);
    }
    return adminData;
};

exports.transformSubscription = (data) => {
    return {
        subscriptionId: data?._id ? data._id : '',
        subscriptionType: data?.subscriptionType ? data.subscriptionType : '',
        title: data?.title ? data.title : "",
        allowedPolltakers: data?.allowedPolltakers ? data.allowedPolltakers : '',
        allowedQuestions: data?.allowedQuestions ? data.allowedQuestions : '',
        allowedContacts: data?.allowedContacts ? data.allowedContacts : '',
        allowedManagers: data?.allowedManagers ? data.allowedManagers : '',
        allowedSurveys: data?.allowedSurveys ? data.allowedSurveys : '',
        price: data?.price ? data.price : 0,
        description: data?.description ? data.description : '',
        // timeLine: data?.timeLine ? data.timeLineIt : data.timeLine,

    };
};

exports.subscriptionListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformSubscription(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.subscriptionViewTransformer = (arrayData) => {
    let adminData = null;
    if (arrayData) {
        adminData = this.transformSubscription(arrayData);
    }
    return adminData;
};