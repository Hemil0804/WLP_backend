const fs = require('fs');
const path = require('path');
const helper = require('../../helpers/helper');
const { ObjectId } = require('mongoose').Types;
const csv = require('csv-parser');
const readXlsxFile = require("read-excel-file/node");
const constants = require('../../../config/constants');
const contactModel = require("../../models/contact.model");
const userModel = require("../../models/user.model");
const surveyModel = require("../../models/survey.model");
const questionModel = require('../../models/question.model');
const responseHelper = require('../../helpers/responseHelper');
// const questionImportService = require('../../services/admin/question.service');
const constantTransformer = require("../../transformers/admin/contact.transformer");
const { viewContactValidation } = require("../../validations/admin/contact.validation");
const { getTimestamp, setCurrentTimestamp } = require('../../helpers/dateFormat.helper');
const contactStateModel = require("../../models/contactState.model")
const contactCityModel = require("../../models/contactCity.model")
const contactZipCodeModel = require("../../models/contactZipCode.model")
const moment = require('moment'); // For date formatting
const { IMAGE_LINK } = require('../../../config/key');
const { adminContactListService } = require('../../services/admin/contact.service');
const { v4: uuidv4 } = require('uuid');
const { updateLatLongInBatches } = require('../../cron/geocode-cron');
// const csvWriter = require('csv-writer').createObjectCsvWriter; // Assuming you're using csv-writer
const { Parser } = require('json2csv');


