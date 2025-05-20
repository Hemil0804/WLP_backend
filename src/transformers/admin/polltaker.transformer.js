const helper = require('../../helpers/helper')

exports.polltakerTransform = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.polltakerListTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.polltakerListTransform = (data) => {

    return {
        id: data?._id ? data._id : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        managerId: data?.managerId ? data.managerId : '',
        managerName: data?.managerData[0]?.fullName ? data.managerData[0].fullName : '',
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        address: data?.address ? data?.address : '',
        role: data?.userRole ? data.userRole : '',
        status: data?.status ? data.status : 0,
        totalSurveys: data?.totalSurveys ? data.totalSurveys : 0,
        activeSurveys: data?.activeSurveys ? data.activeSurveys : 0,
        pendingSurveys: data?.pendingSurveys ? data.pendingSurveys : 0,
        completedSurveys: data?.completedSurveys ? data.completedSurveys : 0,
    };
};

exports.pollTakerViewWithSurveyTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = transformerPollTakerWithSurvey(arrayData);
    }
    return responseData;
};

const transformerPollTakerWithSurvey = (data) => {
    const pollTakerObject = data.find(item => item.pollTaker);
    const pollTaker = pollTakerObject ? pollTakerObject.pollTaker : [];

    // Find the survey object
    const surveyObject = data.find(item => item.survey);
    console.log("data......", surveyObject)

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
exports.surveyTransformer = (data) => {
    return {

        surveyId: data?._id ? data._id : "",
        surveyName: data?.surveyName ? data.surveyName : "",
        surveyDate: data?.surveyDate ? data.surveyDate.getTime() : 0,
        description: data?.description ? data.description : "",
        surveyStatus: data?.surveyStatus ? data.surveyStatus : 0
    }
};