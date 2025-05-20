const userModel = require("../../models/user.model");
const contactModel = require("../../models/contact.model");
const surveyModel = require("../../models/survey.model");
const contactCityModel = require("../../models/contactCity.model");
const contactStateModel = require("../../models/contactState.model");
const contactZipCodeModel = require("../../models/contactZipCode.model");

let ObjectId = require("mongodb").ObjectId;
const constants = require("../../../config/constants");
// const { facetHelper } = require('../../helpers/paginationHelper');

exports.userAuthService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push(
            {
                $match: {
                    _id: new ObjectId(data.managerId)
                }
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "address.countryId",
                    foreignField: "_id",
                    as: "countryData"
                }
            },
            {
                $lookup: {
                    from: "states",
                    localField: "address.stateId",
                    foreignField: "_id",
                    as: "stateData"
                }
            },
            {
                $lookup: {
                    from: "cities",
                    localField: "address.cityId",
                    foreignField: "_id",
                    as: "cityData"
                }
            },
        );

        const result = await userModel.aggregate(pipeline);
        return result;

    } catch (e) {
        return false;
    }
}

// exports.getUserPrefrencesService = async (data) => {
//     try {
//         let pipeline = [];
//         pipeline.push(
//             {
//                 $match: {
//                     addressId: {$in:data.zipId}
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "zipContact",            // The collection name to join with
//                     localField: "addressId",       // Field from the contactModel to match
//                     foreignField: "uuid",          // Field from the zipContact model to match
//                     as: "zipContactInfo"           // Alias for the joined documents
//                 }
//             },
//             {
//                 $unwind: "$zipContactInfo"        // Unwind the joined array to get objects instead of arrays
//             },
//             {
//                 $lookup: {
//                     from: "citiesContact",
//                     localField: "zipContactInfo.cityId",
//                     foreignField: "uuid",
//                     as: "cityInfo"
//                 }
//             },
//             {
//                 $unwind: "$cityInfo"
//             },
//             {
//                 $lookup: {
//                     from: "statesContact",
//                     localField: "zipContactInfo.stateId",
//                     foreignField: "uuid",
//                     as: "stateInfo"
//                 }
//             },
//             {
//                 $unwind: "$stateInfo"
//             },
//         );

//         const result = await contactModel.aggregate(pipeline);
//         // console.log(result,'result');
//         // console.log(result.length,'result');

//         return result;

//     } catch (e) {
//         return false;
//     }
// }

exports.getUserPrefrencesService = async (data) => {
    try {
        let pipeline = [];
        
        pipeline.push(
            {
                $match: {
                    _id: new ObjectId(data.managerId)
                }
            },
            {
                $lookup: {
                    from: 'zipContact',
                    let: { zipIds: '$userPreferences.zipId' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$uuid', '$$zipIds'] }
                                ]
                            }
                        }
                    }],
                    as: 'zipContactInfo'
                }
            },
            {
                $lookup: {
                    from: 'citiesContact',
                    let: { cityIds: '$userPreferences.cityId' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$uuid', '$$cityIds'] }
                                ]
                            }
                        }
                    }],
                    as: 'cityInfo'
                }
            },
            {
                $lookup: {
                    from: "statesContact",
                    localField: "userPreferences.stateId", 
                    foreignField: "uuid",          
                    as: "stateInfo"                
                }
            },
            
        );

        const result = await userModel.aggregate(pipeline);
        return result;

    } catch (e) {
        return false;
    }
}


