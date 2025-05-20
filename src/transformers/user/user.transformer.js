const helper = require('../../helpers/helper')


// ---------------------------------------------------------------------------------------MANGER------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const transformer = (data) => {

    return {
        id: data?._id ? data._id : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        isVerified: data?.isVerified ? data.isVerified : false,
        role: data?.userRole ? data.userRole : '',
        // profileImage: data?.profileImage ? data.profileImage : '',
        status: data?.status ? data.status : 0,
        // socialType: data?.socialType ? data?.socialType : ''
        // isSocialmanager: data?.isSocialmanager ? data?.isSocialmanager : false
    };
};

const userTransformAddressDetails = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = transformer(arrayData);
    }
    return responseData;
};

const userProfileTransform = (data) => {

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
        filledPreference: data?.filledPreference ? data.filledPreference : false,
        subscription_type: data?.subscription_type ? data.subscription_type : '',
        subscription_description: data?.subscription_description ? data.subscription_description : '',
        subscription_detail: data?.subscription_detail ? data.subscription_detail : '',
        // profileImage: data?.profileImage ? data.profileImage : '',
        // socialType: data?.socialType ? data?.socialType : '',
        // isSocialmanager: data?.isSocialmanager ? data?.isSocialmanager : false
    };
};

const userProfileTransformer = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = userProfileTransform(arrayData);
    }
    return responseData;
};

const logIntransformer = (data) => {

    return {
        id: data?._id ? data._id : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        userType: data?.userRole ? data.userRole : '',
        isVerified: data?.isVerified ? data.isVerified : false,
        mobileNumber: data?.mobileNumber ? data?.mobileNumber : '',
        address: data?.address ? data?.address : '',
        isSubscribed: data?.isSubscribed ? data.isSubscribed : false,
        filledPreference: data?.filledPreference ? data.filledPreference : false,
        subscription_type: data?.subscription_type ? data.subscription_type : '',
        subscription_description: data?.subscription_description ? data.subscription_description : '',
        subscription_detail: data?.subscription_detail ? data.subscription_detail : '',

    };
};

const userLogInTransformAddressDetails = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = logIntransformer(arrayData);
    }
    return responseData;
};

// -------------------------------------------------------------------------POLLTAKER-----------------------------------------------------------------------------------------
// ---------------------------------------------------------- ------------------------------------------------------------------------------------------------------------------
const transformerPollTakerWithSurvey = (data) => {
    console.log("data......", data)
    const pollTakerObject = data.find(item => item.pollTaker);
    const pollTaker = pollTakerObject ? pollTakerObject.pollTaker : [];

    // Find the survey object
    const surveyObject = data.find(item => item.survey);
    const survey = surveyObject ? surveyObject.survey : [];
    const pendingSurveyCount = surveyObject ? surveyObject.pendingSurveyCount : 0;
    const inProcessSurveyCount = surveyObject ? surveyObject.inProcessSurveyCount : 0;
    const completedSurveyCount = surveyObject ? surveyObject.completedSurveyCount : 0;

    return {
        id: pollTaker?._id ? pollTaker._id : '',
        profileImage: pollTaker?.profileImage ? helper.imageURL(pollTaker.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        managerId: pollTaker?.managerId ? pollTaker.managerId : '',
        fullName: pollTaker?.fullName ? pollTaker.fullName : '',
        email: pollTaker?.email ? pollTaker.email : '',
        mobileNumber: pollTaker?.mobileNumber ? pollTaker.mobileNumber : '',
        address: pollTaker?.address ? pollTaker?.address : '',
        role: pollTaker?.userRole ? pollTaker.userRole : '',
        status: pollTaker?.status ? pollTaker.status : 0,
        surveyList: survey?.length > 0 ? this.surveyListTransformer(survey) : [],
        pendingSurveyCount: pendingSurveyCount,
        inProcessSurveyCount: inProcessSurveyCount,
        completedSurveyCount: completedSurveyCount,
    };
};

const transformerPollTakerAdd = (data) => {
    return {
        id: data?._id ? data._id : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        managerId: data?.managerId ? data.managerId : '',
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        address: data?.address ? data?.address : '',
        totalSurveys: data?.totalSurveys ? data.totalSurveys : 0,
        activeSurveys: data?.activeSurveys ? data.activeSurveys : 0,
        pendingSurveys: data?.pendingSurveys ? data.pendingSurveys : 0,
        completedSurveys: data?.completedSurveys ? data.completedSurveys : 0,
        role: data?.userRole ? data.userRole : '',
        status: data?.status ? data.status : 0,
    };
};

exports.surveyTransformer = (data) => {
    return {

        surveyId: data?._id ? data._id : "",
        surveyName: data?.surveyName ? data.surveyName : "",
        surveyDate: data?.surveyDate ? data.surveyDate.getTime() : 0,
        description: data?.description ? data.description : "",
        surveyStatus: data?.surveyStatus ? data.surveyStatus : 0
    }
};

exports.surveyListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.surveyTransformer(a));
        });
    }
    arrayData = data;
    return arrayData;
};

const pollTakerViewWithSurveyTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = transformerPollTakerWithSurvey(arrayData);
    }
    return responseData;
};

const pollTakerAddViewTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = transformerPollTakerAdd(arrayData);
    }
    return responseData;
};

const pollTakerListWithSurveyTransform = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(transformerPollTakerWithSurvey(a));
        });
    }
    arrayData = data;
    return arrayData;
};

const pollTakerListAddTransform = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(transformerPollTakerAdd(a));
        });
    }
    arrayData = data;
    return arrayData;
};


const getAssignContactListDetailsTransform=(arrayData)=>{
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(transformerPollTakerAdd(a));
        });
    }
    arrayData = data;
    return arrayData;
}


// ---------------------------------------------------------------------------------------CONTACT------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------QUESTIONS------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------


module.exports = {
    transformer,
    userTransformAddressDetails,
    userLogInTransformAddressDetails,
    logIntransformer,
    userProfileTransformer,
    pollTakerAddViewTransform,
    pollTakerListAddTransform,
    pollTakerViewWithSurveyTransform,
    pollTakerListWithSurveyTransform,
    getAssignContactListDetailsTransform
};