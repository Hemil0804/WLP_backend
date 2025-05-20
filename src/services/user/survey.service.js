let surveyModel = require("../../models/survey.model");
const constant = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.surveyService = async (data) => {
    try {
        let pipeline = [];

        if (data?.surveyStatus) {
            pipeline.push(
                {
                    $match: {
                        surveyStatus: data.surveyStatus
                    }
                },
            );
        }
        if (data.polltaker) {
            pipeline.push({
                $match: {
                    polltaker: { $in: [data.polltaker] },
                    status: { $ne: constant.STATUS.DELETED },
                    surveyStatus: { $ne: "completed" }
                }
            })
        }
        if (data.teamOwnerId) {
            if (data.managerId) {
                pipeline.push({
                    $match: {
                        managerId: new ObjectId(data.managerId),
                        status: { $ne: constant.STATUS.DELETED },
                    }
                })
            } else {
                if (data.filterBy == "all") {
                    pipeline.push({
                        $match: {
                            managerId: { $in: data.managerIds },
                            status: { $ne: constant.STATUS.DELETED },
                        }
                    })
                } else {
                    pipeline.push({
                        $match: {
                            managerId: data.teamOwnerId,
                            status: { $ne: constant.STATUS.DELETED },
                        }
                    })
                }
            }
        }
        if (data.managerId) {
            pipeline.push(
                {
                    $match: {
                        managerId: new ObjectId(data.managerId),
                        status: { $ne: constant.STATUS.DELETED }
                    }
                },
            )
        }
        pipeline.push({
            $lookup: {
                from: 'users',
                let: { managerId: '$managerId' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$_id', '$$managerId'] },
                                { $ne: ['$status', constant.STATUS.DELETED] }
                            ]
                        }
                    }
                }],
                as: 'managerData'
            }
        },
            {
                $unwind: '$managerData'
            },
            {
                $lookup: {
                    from: 'contacts',
                    let: { contact: '$contact.contactId' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$contact'] },
                                    { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'contactData'
                }
            },
            {
                $lookup: {
                    from: 'questions',
                    let: { questions: '$questions' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$questions'] },
                                    { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'questionsData'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { polltaker: '$polltaker' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$polltaker'] },
                                    // { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'polltakerData'
                }
            }
        );

        let obj = {}
        sortBy = data.sortBy ? data.sortBy : -1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'createdAt'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['surveyName', 'managerData.fullName', 'polltakerData.fullName']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj }, facetHelper(Number(data.skip), Number(data.limit)))

        const result = await surveyModel.aggregate(pipeline);

        return result;
    } catch (e) {
        console.log('error', e);

        return false;
    }
}

exports.surveyViewService = async (data) => {
    try {
        let pipeline = [];

        pipeline.push(
            {
                $match: {
                    _id: new ObjectId(data.surveyId),
                    status: { $ne: constant.STATUS.DELETED }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { managerId: '$managerId' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$managerId'] },
                                    { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'managerData'
                }
            },
            {
                $unwind: '$managerData'
            },
            {
                $lookup: {
                    from: 'contacts',
                    let: { contactIds: '$contact.contactId' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$contactIds'] },
                                    { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'contactData'
                }
            },
            {
                $lookup: {
                    from: 'questions',
                    let: { questions: '$questions' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$questions'] },
                                    { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'questionsData'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { polltaker: '$polltaker' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$polltaker'] },
                                    // { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'polltakerData'
                }
            }
        );

        const result = await surveyModel.aggregate(pipeline);

        return result;
    } catch (e) {
        return false;
    }
}


exports.viewCompletedSurveyContactService = async (data) => {
    try {
        let pipeline = [];

        pipeline.push(
            {
                $match: {
                    _id: new ObjectId(data.surveyId),
                    status: 1,
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { managerId: "$managerId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$managerId"] },
                                        { $ne: ["$status", 3] },
                                    ],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1, // Include only necessary fields
                            },
                        },
                    ],
                    as: "managerData",
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { polltaker: "$polltaker" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", "$$polltaker"],
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                fullName: 1,
                            },
                        },
                    ],
                    as: "polltakerData",
                },
            },
            {
                $addFields: {
                    // Filter the contact array to only include the one matching the provided contactId
                    filteredContact: {
                        $filter: {
                            input: "$contact",
                            as: "contact",
                            cond: {
                                $eq: ["$$contact.contactId", new ObjectId(data.contactId)],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    // Extract all questionIds from the filteredContact's questionAnswers
                    questionIds: {
                        $map: {
                            input: {
                                $arrayElemAt: ["$filteredContact.questionAnswers", 0,],
                            },
                            as: "qa",
                            in: "$$qa.questionId",
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "questions",
                    let: { questionIds: "$questionIds" }, // Use the questionIds from all questionAnswers
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", "$$questionIds"],
                                },
                            },
                        },
                    ],
                    as: "questionsData",
                },
            },
            {
                $project: {
                    _id: 0, // Optionally exclude the _id from the final output
                    contact: { $arrayElemAt: ["$filteredContact", 0,], },
                    contactStatus: { $arrayElemAt: ["$filteredContact.status", 0,], },
                    questionsData: 1,
                    managerData: { $arrayElemAt: ["$managerData", 0,] },
                    polltakerData: 1,
                },
            },
        );

        const result = await surveyModel.aggregate(pipeline);

        return result;
    } catch (e) {
        return false;
    }
}


exports.getTotalCounts = async (data) => {
    try {
        const result = await surveyModel.aggregate([
            {
                $match: {
                    managerId: new ObjectId(data.managerId),
                    deletedAt: null
                }
            },
            {
                $group: {
                    _id: null,
                    totalContacts: { $sum: { $size: "$contact" } },
                    totalQuestions: { $sum: { $size: "$questions" } }
                }
            }
        ]);

        return result.length > 0 ? result[0] : { totalContacts: 0, totalQuestions: 0 };
    } catch (error) {
        console.error('Error in getTotalCounts:', error);
        throw error;
    }
};
