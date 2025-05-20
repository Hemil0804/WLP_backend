const helper = require('../../helpers/helper')

exports.managerTransform = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.managerListTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.allmanagerTransform = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.allManagerListTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.allManagerListTransform = (data) => {

    return {
        id: data?._id ? data._id : '',
        fullName: data?.fullName ? data.fullName : ''
    };
};
exports.managerListTransform = (data) => {
    // console.log(data.subscriptionTitleData);
    let subscriptionType;
    if(data.subscriptionTitleData.length>0){
        subscriptionType=data.subscriptionTitleData[0].title
    }else{
        subscriptionType=''
    }

    return {
        id: data?._id ? data._id : '',
        fullName: data?.fullName ? data.fullName : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        role: data?.userRole ? data.userRole : '',
        status: data?.status ? data.status : 0,
        createdAt: data?.createdAt ? data.createdAt : 0,
        polltakerCount: data?.polltakerCount ? data.polltakerCount : 0,
        surveyCount: data?.surveyCount ? data.surveyCount : 0,
        contactsCount: data?.assignedContacts ? data.assignedContacts.length : 0,
        parentManager: data?.parentManager ? data.parentManager : 'Admin',
        subscriptionType: subscriptionType,
    };
};

exports.managerViewTransformData = (data) => {
    let subscriptionType;
    if(data.subscriptionTitleData.length>0){
        subscriptionType=data.subscriptionTitleData[0].title
    }else{
        subscriptionType=''
    }
    return {
        id: data?._id ? data._id : '',
        fullName: data?.fullName ? data.fullName : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        role: data?.userRole ? data.userRole : '',
        status: data?.status ? data.status : 0,
        createdAt: data?.createdAt ? data.createdAt : 0,
        totalSurveyCount: data?.surveyCount ? data.surveyCount : 0,
        pendingSurveyCount: data?.pendingSurveyCount ? data.pendingSurveyCount : 0,
        inProgressSurveyCount: data?.inProgressSurveyCount ? data.inProgressSurveyCount : 0,
        completedSurveyCount: data?.completedSurveyCount ? data.completedSurveyCount : 0,
        contactsCount: data?.assignedContacts ? data.assignedContacts.length : 0,
        parentManager: data?.parentManager ? data.parentManager : 'Admin',
        subscriptionType: subscriptionType,
    };
};
exports.managerViewTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = this.managerViewTransformData(arrayData);
    }
    return responseData;
};

