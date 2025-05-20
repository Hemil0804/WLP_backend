const helper = require('../../helpers/helper')

exports.surveyTransform = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.surveyListTransform(a));
        });
    }
    arrayData = data;
    return arrayData;
};
exports.surveyListTransform = (data) => {

    return {
        surveyId: data?._id ? data._id : '',
        managerId: data?.managerId ? data.managerId : '',
        surveyName: data?.surveyName ? data.surveyName : '',
        surveyDate: data?.surveyDate ? data.surveyDate : '',
        description: data?.description ? data.description : '',
        surveyStatus: data?.surveyStatus ? data.surveyStatus : '',
        // status: data?.status ? data.status : 0,
        // contact: data?.contact ? data.contact : '',  
        // polltaker: data?.polltaker ? data.polltaker : '',
        // questions: data?.questions ? data.questions : '',
        createdAt: data?.createdAt ? data.createdAt : 0,
        contactCount: data.contact.length,
        questionCount: data.questions.length,
        polltakerCount: data.polltaker.length
    };
};