exports.addEditContact = async (req, res) => {
    try {
        const reqBody = req.body;
        let contactExist;
        let message;

        // if the contact exists
        if (reqBody.contactId) {
            contactExist = await contactModel.findOne({ _id: reqBody.contactId, status: { $ne: constants.STATUS.DELETED_STATUS } });
            if (!contactExist) {
                return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
            message = "contactUpdatedSuccessfully";
        } else {
            contactExist = new contactModel();
            message = "contactAddedSuccessfully";
        }

        // Update or set contact fields
        contactExist.stateId = reqBody.stateId || contactExist.stateId;
        contactExist.voterNum = reqBody.voterNum || contactExist.voterNum;
        contactExist.firstName = reqBody.firstName || contactExist.firstName;
        contactExist.lastName = reqBody.lastName || contactExist.lastName;
        contactExist.email = reqBody.email || contactExist.email;
        contactExist.phone = reqBody.phone || contactExist.phone;
        contactExist.dob = reqBody.dob || contactExist.dob;
        contactExist.regDate = reqBody.regDate || contactExist.regDate;
        contactExist.district = reqBody.district || contactExist.district;
        contactExist.gender = reqBody.gender || contactExist.gender;
        contactExist.title = reqBody.title || contactExist.title;
        // contactExist.zipId = reqBody.zipId || contactExist.zipId;
        // contactExist.cityId = reqBody.cityId || contactExist.cityId;
        // contactExist.stateId = reqBody.stateId || contactExist.stateId;

        // contactExist.address = {
        //     streetAddress: reqBody?.address?.streetAddress ? reqBody.address.streetAddress : '',
        //     latitude: reqBody?.address?.latitude !== undefined ? reqBody.address.latitude : 0,
        //     longitude: reqBody?.address?.longitude !== undefined ? reqBody.address.longitude : 0,
        //     zip:  reqBody?.address.zip ?  reqBody?.address.name : '',
        //     city: reqBody?.cityId.name ? reqBody.cityId.name : '',
        //     state: reqBody?.stateId.name ? reqBody.stateId.name : '',
        //     country: 'U.S.A'
        // };


        // const address = `${reqBody.address.streetAddress},${reqBody.address.city},${reqBody.address.state},${reqBody.address.zip}`;
        // const { latitude, longitude } = await helper.getLatLong(address);
        // console.log("  longitude ", address, latitude, longitude)

        // Update or set address fields if provided


        // Save contact and transform response
        const contact = await contactExist.save();
        const response = await constantTransformer.contactViewTransform(contact);

        return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

    } catch (e) {
        console.error('Error(addEditContact)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}

exports.viewContact = async (req, res) => {
        try {
            let reqBody = req.body;

            let validationMessage = await viewContactValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            const contact = await contactModel.findOne({ _id: reqBody.contactId, status: constants.STATUS.ACTIVE }).lean();
            if (!contact) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            let getSurveyData = await surveyModel.find({ 'contact.contactId': new ObjectId(reqBody.contactId), managerId: req.user._id, status: { $ne: constants.STATUS.DELETED } });
            if (getSurveyData.length > 0) {
                getSurveyData = getSurveyData.map(item => {
                    return {
                        ...item.toObject(),  // Convert Mongoose Document to a plain object
                        totalQuestion: item.questions ? item.questions.length : 0,
                        totalPollTaker: item.polltaker ? item.polltaker.length : 0
                    };
                });
            }
            // console.log(getSurveyData);
            contact.surveyData = getSurveyData;
            const response = constantTransformer.contactViewTransform(contact);
            return responseHelper.successapi(res, res.__('contactFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

        } catch (err) {
            console.log(err)
            console.log('Error(contactView)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
}

//List Contact
exports.listContact = async (req, res) => {
        try {
            const reqBody = req.body;
            const { limitCount, skipCount } = helper.getPageAndLimit(reqBody.page, reqBody.limit);

            // Initialize variables
            let manager, assignedContactsOnly = false, assignedContacts = [];

            // Fetch manager details if managerId is provided
            if (reqBody.managerId) {
                manager = await userModel.findOne({ _id: reqBody.managerId, userRole: constants.USER_ROLE.MANAGER + '' });

                if (!manager) {
                    return responseHelper.successapi(res, res.__('managerNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
                }

                // If assignContact is true, set assignedContactsOnly to manager's assignedContacts
                if (reqBody.assignContact) {
                    assignedContactsOnly = manager.assignedContacts;
                } else {
                    assignedContacts = manager?.assignedContacts?.length > 0 ? manager.assignedContacts : [];
                }
            }

            // Build the search query
            const contactListData = await adminContactListService({
                userPreferences: manager?.userPreferences || '',
                assignedContactsOnly,
                assignedContacts,
                skip: skipCount,
                limit: limitCount,
                search: reqBody.searchText,
                sortBy: reqBody.sortBy,
                sortKey: reqBody.sortKey,
                cityIds: reqBody.cityIds,
                zipIds: reqBody.zipIds,
                stateIds: reqBody.stateIds,
                devicetype: reqBody.devicetype
            });

            // Transform the list
            contactList = contactListData && contactListData.length > 0 ? contactListData[0].data : [];

            // console.log("response")
            const response = contactList && contactList.length > 0 ? await constantTransformer.contactListTransform(contactList) : [];
            const totalCounts = contactListData && contactListData.length > 0 && contactListData[0]?.totalRecords && contactListData[0].totalRecords.length > 0 ? contactListData[0].totalRecords[0].count : 0

            return responseHelper.successapi(res, res.__("contactListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
                totalCount: totalCounts,
                totalPages: Math.ceil(totalCounts / limitCount)
            });
        } catch (e) {
            console.log("response", e)
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
}

    //Delete Contact
exports.deleteContact = async (req, res) => {
        try {
            let reqBody = req.body

            const validationMessage = await viewContactValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            let ContactExist = await surveyModel.findOne({ "contact.contactId": { $in: reqBody.contactId }, status: { $ne: constants.STATUS.DELETED } });
            if (ContactExist) return responseHelper.successapi(res, res.__('contactUsedElseWhere'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let deleteContact = await contactModel.findOneAndUpdate({ _id: reqBody.contactId, status: { $ne: constants.STATUS.DELETED } }, { $set: { status: constants.STATUS.DELETED } }, { new: true });
            if (!deleteContact) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            return responseHelper.successapi(res, res.__("contactDeletedSuccessFully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
        } catch (e) {
            console.error('Error(deleteContact)', e);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
}

exports.importContacts = async (req, res) => {
    try {
        if (!req.files) {
            return responseHelper.error(res, 'Import file is required', constants.WEB_STATUS_CODE.BAD_REQUEST);
        }
        // return false
        // const filePath = req.files.contactImportFile[0].path;
        // const contacts = [];
        // let importId = helper.generateUserUniqId()

        // fs.createReadStream(filePath).pipe(csv()).on('data', async (row) => {
        //     // const address = `${row.ADDRESS}, ${row.CITY}, ${row.STATE}, ${row.ZIP}`;
        //     // const { latitude, longitude } = await helper.getLatLong(address);
        //     // console.log("latitude   longitude  ", latitude, longitude);

        //     const contactData = {
        //         importId: importId,
        //         stateId: row.STATE_ID,
        //         voterNum: row.VOTER_NBR,
        //         firstName: row.FNAME,
        //         lastName: row.LNAME,
        //         title: row.TITLE,
        //         email: row.EMAIL || null, // Adjust as needed
        //         phone: row.PHONE,
        //         address: {
        //             streetAddress: row.ADDRESS + row.ADDRESS2,
        //             city: row.CITY,
        //             state: row.STATE,
        //             zip: row.ZIP,
        //             // latitude: latitude, // Adjust as needed
        //             // longitude: longitude, // Adjust as needed
        //             // country: 'U.S.A', // Adjust as needed
        //         },
        //         dob: getTimestamp(row.DOB, 'MM/DD/YYYY'),
        //         regDate: getTimestamp(row.REG_DATE, 'MM/DD/YYYY'),
        //         district: row.DISTRICT,
        //         gender: row.SEX,
        //         status: constants.STATUS.ACTIVE,
        //         createdAt: setCurrentTimestamp(),
        //         updatedAt: setCurrentTimestamp(),
        //     };
        //     contacts.push(contactData);
        //     console.log(contactData);
        // })
        return responseHelper.successapi(res, res.__("contactImportSuccessFully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
    } catch (error) {
        console.error('Error processing importContacts request', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
}

exports.downloadFile = async (req, res) => {
    try {
        // Fetch data from MongoDB
        const contacts = await contactModel.find().lean().exec();
    
    // Process each contact to format the dob and other fields if necessary
    const processedContacts = contacts.map(contact => ({
        VoterNumber: contact.voterNum,
        FirstName: contact.firstName,
        LastName: contact.lastName,
        Title: contact.title,
        Email: contact.email,
        Phone: contact.phone,
        // Street_Address: contact.address.streetAddress,
        City: contact.address.city,
        State: contact.address.state,
        ZIP: contact.address.zip,
        // Latitude: contact.address.latitude,
        // Longitude: contact.address.longitude,
        Country: contact.address.country,
        DOB: moment(parseInt(contact.dob)).format('DD/MM/YYYY'), // Convert DOB to dd/mm/yyyy
        Registration_Date: moment(parseInt(contact.regDate)).format('DD/MM/YYYY'),
        District: contact.district,
        Gender: contact.gender,
        Latitude: contact.latitude,
        Longitude: contact.longitude,
        // CreatedAt: moment(parseInt(contact.createdAt)).format('DD/MM/YYYY HH:mm:ss'),
        StreetAddress: contact.streetAddress,
        // Country: contact.country,
      }));
  
      // Define the fields for the CSV
      const fields = [
        'VoterNumber',
        'Title',
        'FirstName',
        'LastName',
        'Email',
        'Phone',
        'City',
        'State',
        'ZIP',
        'StreetAddress',
        'DOB',
        'Gender',
        'Latitude',
        'Longitude',
 
        // 'Country',
      ];
      
        // Convert JSON to CSV
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(processedContacts);
    
        // Save CSV file to server
        const fileName = `contacts_${Date.now()}.csv`;
        const filePath = `public/uploads/${fileName}`;
        console.log("filepath",filePath)
        fs.writeFileSync(filePath, csv);
      
        // Generate download URL
        const fileUrl = `${IMAGE_LINK}${fileName}`;

        // Send the file URL in the response
        message = 'userDataExported';
        responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, { url: fileUrl });
     
      } catch (err) {
        console.error('Error processing importContacts request', err);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
      }
}
    
exports.downloadDummyFile = async (req, res) => {
    try {
        const filePath = { link: IMAGE_LINK + "50-contacts.csv" }
        return responseHelper.successapi(res, res.__('downloadDummyFileSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, filePath);
    } catch (error) {
        console.error('Error processing importContacts request', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
}

exports.importContactsFile = async (req, res) => {
    try {
        if (!req.files) {
            return responseHelper.error(res, 'Import file is required', constants.WEB_STATUS_CODE.BAD_REQUEST);
        }

        const filePath = req.files.contactImportFile[0].path;
        const contacts = [];
        let importId = helper.generateUserUniqId();

        const createSlug = (text) => {
            return text
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        };

        // Preload all existing states, cities, and zip codes into memory
        let contactStateList = await contactStateModel.find().lean();
        let contactCityList = await contactCityModel.find().lean();
        let contactZipCodeList = await contactZipCodeModel.find().lean();

        console.log('Preloaded data:', {
            states: contactStateList.length,
            cities: contactCityList.length,
            zips: contactZipCodeList.length
        });
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                let count = 0

                console.log(results.length, 'results');
                for (row of results) {
                    try {

                        // Check for missing required fields and count them
                        if (!row.ZIP || !row.STATE || !row.CITY) {
                            console.log("!row.ZIP || !row.STATE || !row.CITY", row.ZIP, row.STATE, row.CITY);
                            count++;
                            console.warn('Skipping row due to missing required fields:', row);
                            return; // Skip this row
                        }

                        let stateSlug = createSlug(row.STATE);
                        let state = contactStateList.find(state => state.slug == stateSlug);

                        if (!state) {
                            let stateId = uuidv4();
                            let data = {
                                uuid: stateId,
                                slug: stateSlug,
                                name: row.STATE
                            };
                            await new contactStateModel(data).save();
                            contactStateList.push(data); // Update in-memory list
                            console.log("contactStateList---", contactStateList);
                            state = data;
                        }

                        let citySlug = createSlug(row.CITY);
                        let cityWithState = contactCityList.find(city => city.slug === citySlug && city.stateId == state.uuid);

                        if (!cityWithState) {
                            let cityId = uuidv4();
                            let dataState = {
                                uuid: cityId,
                                stateId: state.uuid,
                                slug: citySlug,
                                name: row.CITY
                            };
                            await new contactCityModel(dataState).save();
                            contactCityList.push(dataState); // Update in-memory list
                            cityWithState = dataState;
                        }

                        let zipWithCityState = contactZipCodeList.find(item => item.zip === row.ZIP && item.stateId == state.uuid && item.cityId == cityWithState.uuid);

                        if (!zipWithCityState) {
                            let contactId = uuidv4();
                            let dataContact = {
                                uuid: contactId,
                                cityId: cityWithState.uuid,
                                stateId: state.uuid,
                                zip: row.ZIP
                            };
                            await new contactZipCodeModel(dataContact).save();
                            contactZipCodeList.push(dataContact); // Update in-memory list
                            zipWithCityState = dataContact;
                        }

                        const contactData = {
                            importId: importId,
                            contactStateId: row.STATE_ID,
                            voterNum: row.VOTER_NBR,
                            firstName: row.FNAME,
                            lastName: row.LNAME,
                            title: row.TITLE,
                            email: row.EMAIL || null,
                            phone: row.PHONE,
                            address: {
                                streetAddress: row.ADDRESS + row.ADDRESS2,
                                city: row.CITY,
                                state: row.STATE,
                                zip: row.ZIP,
                            },
                            zipId: zipWithCityState.uuid,
                            cityId: zipWithCityState.cityId,
                            stateId: zipWithCityState.stateId,
                            dob: getTimestamp(row.DOB, 'MM/DD/YYYY'),
                            regDate: getTimestamp(row.REG_DATE, 'MM/DD/YYYY'),
                            district: row.DISTRICT,
                            gender: row.SEX,
                            status: constants.STATUS.ACTIVE,
                            createdAt: setCurrentTimestamp(),
                            updatedAt: setCurrentTimestamp(),
                        };
                        contacts.push(contactData);

                    } catch (innerError) {
                        console.error('Error processing row:', row, innerError);
                    }
                }
                console.error('skip contact count is :', count);
                try {
                    console.log('contacts.length----', contacts.length);
                    await contactModel.insertMany(contacts);
                    responseHelper.successapi(res, res.__("contactImportSuccessFully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

                     // Trigger the updateLatLongInBatches function after inserting data
                     // setTimeout(async () => {
                     //     await updateLatLongInBatches();
                     //     console.log('Lat/long update completed');
                     // }, 0); // 0ms delay to run immediately after response is sent

                } catch (error) {
                    console.error('Error saving contacts:', error);
                    return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
                }
              
            })
    } catch (error) {
        console.error('Error processing importContacts request', error);
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
}

// exports.importContactsFile = async (req, res) => {
//     try {
//         if (!req.files) {
//             return responseHelper.error(res, 'Import file is required', constants.WEB_STATUS_CODE.BAD_REQUEST);
//         }

//         const filePath = req.files.contactImportFile[0].path;
//         const contacts = [];
//         let importId = helper.generateUserUniqId();

//         const createSlug = (text) => {
//             return text
//                 .toLowerCase()
//                 .trim()
//                 .replace(/[^a-z0-9\s-]/g, '')
//                 .replace(/\s+/g, '-')
//                 .replace(/-+/g, '-');
//         };

//         // Preload all existing states, cities, and zip codes into memory
//         let contactStateList = await contactStateModel.find().lean();
//         let contactCityList = await contactCityModel.find().lean();
//         let contactZipCodeList = await contactZipCodeModel.find().lean();

//         console.log('Preloaded data:', {
//             states: contactStateList.length,
//             cities: contactCityList.length,
//             zips: contactZipCodeList.length
//         });

//         // Track new entries for batch insertion
//         let newStates = [];
//         let newCities = [];
//         let newZipCodes = [];

//         fs.createReadStream(filePath).pipe(csv())
//             .on('data', async (row) => {
//                 try {
//                     if (!row.ZIP || !row.STATE || !row.CITY) {
//                         console.warn('Skipping row due to missing required fields:', row);
//                         return; // Skip this row
//                     }

//                     let stateSlug = createSlug(row.STATE);
//                     let state = contactStateList.find(state => state.slug == stateSlug);

//                     if (!state) {
//                         let stateId = uuidv4();
//                         let data = {
//                             uuid: stateId,
//                             slug: stateSlug,
//                             name: row.STATE
//                         };

//                         newStates.push(data);
//                         contactCityList.push(data); 
//                         console.log("contactStateList---", contactStateList);
//                         state = stateData;
//                     }

//                     let citySlug = createSlug(row.CITY);
//                     let cityWithState = contactCityList.find(city => city.slug === citySlug && city.stateId == state.uuid);

//                     if (!cityWithState) {
//                         let cityId = uuidv4();
//                         let dataState = {
//                             uuid: cityId,
//                             stateId: state.uuid,
//                             slug: citySlug,
//                             name: row.CITY
//                         };
                     
//                         newCities.push(dataState); // Update in-memory list
//                         contactCityList.push(dataState); // Update in-memory list
//                         cityWithState = dataState;
//                     }

//                     let zipWithCityState = contactZipCodeList.find(item => item.zip === row.ZIP && item.stateId == state.uuid && item.cityId == cityWithState.uuid);

//                     if (!zipWithCityState) {
//                         let contactId = uuidv4();
//                         let dataContact = {
//                             uuid: contactId,
//                             cityId: cityWithState.uuid,
//                             stateId: state.uuid,
//                             zip: row.ZIP
//                         };
//                         newZipCodes.push(dataContact);
//                         contactZipCodeList.push(dataContact); // Update in-memory list
//                         zipWithCityState = dataContact;
//                     }

//                     const contactData = {
//                         importId: importId,
//                         contactStateId: row.STATE_ID,
//                         voterNum: row.VOTER_NBR,
//                         firstName: row.FNAME,
//                         lastName: row.LNAME,
//                         title: row.TITLE,
//                         email: row.EMAIL || null,
//                         phone: row.PHONE,
//                         address: {
//                             streetAddress: row.ADDRESS + row.ADDRESS2,
//                             city: row.CITY,
//                             state: row.STATE,
//                             zip: row.ZIP,
//                         },
//                         zipId: zipWithCityState.uuid,
//                         cityId: zipWithCityState.cityId,
//                         stateId: zipWithCityState.stateId,
//                         dob: getTimestamp(row.DOB, 'MM/DD/YYYY'),
//                         regDate: getTimestamp(row.REG_DATE, 'MM/DD/YYYY'),
//                         district: row.DISTRICT,
//                         gender: row.SEX,
//                         status: constants.STATUS.ACTIVE,
//                         createdAt: setCurrentTimestamp(),
//                         updatedAt: setCurrentTimestamp(),
//                     };
//                     contacts.push(contactData);
//                     // console.log(contactData);
//                 } catch (innerError) {
//                     console.error('Error processing row:', row, innerError);
//                 }
//             })
//             .on('end', async () => {
//                 try {
//                     if (newStates.length > 0) {
//                         await contactStateModel.insertMany(newStates);
//                     }
//                     if (newCities.length > 0) {
//                         await contactCityModel.insertMany(newCities);
//                     }
//                     if (newZipCodes.length > 0) {
//                         await contactZipCodeModel.insertMany(newZipCodes);
//                     }

//                     // await contactModel.insertMany(contacts);
//                     responseHelper.successapi(res, res.__("contactImportSuccessFully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

//                     // // Trigger the updateLatLongInBatches function after inserting data
//                     // setTimeout(async () => {
//                     //     await updateLatLongInBatches();
//                     //     console.log('Lat/long update completed');
//                     // }, 0); // 0ms delay to run immediately after response is sent
//                 } catch (error) {
//                     console.error('Error saving contacts:', error);
//                     return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
//                 }
//             });

//     } catch (error) {
//         console.error('Error processing importContacts request', error);
//         return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
//     }
// }

// exports.activeInactive = async (req, res) => {
//     try {
//         const reqBody = req.body;

//         let checkContact = await contactModel.findOne({ _id: reqBody.ContactId, status: { $ne: DELETED_STATUS } });
//         if (!checkContact) return responseHelper.successapi(res, res.__('ContactNotFound'), META_STATUS_0, SUCCESS);

//         if (checkContact.status === ACTIVE_STATUS) {
//             let ContactExist = await catalogModel.findOne({ ContactId: reqBody.ContactId, status: { $ne: DELETED_STATUS } });
//             if (ContactExist) return responseHelper.successapi(res, res.__('ContactUsedElseWhere'), META_STATUS_0, SUCCESS);

//             await contactModel.updateOne({ _id: checkContact._id }, { $set: { status: INACTIVE_STATUS } })
//         }
//         if (checkContact.status === INACTIVE_STATUS) {
//             await contactModel.updateOne({ _id: checkContact._id }, { $set: { status: ACTIVE_STATUS } })
//         }
//         return responseHelper.successapi(res, res.__("ContactUpdatedSuccessfully"), META_STATUS_1, SUCCESS)
//     } catch (e) {
//         logger.logger.error(`Error from catch: ${e}`);
//         return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), SERVERERROR);
//     }
// };

// exports.list = async (req, res) => {
//     try {
//         // let deviceType = req?.headers?.devicetype ?   constants.DEVICE_TYPE.WEB :req.headers.devicetype;
//         let reqBody = req.body;
//         let contactList;

//         const page = parseInt(reqBody.page) || 1;
//         const limit = parseInt(reqBody.limit) || 10;
//         const skip = (page - 1) * limit;
//         const searchText = reqBody.searchText || '';

//         // Build the search query
//         let searchQuery = { status: constants.STATUS.ACTIVE };
//         if (searchText) {
//             searchQuery.$or = [
//                 { "firstName": { $regex: searchText, $options: 'i' } },
//                 { "lastName": { $regex: searchText, $options: 'i' } },
//                 { "email": { $regex: searchText, $options: 'i' } },
//                 { "mobileNumber": { $regex: searchText, $options: 'i' } },
//                 { "address.city": { $regex: searchText, $options: 'i' } },
//                 { "address.zipCode": { $regex: searchText, $options: 'i' } },
//                 { "address.state": { $regex: searchText, $options: 'i' } },
//                 { "address.country": { $regex: searchText, $options: 'i' } }
//             ];
//         }

//         if (reqBody.city && reqBody.city.length > 0) {
//             searchQuery['address.city'] = { $in: reqBody.city };
//         }

//         // Add state filter if provided
//         if (reqBody.state && reqBody.state.length > 0) {
//             searchQuery['address.state'] = { $in: reqBody.state };
//         }

//         // Add zip code filter if provided
//         if (reqBody.zipCode && reqBody.zipCode.length > 0) {
//             searchQuery['address.zip'] = { $in: reqBody.zipCode };
//         }


//         // Get the total count of active contacts
//         const totalCount = await contactModel.countDocuments(searchQuery);

//         if (reqBody.devicetype === "web") {
//             contactList = await contactModel.find(searchQuery)
//         } else {
//             // Fetch the paginated list of active contacts
//             contactList = await contactModel.find(searchQuery)
//                 .skip(skip)
//                 .limit(limit);
//         }

//         // Transform the list
//         const response = contactList && contactList.length > 0 ? constantTransformer.contactListTransform(contactList) : [];

//         return responseHelper.successapi(res, res.__("contactListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
//             totalCount,
//             currentPage: page,
//             totalPages: Math.ceil(totalCount / limit)
//         });
//     } catch (e) {
//         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
//     }
// },

