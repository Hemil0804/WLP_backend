let userModel = require("../../models/user.model");
let contactModel = require("../../models/contact.model");
const constant = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.adminContactListService = async (data) => {
    try {
        console.log("assignedContactsOnly", data.assignedContactsOnly);
        console.log("assignedContacts", data.assignedContacts);

        let pipeline = [];
        // Match  only that contact  filled user-preference...
        if (data?.userPreferences && data.userPreferences != '') {
            const { stateId, cityId, zipId } = data.userPreferences;
            pipeline.push({
                $match: {
                    stateId,
                    cityId: { $in: cityId },
                    zipId: { $in: zipId },
                }
            });
        }

        // Show only the user had assigned contact ..
        if (data.assignedContactsOnly) {
            pipeline.push(
                {
                    $match: {
                        _id: { $in: data.assignedContactsOnly },
                    }
                },
            );
        }

        // Hide assigned contact from list.....
        if (data.assignedContacts?.length > 0) {
            pipeline.push(
                {
                    $match: {
                        _id: { $nin: data.assignedContacts }
                    }
                },
            );
        }

        // Filter 
        if (data.cityIds && data.cityIds?.length > 0) {
            pipeline.push(
                {
                    $match: {
                        cityId: { $in: data.cityIds },
                    }
                },
            );
        }
        if (data.zipIds && data.zipIds?.length > 0) {
            pipeline.push(
                {
                    $match: {
                        zipId: { $in: data.zipIds }
                    }
                },
            );
        }
        if (data.stateIds && data.stateIds?.length > 0) {
            pipeline.push(
                {
                    $match: {
                        stateId: { $in: data.stateIds }
                    }
                },
            );
        }

        // Address-based filtering
        let addressMatch = {};

        if (data.city && data.city.length > 0) {
            addressMatch['address.city'] = { $in: data.city };
        }

        if (data.state && data.state.length > 0) {
            addressMatch['address.state'] = { $in: data.state };
        }

        if (data.zipCode && data.zipCode.length > 0) {
            addressMatch['address.zip'] = { $in: data.zipCode };
        }

        // Add address filter if any conditions were added
        if (Object.keys(addressMatch).length > 0) {
            pipeline.push({ $match: addressMatch });
        }

        pipeline.push(
            {
                $match: {
                    status: constant.STATUS.ACTIVE,
                    "address.latitude": { $ne: null },
                    "address.longitude": { $ne: null }
                }
            },
        );


        let obj = {}
        sortBy = data.sortBy ? data.sortBy : -1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'createdAt'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['firstName', 'lastName', 'email', 'mobileNumber', 'address.city', 'address.zip', 'address.state', 'address.country']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj })
        pipeline.push({
            $facet: {
                data: data?.devicetype !== "web" ? [{ $skip: Number(data.skip) || 0 }, { $limit: Number(data.limit) || 10 }] : [],
                totalRecords: [{ $count: 'count' }]
            }
        });

        const result = await contactModel.aggregate(pipeline);

        return result;
    } catch (e) {
        console.log(e);

        return false;
    }
}