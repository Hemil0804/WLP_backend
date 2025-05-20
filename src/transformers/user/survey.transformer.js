const helper = require('../../helpers/helper')

exports.transformer = (data) => {

    return {
        surveyId: data?._id ? data._id : "",
        surveyName: data?.surveyName ? data.surveyName : "",
        surveyDate: data?.surveyDate ? data.surveyDate.getTime() : 0,
        polltakerData: data?.polltakerData?.length > 0 ? this.pollTakerDataViewTransformer(data.polltakerData) : [],
        managerId: data?.managerData?._id ? data.managerData._id : "",
        managerName: data?.managerData?.fullName ? data.managerData.fullName : "",
        description: data?.description ? data.description : "",
        contact: data?.contactData?.length > 0 ? this.contactDataViewTransformer(data.contactData) : [],
        questions: data?.questionsData?.length > 0 ? this.questionsDataViewTransformer(data.questionsData) : [],
        totalQuestion: data?.questionsData?.length || 0,
        totalPollTaker: data?.polltakerData?.length || 0,
        totalContact: data?.contactData?.length||0,
        surveyStatus: data?.surveyStatus ? data.surveyStatus : '',
        status: data?.status ? data.status : 0
    }
};

exports.transformerList = (data) => {
    console.log("data", data)
    return {
        surveyId: data?._id ? data._id : "",
        surveyName: data?.surveyName ? data.surveyName : "",
        surveyDate: data?.surveyDate ? data.surveyDate.getTime() : 0,
        polltakerData: data?.polltakerData ? data.polltakerData : '',
        managerId: data?.managerData?._id ? data.managerData._id : "",
        managerName: data?.managerData?.fullName ? data.managerData.fullName : "",
        description: data?.description ? data.description : "",
        // contact: data?.contactData?.length > 0 ? this.contactDataViewTransformer(data.contactData) : [],
        // questions: data?.questionsData?.length > 0 ? this.questionsDataViewTransformer(data.questionsData) : [],
        surveyStatus: data?.surveyStatus ? data.surveyStatus : '',
        status: data?.status ? data.status : 0
    }
};

exports.surveyDataViewTransformer = (arrayData) => {
    let data = null;
    if (arrayData) {
        data = this.transformer(arrayData);
    }
    arrayData = data;
    return arrayData;
};

exports.teamOwnerSurveyListTransform = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.teamOwnerSurveyListTransformData(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.teamOwnerSurveyListTransformData = (data) => {

    return {

        surveyId: data?._id ? data._id : "",
        surveyName: data?.surveyName ? data.surveyName : '',
        surveyDate: data?.surveyDate ? data.surveyDate : '',
        description: data?.description ? data.description : "",
        managerId: data?.managerData?._id ? data.managerData._id : "",
        managerName: data?.managerData?.fullName ? data.managerData.fullName : "",
        status: data?.status ? data.status : 0,
        surveyStatus: data?.surveyStatus ? data.surveyStatus : '',
    };
};



exports.surveyListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformer(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.onlySurveyListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformerList(a));
        });
    }
    arrayData = data;
    return arrayData;
};

const contactTransform = (data) => {
    return {
        contactId: data?._id ? data._id : "",
        firstName: data?.firstName ? data.firstName : "",
        lastName: data?.lastName ? data.lastName : "",
        email: data?.email ? data.email : "",
        mobileNumber: data?.phone ? data.phone : "",
        address: data?.address ? data.address : null,
        contactStatus: data?.completeStatus ? data.completeStatus : "",
    }
}

exports.contactDataViewTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(contactTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};

const questionsTransform = (data) => {
    return {
        questionId: data?._id ? data._id : "",
        questionTitle: data?.questionTitle ? data.questionTitle : "",
        mcqOptions: data?.mcqOptions?.length > 0 ? data.mcqOptions : [],
        questionType: data?.questionType ? data.questionType : 0
    }
}

exports.questionsDataViewTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(questionsTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};

const pollTakerTransform = (data) => {
    return {
        id: data?._id ? data._id : "",
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user') : helper.imageURL("defaultImg.png", 'user'),
        managerId: data?.managerId ? data.managerId : "",
        fullName: data?.fullName ? data.fullName : "",
        email: data?.email ? data.email : "",
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        role: data?.userRole ? data.userRole : '',
        status: data?.status ? data.status : '',

    }
}

exports.pollTakerDataViewTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(pollTakerTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};