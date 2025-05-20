const transformerQuestion = (data) => {
  if (!data.isSocialmanager) data.profileImage = data?.profileImage ? helper.imageURL(data.profileImage, 'manager') : ''
  return {
      questionId: data?._id ? data._id : '',
      questionTitle: data?.questionTitle ? data.questionTitle : '',
      mcqOptions: data?.mcqOptions ? data.mcqOptions : '',
      questionType: data?.questionType ? data.questionType : '',
      // questionType: data?.questionType ? data.questionType : '',
      // profileImage: data?.profileImage ? data.profileImage : '',
      // status: data?.status ? data.status : 0,
  };
};

const questionViewTransform = (arrayData) => {
  let responseData = null;
  if (arrayData) {
      responseData = transformerQuestion(arrayData);
  }
  return responseData;
};


const questionListTransform = (arrayData) => {
  let data = [];
  if (arrayData && arrayData.length > 0) {
      arrayData.forEach((a) => {
          data.push(transformerQuestion(a));
      });
  }
  arrayData = data;
  return arrayData;
};

module.exports = {
  questionListTransform,
  questionViewTransform,
};