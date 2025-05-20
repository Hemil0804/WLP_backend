let userModel = require("../../models/user.model");
const constant = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper');
let ObjectId = require('mongodb').ObjectId;

exports.managerService = async (data) => {
    try {
        let pipeline = [];
        
        pipeline.push({
            $match: {
                userRole: "2",
                status: { $ne: constant.STATUS.DELETED }
            }
        });
    
        if (data.status) {
            pipeline.push({
                $match: {
                    userRole: "2",
                    status: data.status
                }
            });
        }

        if (data?.filledPreference) {
            pipeline.push({
                $match: {
                    filledPreference: data.filledPreference,
                    assignContact: false,
                    status: constant.STATUS.ACTIVE
                    // userRole: { $in: ["2", "4"] },
                }
            });
        }

        // Lookup for team owner full name
        pipeline.push(
            {
                $lookup: {
                    from: "users", // Assuming the collection for users is "users"
                    localField: "teamOwnerId",
                    foreignField: "_id",
                    as: "teamOwnerData"
                }
            },
            {
                $addFields: {
                    parentManager: {
                        $cond: {
                            if: { $gt: [{ $size: "$teamOwnerData" }, 0] },
                            then: { $arrayElemAt: ["$teamOwnerData.fullName", 0] },
                            else: "Admin"
                        }
                    }
                }
            }
        );
        
        pipeline.push(
            {
                $lookup: {
                    from: "subscribedusers", // Assuming the collection name is "subscribedusers"
                    localField: "_id",
                    foreignField: "userId",
                    as: "subscriptionData"
                }
            },
            {
                $addFields: {
                    isSubscribedaa: {
                        $cond: { if: { $gt: [{ $size: "$subscriptionData" }, 0] }, then: true, else: false }
                    }
                }
            },
            {
                $unwind: {
                    path: "$subscriptionData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "subscriptions", // Assuming the collection name is "subscriptions"
                    localField: "subscriptionData.subscriptionId",
                    foreignField: "_id",
                    as: "subscriptionTitleData"
                }
            }
        );

        // Add the filter for subscription title if it is provided in the request
        if (data.subscriptionTitle) {
            pipeline.push({
                $match: {
                    "subscriptionTitleData.title": data.subscriptionTitle
                }
            });
        }

        pipeline.push(
            {
                $lookup: {
                    from: "users", // Assuming "polltakers" is the collection name
                    localField: "_id",
                    foreignField: "managerId",
                    as: "polltakerData"
                }
            },
            {
                $lookup: {
                    from: "surveys", // Assuming "surveys" is the collection name
                    localField: "_id",
                    foreignField: "managerId",
                    as: "surveyData"
                }
            },
            {
                $addFields: {
                    polltakerCount: { $size: "$polltakerData" },
                    surveyCount: { $size: "$surveyData" }
                }
            }
        );

        let obj = {};
        let sortBy = data.sortBy ? data.sortBy : -1;
        sortBy = parseInt(sortBy);
        let sortKey = data.sortKey ? data.sortKey : 'createdAt';
        obj[sortKey] = sortBy;

        if (data.search) {
            let fieldsArray = ['fullName', 'email', 'mobileNumber'];
            pipeline.push(searchHelper(data.search, fieldsArray));
        }

        pipeline.push(
            { $sort: obj },
            facetHelper(Number(data.skip), Number(data.limit))
        );

        // Counting manager-wise polltaker and survey count


        const result = await userModel.aggregate(pipeline);
        console.log(result[0].data)
        return result;
    } catch (e) {
        return false;
    }
};

exports.managerViewService = async (data) => {
    try {
        let pipeline = [];


        pipeline.push({
            $match: {
                userRole: "2",
                _id: new ObjectId(data.managerId),
                status: { $ne: constant.STATUS.DELETED }
            }
        });

        pipeline.push(
            {
                $lookup: {
                    from: "surveys", // Assuming "surveys" is the collection name
                    localField: "_id",
                    foreignField: "managerId",
                    as: "surveyData"
                }
            },
            {
                $addFields: {
                    surveyCount: { $size: "$surveyData" },
                    pendingSurveyCount: {
                        $size: {
                            $filter: {
                                input: "$surveyData",
                                cond: { $eq: ["$$this.surveyStatus", "pending"] }
                            }
                        }
                    },
                    inProgressSurveyCount: {
                        $size: {
                            $filter: {
                                input: "$surveyData",
                                cond: { $eq: ["$$this.surveyStatus", "inProcess"] }
                            }
                        }
                    },
                    completedSurveyCount: {
                        $size: {
                            $filter: {
                                input: "$surveyData",
                                cond: { $eq: ["$$this.surveyStatus", "completed"] }
                            }
                        }
                    }
                }
            }
        );

        //parent managerData
        pipeline.push(
            {
                $lookup: {
                    from: "users", // Assuming the collection for users is "users"
                    localField: "teamOwnerId",
                    foreignField: "_id",
                    as: "teamOwnerData"
                }
            },
            {
                $addFields: {
                    parentManager: {
                        $cond: {
                            if: { $gt: [{ $size: "$teamOwnerData" }, 0] },
                            then: { $arrayElemAt: ["$teamOwnerData.fullName", 0] },
                            else: "Admin"
                        }
                    }
                }
            }
        );

        pipeline.push(
            {
                $lookup: {
                    from: "subscribedusers", // Assuming the collection name is "subscribedusers"
                    localField: "_id",
                    foreignField: "userId",
                    as: "subscriptionData"
                }
            },
            {
                $addFields: {
                    isSubscribedaa: {
                        $cond: { if: { $gt: [{ $size: "$subscriptionData" }, 0] }, then: true, else: false }
                    }
                }
            },
            {
                $unwind: {
                    path: "$subscriptionData",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "subscriptions", // Assuming the collection name is "subscriptions"
                    localField: "subscriptionData.subscriptionId",
                    foreignField: "_id",
                    as: "subscriptionTitleData"
                }
            }
        );

        // let obj = {};
        // let sortBy = data.sortBy ? data.sortBy : -1;
        // sortBy = parseInt(sortBy);
        // let sortKey = data.sortKey ? data.sortKey : 'createdAt';
        // obj[sortKey] = sortBy;

        // if (data.search) {
        //     let fieldsArray = ['fullName', 'email', 'mobileNumber'];
        //     pipeline.push(searchHelper(data.search, fieldsArray));
        // }

        // pipeline.push(
        //     { $sort: obj },
        //     facetHelper(Number(data.skip), Number(data.limit))
        // );

        // // Counting manager-wise polltaker and survey count


        const result = await userModel.aggregate(pipeline);
        console.log(result)
        return result;
    } catch (e) {
        return false;
    }
};