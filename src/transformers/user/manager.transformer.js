const helper = require('../../helpers/helper')

exports.createTeamTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = this.createManagerTeamTransform(arrayData);
    }
    return responseData;
};
exports.createManagerTeamTransform = (data) => {
    return {
        id: data?._id ? data._id : '',
        team_managerId: data?.team_managerId ? data.team_managerId : '',
        managerId: data?.managerId ? data.managerId : '',
        name: data?.name ? data.name : '',
        createdAt: data?.createdAt ? data.createdAt : 0,
        updatedAt: data?.updatedAt ? data.updatedAt : 0,
    };
};

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
exports.managerListTransform = (data) => {

    return {
        id: data?._id ? data._id : '',
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        role: data?.userRole ? data.userRole : '',
        status: data?.status ? data.status : 0,
        createdAt: data?.createdAt ? data.createdAt : 0,
    };
};
exports.managerSurveyListTransform = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.managerSurveyListTransformData(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.managerSurveyListTransformData = (data) => {
    console.log(data,'data')

    return {
        id: data?._id ? data._id : '',
        fullName: data.managerDetails?.fullName ? data.managerDetails.fullName : '',
        managerId: data.managerDetails?._id ? data.managerDetails._id : '',
        status: data?.status ? data.status : 0,
        surveyName: data?.surveyName ? data.surveyName : '',
        surveyDate: data?.surveyDate ? data.surveyDate : '',
        createdAt: data?.createdAt ? data.createdAt : 0,
    };
};

exports.allManagerTransform = (arrayData) => {
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