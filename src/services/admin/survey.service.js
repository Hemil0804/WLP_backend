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
        if (data?.manager) {
            pipeline.push(
                {
                    $match: {
                        managerId: new ObjectId(data.manager)
                    }
                },
            );
        }
        pipeline.push(
            {
                $match: {
                    status: { $ne: constant.STATUS.DELETED }
                }
            },
        );
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
        sortBy = data?.sortBy ? data.sortBy : -1
        sortBy = parseInt(sortBy)
        let sortKey = data?.sortKey ? data.sortKey : 'createdAt'
        obj[sortKey] = sortBy

        if (data?.search && data.search != '') {
            let fieldsArray = ['surveyName', 'surveyDate', 'surveyStatus', 'createdAt']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj }, facetHelper(Number(data.skip), Number(data.limit)))

        const result = await surveyModel.aggregate(pipeline);
        return result;
    } catch (e) {
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
