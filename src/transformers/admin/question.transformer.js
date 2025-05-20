const constants = require("../../../config/constants");
const { imageURL } = require("../../helpers/helper");

exports.questionTransformer = (data) => {

  let obj = {
    questionId: data?._id ? data._id : "",
    questionTitle: data?.questionTitle ? data.questionTitle : "",
    questionTitleIt: data?.questionTitleIt ? data.questionTitleIt : "",
    subject: data?.subject ? data.subject : "",
    explanation: data?.explanation ? data.explanation : "",
    explanationIt: data?.explanationIt ? data.explanationIt : "",
    correctAnswer: data?.mcqOptions.length ? data.mcqOptions.find(x => x.isCorrect)?.name : "",
    questionType: data?.questionType ? data.questionType : [],
    mcqOptions: data?.mcqOptions ? module.exports.questionQueListTransformer(data.mcqOptions) : []
  };
  return obj;
};

exports.questionDataViewTransformer = (arrayData) => {
  let data = null;
  if (arrayData) {
    data = this.questionTransformer(arrayData);
  }
  arrayData = data;
  return arrayData;
};


exports.questionListTransformer = (arrayData) => {
  let data = [];

  if (arrayData && arrayData.length > 0) {
    arrayData.forEach((a) => {
      data.push(this.questionTransformer(a));
    });
  }
  arrayData = data;
  return arrayData;
};

// ------------------------ Simulation Question list ---------------------------

exports.questionQueTransformer = (data) => {

  return {
    mcqId: data?._id ? data._id : "",
    name: data?.name ? data.name : "",
    type: data?.type ? data.type : 0,
    index: data?.index ? data.index : 0,
    description: (data?.type && data.type === constants.MCQ_OPTIONS_TYPE.IMAGE && data.description) ? imageURL(data.description, "questionMcq") : data.description,
    descriptionIt: (data?.type && data.type === constants.MCQ_OPTIONS_TYPE.IMAGE && data.description) ? imageURL(data.description, "questionMcq") : data.descriptionIt,
    isCorrect: data?.isCorrect ? data.isCorrect : false,
  };
};

exports.questionQueListTransformer = (arrayData) => {
  let data = [];

  if (arrayData && arrayData.length > 0) {
    arrayData.forEach((a) => {
      data.push(this.questionQueTransformer(a));
    });
  }
  arrayData = data;
  return arrayData;
};
