const { imageURL } = require("../helpers/helper");
const { addTimeToTimestamp } = require("../helpers/dateFormat.helper")
exports.userPlanTransformer = (data, language) => {

    let subscriptionData = data.subscriptionId
    if (language === "it") {
        subscriptionData.title = subscriptionData.titleIt
        subscriptionData.description = subscriptionData.descriptionIt

    }
    return {
        userPlanId: data?._id ? data._id : "",
        subscriptionId: subscriptionData?._id ? subscriptionData._id : '',
        subscriptionType: subscriptionData?.subscriptionType ? subscriptionData.subscriptionType : '',
        month: data?.month ? data.month : 0,
        colorCode: data?.colorCode ? data.colorCode : "",
        subSubscriptionImage: subscriptionData?.subSubscriptionImage ? imageURL(subscriptionData.subSubscriptionImage, "images") : '',
        subSubscriptionAppImage: subscriptionData?.subSubscriptionAppImage ? imageURL(subscriptionData.subSubscriptionAppImage, "images") : '',
        title: (language === "it") ? subscriptionData.titleIt : subscriptionData.title,
        description: (language === "it") ? subscriptionData.descriptionIt : subscriptionData.description,
        planDescription: (language === "it") ? subscriptionData.planDescriptionIt : subscriptionData.planDescription,
        timeLine: (language === "it") ? subscriptionData.timeLineIt : subscriptionData.timeLine,
        price: subscriptionData?.price ? subscriptionData.price : 0,
        planDuration : data?.createdAt ? addTimeToTimestamp(data.createdAt,'month',data.month) : "",
    };
};

exports.userSubscriptionViewTransformer = (arrayData, language) => {
    let data = null;
    if (arrayData) {
        data = this.userPlanTransformer(arrayData, language);
    }
    arrayData = data;
    return arrayData;
};

exports.userSubscriptionListTransformer = (arrayData, language) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.userPlanTransformer(a, language));
        });
    }
    arrayData = data;
    return arrayData;
};