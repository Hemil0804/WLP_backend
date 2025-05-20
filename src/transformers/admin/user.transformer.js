const helper = require('../../helpers/helper')

exports.transformer = (data) => {
        return {
        userId: data?._id ? data._id : '',
        userType: data?.userType ? data.userType : 1,
        fullName: data?.fullName ? data.fullName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.mobileNumber ? data.mobileNumber : '',
        language: data?.language ? data.language : '',
        profileImage: data?.profileImage ? helper.imageURL(data.profileImage, 'user',"profileImage") : helper.imageURL("userDefaultProfileImage.png", 'user',"profileImage"),
        userDocumentData: data?.userDocumentData ? data.userDocumentData : {},
        // userPlanData: data?.userPlanData ? data.userPlanData : {},
        status: data?.status ? data.status : 0,
    };
};

exports.userViewTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = this.transformer(arrayData);
    }
    return responseData;
};

exports.userListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformer(a));
        });
    }
    arrayData = data;
    return arrayData;
};
