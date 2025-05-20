const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const Mailer = require('./Mailer');
const axios = require('axios');
const bcrypt = require('bcrypt');
const constants = require('../../config/constants');
// const config = require("../models/config.model");
const userModel = require("../models/user.model")
const NodeGeocoder = require('node-geocoder');

// const bulkImportModel = require('../models/bulkimport.model');
// const subjectModel = require('../models/subject.model');
const { ObjectId } = require('mongoose').Types;
// let now = require('performance-now');
const { IMAGE_LINK, DEFAULT_IMAGE_LINK, STORAGE_TYPE, PAGINATION_LIMIT, YOUR_GOOGLE_GEOCODING_API_KEY } = require('../../config/key');
// const { PDFDocument } = require('pdf-lib');
const questionModel = require('../models/question.model');
// const { updateManyBulkImport } = require('../services/admin/bulkimport.service');
const dateFormat = require('./dateFormat.helper');
// const AdmZip = require('adm-zip');


const toUpperCaseValidation = (str) => {
    if (str?.length) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    return '';
};

const validationMessageKey = (apiTag, error) => {

    let key = module.exports.toUpperCaseValidation(error.details[0].context.key);
    let type = error.details[0].type.split('.');
    type[1] = type[1] === 'empty' ? 'required' : type[1];
    type = module.exports.toUpperCaseValidation(type[1]);
    key = apiTag + key + type;
    return key;
};

const imageURL = (imageName, fileName, fieldName) => {
    let urlData = '';
    if (fileName === "images") {
        urlData = `${DEFAULT_IMAGE_LINK}${fileName}/${imageName}`;
    } else {
        urlData = `${IMAGE_LINK}${fileName}/${imageName}`;
    }
    const pathOfImage = `public/uploads/${fileName}/${imageName}`;

    if (fs.existsSync(pathOfImage)) {
        return urlData;
    } else {
        if (fieldName === "profileImage") urlData = `${IMAGE_LINK}${fileName}/${fileName}DefaultProfileImage.png`
        if (fieldName === "pdf") urlData = `${IMAGE_LINK}defaultPdf.pdf`
        if (fieldName === "image") urlData = `${IMAGE_LINK}defaultImage.png`
        return urlData;
    }
};

const getEmailTemplatePath = (link, language) => language == 'it' ? link.replace('.ejs', '-it.ejs') : link;

const sendOtpEmail = async (req) => {
    let locals = {
        userName: req.firstName || req.fullName,
        appname: 'WLP',
        otp: req.otp,
        email: req.email ? req.email : '',
        baseUrl: req.baseUrl,
    };
    console.log("locals--------------",locals);

    if (req?.password) locals.password = req.password;

    let emailTemplatePath = getEmailTemplatePath(req.path, req.language);

    const emailBody = await ejs.renderFile(emailTemplatePath, { locals: locals });
    //sending mail to user
    Mailer.sendEmail(req.email, emailBody, req.subject);
};

const sendInquiryEmail = async (req) => {

    let locals = {
        name: req.name,
        appname: 'WLP',
        baseUrl: req.baseUrl,
    };

    let emailTemplatePath = getEmailTemplatePath(req.path);

    const inquiryObj = {
        inquiryTitle: req.inquiryTitle,
        inquiryPdf: req.inquiryPdf
    }

    const emailBody = await ejs.renderFile(emailTemplatePath, { locals: locals });

    //sending mail to user
    Mailer.sendCourseInquiryEmail(req.email, emailBody, req.subject, inquiryObj);
};


const sendCustomEmailBookingEmail = async (req) => {
    let locals = {
        subject: req.subject,
        emailBody: req.emailBody,
        appname: 'WLP',
        baseUrl: req.baseUrl,
    };
    const emailBody = await ejs.renderFile(req.path, { locals: locals });
    //sending mail to user
    Mailer.sendEmail(req.email, emailBody, req.subject);
};

const generateOTP = (ENV = 'local') => {
    let otp = ENV == 'local' ? '123456' : Math.floor(Math.random() * 900000) + 100000;
    otp = parseInt(otp);
    return otp;
};

//uniqId generate...
const generateUserUniqId = () => {
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `Import${number}`
};

// axiosRetry(axios, {
//     retries: 3,
//     retryCondition: (error) => {
//         return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
//     },
//     retryDelay: (retryCount) => {
//         console.log(`Retry attempt: ${retryCount}`);
//         return retryCount * 2000; // 2 seconds delay between retries
//     },
// });
 
    async function getLatLong(address, retries = 3) {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: address,
                    key: YOUR_GOOGLE_GEOCODING_API_KEY
                }
            });
    
            if (response.data.status === 'OK') {
                const location = response.data.results[0].geometry.location;
                return { latitude: location.lat, longitude: location.lng };
            } else {
                throw new Error(`Geocoding API error: ${response.data.status}`);
            }
        } catch (error) {
            if (retries > 0) {
                console.warn(`Retrying geocode fetch: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return getLatLong(address, retries - 1);
            } else {
                console.error(`Error fetching geocode after retries: ${error.message}`);
                return { latitude: null, longitude: null }; // Return null values in case of error
            }
        }
    }
    
// geocoding api example...
// (async () => {
//     const address = '7226 WHITE OAK DR, FAIRVIEW, TN, 37062-9344';
//     const { latitude, longitude } = await getLatLong(address);
//     console.log("Latitude:", latitude, "Longitude:", longitude, "Address:", address);
// })();


// const readCounterFromConfig = async () => {
//     try {
//         const configData = await config.findOne()
//         return configData.userCounter ? configData.userCounter : 1;
//     } catch (error) {
//         console.error('Error reading counter from database:', error);
//         return 1;
//     }
// };

// // Function to write the counter to the database
// const updateCounterToConfig = async (counter) => {
//     try {
//         await config.findOneAndUpdate({}, { userCounter: counter }, { upsert: true });
//     } catch (error) {
//         console.error('Error writing counter to database:', error);
//     }
// };

// // Function to generate the number
// const generateUserName = async () => {
//     let counter = await readCounterFromConfig();
//     const number = `SKEY${counter.toString().padStart(6, '0')}`;
//     counter += 1;
//     await updateCounterToConfig(counter);
//     return number;
// };

// const getLatLong = async (address) => {

//         const options = {
//             provider: 'google',        
//             apiKey: 'AIzaSyDwnry3r_UIPKiFQY0Ghm6hWbLTIScxywU'
//         };

//         const geocoder = NodeGeocoder(options);

//         // Using callback
//         const res = await geocoder.geocode('29 champs elysée paris');
//         console.log("res---->",res)

// }

const deleteFilesIfAnyValidationError = async (files) => {
    try {
        if (Object.keys(files)) {
            let field = Object.keys(files);
            if (field.length > 0) {
                for (let element of field) {
                    let uploadedFiles = files[element];
                    if (uploadedFiles) {
                        uploadedFiles.forEach(x => {

                            let folderName = x.destination.split('/')[x.destination.split('/').length - 1];
                            deleteLocalFile(folderName, x.filename);
                        });
                    }
                }
            }

        }
    } catch (err) {
        console.log('Error(deleteFilesIfAnyValidationError)', err);
    }
};

const generateReferralCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';

    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    return code;
}

const checkAndGenerateReferralCode = async () => {
    let isReferralCode = generateReferralCode();
    let existReferralCode = await userModel.findOne({ referralCode: isReferralCode, status: { $ne: constants.STATUS.DELETED } });
    if (existReferralCode) return checkAndGenerateReferralCode();
    return isReferralCode;
}


const getSeederAdmins = async () => {
    let adminArr = [
        {
            firstName: 'Admin',
            lastName: 'WLP',
            email: 'wlp.admin0023@yopmail.com',
            password: await bcrypt.hash('123456', 10),
        },
        {
            firstName: 'MY',
            lastName: 'WLP',
            email: 'admin.maulik@yopmail.com',
            password: await bcrypt.hash('123456', 10),
        },
    ];
    return adminArr;
};

const deleteFile = async (data) => {
    if (data.name !== '') {
        if (process.env.STORAGE === 's3') {
            // await s3.deleteObject({
            //     Bucket: `${AMAZON_BUCKET_NAME}/public/uploads/${data.folderName}`,
            //     Key: `${data.name}`
            // }).promise();
        } else {
            const filePath = path.join(
                __dirname,
                `../../public/uploads/${data.folderName}/${data.name}`
            );
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
                console.log('File deleted successfully', filePath);
            } else {
                console.log('File not found on this path', filePath);
            }
        }
    }
};

const deleteLocalFile = async (folderName, fileName) => {
    const filePath = path.join(
        __dirname,
        `../../public/uploads/${folderName}/${fileName}`
    );

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File deleted successfully', filePath);
    } else {
        console.log('File not found on this path', filePath);
    }
};

const createLocalFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            fs.closeSync(fs.openSync(filePath, 'w+'));
            return true;
        }
    } catch (err) {
        console.log('Error(createLocalFile): ', err);
        return false;
    }
}

const getFileName = async (file) => (
    (file) ? ((STORAGE_TYPE === "S3") ? path.basename(file.key) : file.filename) : ""
)

const getPageAndLimit = (page, limit) => {
    if (!page) page = constants.PAGE;
    if (!limit) limit = constants.LIMIT;
    let limitCount = limit * 1;
    let skipCount = (page - 1) * limitCount;
    return { limitCount, skipCount };
};

const paginateInArray = (array, page_size, page_number) => {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
};

const thankYouEmail = async (req) => {
    let locals = { baseUrl: req.baseUrl, telephoneNumber: req.telephoneNumber, userName: req.firstName + ' ' + req.lastName, };

    let emailTemplatePath = getEmailTemplatePath(req.path, req.language);

    const emailBody = await ejs.renderFile(emailTemplatePath, { locals: locals });
    //sending mail to user
    Mailer.sendEmail(req.email, emailBody, req.subject);
};


const contactUsEmail = async (req) => {
    let locals = {
        userName: req.firstName + ' ' + req.lastName,
        email: req.email,
        firstName: req.firstName,
        lastName: req.lastName,
        mobileNumber: req.mobileNumber,
        message: req.message,
        subject: req.subject,
        baseUrl: req.baseUrl,
    };
    const emailBody = await ejs.renderFile(req.path, { locals: locals });
    //sending mail to user
    Mailer.sendAdminEmail(req.to, emailBody, req.subject, locals.userName);
};

const facetHelper = (skip, limit) => {
    return {
        $facet: {
            data: [
                {
                    $skip: Number(skip) < 0 ? 0 : Number(skip) || 0,
                },
                {
                    $limit: Number(limit) < 0 ? constants.LIMIT : Number(limit) || constants.LIMIT,
                },
            ],
            totalRecords: [
                {
                    $count: 'count',
                },
            ],
        },
    };
};

const searchHelper = (searchField, fields) => {
    let orArr = [];
    let search = [];

    searchField = searchField.replace(/[\*()+?[]/g, '');
    searchField = searchField.replace(']', '');
    search[0] = searchField.trim();

    fields.forEach((element1) => {
        search.forEach((element) => {
            orArr.push({ [element1]: { $regex: new RegExp(element, 'i') } });
        });
    });
    return { $match: { $or: orArr } };
};

const searchHelperForController = (searchField, fields) => {
    let orArr = [];
    let search = [];

    searchField = searchField.replace(/[\*()+?[]/g, '');
    searchField = searchField.replace(']', '');
    search[0] = searchField.trim();

    fields.forEach((element1) => {
        search.forEach((element) => {
            orArr.push({ [element1]: { $regex: new RegExp(element, 'i') } });
        });
    });
    return { $or: orArr };
};

const sortBy = (sortBy, sortKey) => {
    let obj = {};
    sortBy = sortBy ? sortBy : -1;
    sortBy = parseInt(sortBy);
    sortKey = sortKey ? sortKey : 'createdAt';
    obj[sortKey] = sortBy;
    return obj;
};

const sortDataBy = (sortBy) => {

    let order = -1, field = 'createdAt';
    if (sortBy) {
        sortBy = sortBy.split(':');
        field = sortBy[0];
        order = +sortBy[1] || -1;
    }
    let obj = {
        [field]: order
    };
    return obj;
};

const makeFolderOnLocal = (fileUploadPath) => {
    if (!fs.existsSync(fileUploadPath)) {
        fs.mkdirSync(fileUploadPath, { recursive: true });
    }
};

const groupBy = (xs, key) =>
    xs.reduce((rv, x) => {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});

const downloadImage = (url, image_path) =>
    axios({
        url,
        responseType: 'stream',
    }).then(
        response =>
            new Promise((resolve, reject) => {
                response.data
                    .pipe(fs.createWriteStream(image_path))
                    .on('finish', () => resolve())
                    .on('error', e => reject(e));
            }),
    );

const isEmptyObject = (object) => {
    if (Object.keys(object).length === 0 && Object.getPrototypeOf(object) === Object.prototype && object.constructor === Object && Object.entries(object).length === 0) {
        return true
    } else {
        return false
    }
}

const replaceStringWithObjectData = (str, object) => {
    if (!isEmptyObject(object)) {
        stringStartSymbol = (typeof (constants.ENCRYPT_STRING.START_SYMBOL) === undefined) ? '{!{' : constants.ENCRYPT_STRING.START_SYMBOL

        stringEndSymbol = (typeof (constants.ENCRYPT_STRING.END_SYMBOL) === undefined) ? '}!}' : constants.ENCRYPT_STRING.END_SYMBOL

        for (let data in object) {

            msg = stringStartSymbol + data + stringEndSymbol
            str = str.replace(new RegExp(msg, 'g'), object[data])  //for replace all occurance
            //str = str.replace(msg, object[data])
        }
        return str;
    }
    return '';
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getImageName = (image) => {
    let url = image
    url = url.split("/").pop()
    return url
}

const hasDuplicate = (arr, key) => {
    const seen = new Set();
    for (const item of arr) {
        const value = item[key];
        if (seen.has(value)) {
            return true; // Duplicate found
        }
        seen.add(value);
    }
    return false; // No duplicates found
};

const getPDFPageCount = async (pdfPath) => {
    console.log(pdfPath)
    const pdfBytes = await fs.promises.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
};

const writePdfBytesToFile = (fileName, pdfBytes) => {
    return fs.promises.writeFile(fileName, pdfBytes);
}

// const PDFDocument = require('pdf-lib').PDFDocument;

const generatePreviewOfPdf = async (pathToPdf, newPdfPath, pages) => {
    try {

        console.log('----------------------------- Generating preview pdf -----------------------------');

        const docmentAsBytes = await fs.promises.readFile(pathToPdf);

        // Load your PDFDocument
        const pdfDoc = await PDFDocument.load(docmentAsBytes)

        const numberOfPages = pdfDoc.getPages().length;
        console.log('numberOfPages---------------', numberOfPages);

        const subDocument = await PDFDocument.create();
        for (let i = 0; i < pages; i++) {

            // Create a new "sub" document
            // copy the page at current index
            const [copiedPage] = await subDocument.copyPages(pdfDoc, [i])
            subDocument.addPage(copiedPage);

        }
        const pdfBytes = await subDocument.save()
        await writePdfBytesToFile(newPdfPath, pdfBytes);
        console.log('Sample pdf generated ---------------------------', newPdfPath);
        return newPdfPath;
    } catch (err) {
        console.log('Error(generatePreviewOfPdf)', err);
        return false;
    }
}

const readFirstLine = async (path) => {
    const { createInterface } = require('readline');
    const inputStream = fs.createReadStream(path);
    try {
        for await (const line of createInterface(inputStream)) return line;
        return ''; // If the file is empty.
    } catch (err) {
        console.log('error in reading first line ', err);
    }
    finally {
        inputStream.destroy(); // Destroy file stream.
    }
}


const validateQuestionImportFields = async (bulkImportId, extractedImageFilesList = [], zipFilePathLocal = null) => {
    try {
        console.log('zipFilePathLocal', zipFilePathLocal);
        const startI = now();

        const numbersOnly = /^[0-9]+$/;
        const onlyNumbersAndLetters = /^[A-Za-z0-9_ ]*$/;
        const questionTypeRegex = /\b(quiz|challenges|both)\b/i;
        const optionTypeRegex = /\b(text|image)\b/i;
        const correctAnswerRegex = /\b(a|b|c|d|e)\b/i;
        const optionCRegex = /\b(c)\b/i;
        const optionDRegex = /\b(d)\b/i;
        const optionERegex = /\b(e)\b/i;
        const textRegex = /\b(text)\b/i;
        const imageRegex = /\b(image)\b/i;
        const quizRegex = /\b(quiz)\b/i
        const challengesRegex = /\b(challenges)\b/i
        const bothRegex = /\b(both)\b/i

        let localValidations = [
            {
                $cond: [
                    { $not: { $eq: ['$bulkImportData.Subject', ''] } },
                    '',
                    'subject,',
                ]
            },
            {
                $cond: [
                    { $regexMatch: { input: "$bulkImportData.Question Type", regex: questionTypeRegex } },
                    '',
                    'questionType,',
                ]
            },
            {
                $cond: [
                    { $not: { $eq: ["$bulkImportData.Question Title (En)", ''] } },
                    '',
                    'questionTitle,',
                ]
            },
            {
                $cond: [
                    { $not: { $eq: ["$bulkImportData.Question Title (It)", ''] } },
                    '',
                    'questionTitle(It),',
                ]
            },
            {
                $cond: [
                    { $regexMatch: { input: "$bulkImportData.Question Type", regex: questionTypeRegex } },
                    '',
                    'questionType,',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $not: { $eq: ['$bulkImportData.Option A Type', ''] } },
                            { $regexMatch: { input: "$bulkImportData.Option A Type", regex: optionTypeRegex } },
                            // { $not: { $eq: ['$bulkImportData.Option A (En)', ''] } }
                        ]
                    },
                    '',
                    'option a, ',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $regexMatch: { input: "$bulkImportData.Option A Type", regex: textRegex } },
                            {
                                $or: [
                                    { $eq: ['$bulkImportData.Option A (En)', ''] },
                                    { $eq: ['$bulkImportData.Option A (It)', ''] },
                                ]
                            }
                        ]
                    },
                    'option a, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $not: { $eq: ['$bulkImportData.Option B Type', ''] } },
                            { $regexMatch: { input: "$bulkImportData.Option B Type", regex: optionTypeRegex } },
                            // { $not: { $eq: ['$bulkImportData.Option B (En)', ''] } }
                        ]
                    },
                    '',
                    'option b, ',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $regexMatch: { input: "$bulkImportData.Option B Type", regex: textRegex } },
                            {
                                $or: [
                                    { $eq: ['$bulkImportData.Option B (En)', ''] },
                                    { $eq: ['$bulkImportData.Option B (It)', ''] },
                                ]
                            }
                        ]
                    },
                    'option b, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $not: { $eq: ['$bulkImportData.Option C Type', ''] } },
                            { $regexMatch: { input: "$bulkImportData.Option C Type", regex: optionTypeRegex } },
                            // { $not: { $eq: ['$bulkImportData.Option C (En)', ''] } }
                        ]
                    },
                    '',
                    'option c, ',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $regexMatch: { input: "$bulkImportData.Option C Type", regex: textRegex } },
                            {
                                $or: [
                                    { $eq: ['$bulkImportData.Option C (En)', ''] },
                                    { $eq: ['$bulkImportData.Option C (It)', ''] },
                                ]
                            }
                        ]
                    },
                    'option c, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $not: { $eq: ['$bulkImportData.Option D Type', ''] } },
                            { $regexMatch: { input: "$bulkImportData.Option D Type", regex: optionTypeRegex } },
                            // { $not: { $eq: ['$bulkImportData.Option D (En)', ''] } }
                        ]
                    },
                    '',
                    'option d, ',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $regexMatch: { input: "$bulkImportData.Option D Type", regex: textRegex } },
                            {
                                $or: [
                                    { $eq: ['$bulkImportData.Option D (En)', ''] },
                                    { $eq: ['$bulkImportData.Option D (It)', ''] },
                                ]
                            }
                        ]
                    },
                    'option d, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $not: { $eq: ['$bulkImportData.Option E Type', ''] } },
                            { $regexMatch: { input: "$bulkImportData.Option E Type", regex: optionTypeRegex } },
                            // { $not: { $eq: ['$bulkImportData.Option E (En)', ''] } }
                        ]
                    },
                    '',
                    'option e, ',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $regexMatch: { input: "$bulkImportData.Option E Type", regex: textRegex } },
                            {
                                $or: [
                                    { $eq: ['$bulkImportData.Option E (En)', ''] },
                                    { $eq: ['$bulkImportData.Option E (It)', ''] },
                                ]
                            }
                        ]
                    },
                    'option e, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $not: { $eq: ['$bulkImportData.Correct Answer', ''] } },
                            { $regexMatch: { input: '$bulkImportData.Correct Answer', regex: correctAnswerRegex } }
                        ]
                    },
                    '',
                    'correctAnswer, '
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $eq: ['$bulkImportData.Option C Type', ''] },
                            { $regexMatch: { input: "$bulkImportData.Correct Answer", regex: optionCRegex } },
                        ]
                    },
                    'correctAnswerC, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $eq: ['$bulkImportData.Option D Type', ''] },
                            { $regexMatch: { input: "$bulkImportData.Correct Answer", regex: optionDRegex } },
                        ]
                    },
                    'correctAnswerD, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $and: [
                            { $eq: ['$bulkImportData.Option E Type', ''] },
                            { $regexMatch: { input: "$bulkImportData.Correct Answer", regex: optionERegex } },
                        ]
                    },
                    'correctAnswerE, ',
                    '',
                ]
            },
            {
                $cond: [
                    {
                        $or: [
                            { $eq: ['$bulkImportData.Explanation(En)', ''] },
                            { $eq: ['$bulkImportData.Explanation(It)', ''] }
                        ]
                    },
                    'explanation, ',
                    '',
                ]
            },
        ];

        let updatedDatas = await bulkImportModel.updateMany({ bulkImportId: bulkImportId }, [{
            $set: {
                errorFields: { $concat: localValidations },
            }
        }]);

        console.log('updatedDatas :>> ', updatedDatas);


        let subjectValidation = [
            {
                $match: {
                    bulkImportId: bulkImportId,
                    errorFields: ''
                }
            },
            {
                $lookup: {
                    from: "subjects",
                    let: {
                        subject: "$bulkImportData.Subject",
                        regex: { $concat: ["^", '$bulkImportData.Subject'] }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $regexMatch: {
                                        input: "$name",
                                        regex: "$$regex",
                                        options: "i"
                                    }
                                }
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                            },
                        },
                    ],
                    as: "subjectDetails",
                }
            },
            {
                $addFields: {
                    subjectDetails: '$subjectDetails',
                    subjectExists: { $eq: [{ $size: '$subjectDetails' }, 1] },
                }
            },
            {
                $project: {
                    subjectExists: 1,
                    subjectDetails: 1,
                    "rowNumber": 1
                }
            }
        ];


        let isSubjectExists = await bulkImportModel.aggregate(subjectValidation).collation({ locale: 'en_US', strength: 1 });

        console.log('isSubjectExists :>> ', isSubjectExists.length);


        let j = 0, successData = [], subjectNotMatchedData = [];

        while (j < isSubjectExists.length) {

            let eachData = isSubjectExists[j];
            if (eachData?.subjectExists) {
                successData.push({
                    _id: eachData?._id,
                    rowNumber: eachData?.rowNumber,
                    subject: eachData?.subjectDetails?.map(y => y?._id)
                });
            } else {
                subjectNotMatchedData.push(eachData?._id);
            }

            isSubjectExists.shift();
        }


        if (successData.length) {

            //Insert data in location collection and delete all ids getting from isSubjectExists

            let successBulkImportIds = successData.map(t => t?._id);


            [bulkImportSuccessData,] = await Promise.all([
                bulkImportModel.find({ _id: { $in: successBulkImportIds } }).select('bulkImportData rowNumber'),
                bulkImportModel.updateMany({ _id: { $in: successBulkImportIds } }, { $set: { status: 2 } })
            ]);

            successBulkImportIds = [];

            successData = await Promise.all(bulkImportSuccessData.map(async (el) => {

                let x = el?.bulkImportData;
                let obj = {
                    questionType: quizRegex.test(x?.['Question Type']) ? [constants.QUESTION_TYPE.QUIZ] : challengesRegex.test(x?.['Question Type']) ? [constants.QUESTION_TYPE.CHALLENGES] : bothRegex.test(x?.['Question Type']) ? [constants.QUESTION_TYPE.QUIZ, constants.QUESTION_TYPE.CHALLENGES] : [constants.QUESTION_TYPE.QUIZ, constants.QUESTION_TYPE.CHALLENGES],
                    questionTitle: x?.['Question Title (En)']?.trim() || '',
                    questionTitleIt: x?.['Question Title (It)']?.trim() || '',
                    explanation: x?.['Explanation(En)']?.trim() || '',
                    explanationIt: x?.['Explanation(It)']?.trim() || '',
                    correctAnswer: x?.['Correct Answer']?.trim()?.toLowerCase() || '',
                    rowNumber: el?.rowNumber,
                    createdAt: dateFormat.setCurrentTimestamp(),
                    updatedAt: dateFormat.setCurrentTimestamp(),
                };

                obj.subject = successData.find(t => t.rowNumber == el.rowNumber)?.subject;

                obj.mcqOptions = [];

                let optionAEn = x?.['Option A (En)']?.trim() || '';
                let optionAIt = x?.['Option A (It)']?.trim() || '';
                let optionBEn = x?.['Option B (En)']?.trim() || '';
                let optionBIt = x?.['Option B (It)']?.trim() || '';
                let optionCEn = x?.['Option C (En)']?.trim() || '';
                let optionCIt = x?.['Option C (It)']?.trim() || '';
                let optionDEn = x?.['Option D (En)']?.trim() || '';
                let optionDIt = x?.['Option D (It)']?.trim() || '';
                let optionEEn = x?.['Option E (En)']?.trim() || '';
                let optionEIt = x?.['Option E (It)']?.trim() || '';

                if (textRegex.test(x?.['Option A Type'])) {
                    obj.mcqOptions.push({
                        name: 'a',
                        type: constants.MCQ_OPTIONS_TYPE.STRING,
                        index: 0,
                        description: optionAEn,
                        descriptionIt: optionAIt,
                        isCorrect: false,
                    });
                } else if (imageRegex.test(x?.['Option A Type'])) {
                    obj.mcqOptions.push({
                        name: 'a',
                        type: constants.MCQ_OPTIONS_TYPE.IMAGE,
                        index: 0,
                        description: '',
                        descriptionIt: '',
                        isCorrect: false,
                    });
                }

                if (textRegex.test(x?.['Option B Type'])) {
                    obj.mcqOptions.push({
                        name: 'b',
                        type: constants.MCQ_OPTIONS_TYPE.STRING,
                        index: 1,
                        description: optionBEn,
                        descriptionIt: optionBIt,
                        isCorrect: false,
                    });
                } else if (imageRegex.test(x?.['Option B Type'])) {
                    obj.mcqOptions.push({
                        name: 'b',
                        type: constants.MCQ_OPTIONS_TYPE.IMAGE,
                        index: 1,
                        description: '',
                        descriptionIt: '',
                        isCorrect: false,
                    });
                }

                if (textRegex.test(x?.['Option C Type'])) {
                    obj.mcqOptions.push({
                        name: 'c',
                        type: constants.MCQ_OPTIONS_TYPE.STRING,
                        index: 2,
                        description: optionCEn,
                        descriptionIt: optionCIt,
                        isCorrect: false,
                    });
                } else if (imageRegex.test(x?.['Option C Type'])) {
                    obj.mcqOptions.push({
                        name: 'c',
                        type: constants.MCQ_OPTIONS_TYPE.IMAGE,
                        index: 2,
                        description: '',
                        descriptionIt: '',
                        isCorrect: false,
                    });
                }

                if (textRegex.test(x?.['Option D Type'])) {
                    obj.mcqOptions.push({
                        name: 'd',
                        type: constants.MCQ_OPTIONS_TYPE.STRING,
                        index: 3,
                        description: optionDEn,
                        descriptionIt: optionDIt,
                        isCorrect: false,
                    });
                } else if (imageRegex.test(x?.['Option D Type'])) {
                    obj.mcqOptions.push({
                        name: 'd',
                        type: constants.MCQ_OPTIONS_TYPE.IMAGE,
                        index: 3,
                        description: '',
                        descriptionIt: '',
                        isCorrect: false,
                    });
                }

                if (textRegex.test(x?.['Option E Type'])) {
                    obj.mcqOptions.push({
                        name: 'e',
                        type: constants.MCQ_OPTIONS_TYPE.STRING,
                        index: 4,
                        description: optionEEn,
                        descriptionIt: optionEIt,
                        isCorrect: false,
                    });
                } else if (imageRegex.test(x?.['Option E Type'])) {
                    obj.mcqOptions.push({
                        name: 'e',
                        type: constants.MCQ_OPTIONS_TYPE.IMAGE,
                        index: 4,
                        description: '',
                        descriptionIt: '',
                        isCorrect: false,
                    });
                }

                let matchedIndex = obj.mcqOptions.findIndex(g => g.name == obj.correctAnswer);
                if (matchedIndex != -1) {
                    obj.mcqOptions[matchedIndex].isCorrect = true;
                }

                async function matchImageOfOptionsRecurssively() {

                    let mcqOptionsArray = JSON.parse(JSON.stringify(obj.mcqOptions));
                    let mcqOptionsImageIndex = mcqOptionsArray.findIndex(h => h.type === constants.MCQ_OPTIONS_TYPE.IMAGE && !h.description);

                    if (extractedImageFilesList.length && mcqOptionsImageIndex != -1) {
                        let matchedOptionImageIndex = extractedImageFilesList.findIndex((ui) => `${obj.rowNumber}-${mcqOptionsArray[mcqOptionsImageIndex].name}` === ui.replace(/\.[^/.]+$/, ""));

                        if (matchedOptionImageIndex != -1) {
                            let extname = path.extname(extractedImageFilesList[matchedOptionImageIndex]);
                            let sourcePath = `${zipFilePathLocal}/${extractedImageFilesList[matchedOptionImageIndex]}`;
                            let destinationPath = `${constants.QUESTIONS_MCQ_UPLOAD_PATH_LOCAL}/mcqImages_${Date.now()}${extname}`;
                            fs.copyFileSync(sourcePath, destinationPath);
                            mcqOptionsArray[mcqOptionsImageIndex].description = path.basename(destinationPath);
                            obj.mcqOptions[mcqOptionsImageIndex].description = path.basename(destinationPath);
                        }

                        matchImageOfOptionsRecurssively();

                    } else {
                        return;
                    }
                }

                //todo: Code for zip file for option images
                if (extractedImageFilesList.length) {
                    await matchImageOfOptionsRecurssively();
                }

                delete obj?.rowNumber;

                return obj;
            }));


            console.log('successData--->', successData.length);
            let insertedIds = await questionModel.insertMany(successData);
            console.log('insertedIds :>> ', insertedIds);
            successData = [];
            bulkImportSuccessData = [];
        }

        console.log('subjectNotMatchedData--->', subjectNotMatchedData.length);
        // todo : check if subject exists in variable else add error message in not matched subject
        if (subjectNotMatchedData.length) {

            updateManyBulkImport({
                _id: { $in: subjectNotMatchedData },
                bulkImportId: new ObjectId(bulkImportId),
                errorFields: ''
            }, {
                $set: {
                    errorFields: 'subject, '
                }
            });


            subjectNotMatchedData = [];

        }

        await updateManyBulkImport({
            bulkImportId: new ObjectId(bulkImportId),
            errorFields: ''
        }, {
            $set: { isError: false }
        })

        const endI = now();
        let timeCompleted = ((endI - startI) / 1000).toFixed(3);
        console.log('timeCompleted for validation :>> ', timeCompleted);

        return true;

    } catch (err) {
        console.log('Error(validateQuestionImportFields): ', err);
        return false;
    }
}

const extractDataWithAdmZip = async (sourcePath, destinationPath) => {
    try {

        if (!fs.existsSync(sourcePath)) {
            console.log('Soure Path not found');
        }

        let zip = new AdmZip(sourcePath);
        zip.extractAllTo(destinationPath, true);

    } catch (err) {
        console.log('Error(extractDataWithAdmZip): ', err);
    }
};


const getListOfFilesOrFolderOfGivenPath = async (directoryPath, FS_TYPE) => {
    try { // console.log("directoryPath", directoryPath);
        let filesArray = [];
        let filesList = fs.readdirSync(directoryPath);

        for (let i = 0; i < filesList.length; i++) {
            let fileNames = await new Promise((resolve, reject) => {
                fs.stat(directoryPath + `/${filesList[i]}`, function (err, stats) {
                    if (FS_TYPE == constants.FS_TYPES.DIR && stats.isDirectory() == true) {
                        resolve(filesList[i]);
                    } else if (FS_TYPE == constants.FS_TYPES.FILE && stats.isFile() == true) {
                        resolve(filesList[i]);
                    } else {
                        resolve(null);
                    }
                });
            });

            if (fileNames) {
                filesArray.push(fileNames);
            }
        }

        return filesArray;
    } catch (err) {
        console.log('Error(getListOfFilesOrFolderOfGivenPath)', err);
    }
};

const checkIfFileOrFolderInGivenPath = async (directoryPath) => {
    try {
        let filesList = fs.readdirSync(directoryPath);

        //Remove files or folders starting with . or _ 
        //Remove files which are automatically created in macos
        filesList = filesList.filter(x => !['_', '.']?.includes(x?.toString()?.at(0)))

        let isItemDirectory = filesList.some((element) => fs.statSync(directoryPath + `/${element}`).isDirectory())

        let isItemFile = filesList.some((element) => fs.statSync(directoryPath + `/${element}`).isFile())

        return { isItemDirectory, isItemFile }
    } catch (err) {
        console.log('Error(checkIfFileOrFolderInGivenPath)', err);
    }
}


const isValidImageFileList = async (filesList) => {
    try {
        filesList = filesList.filter(x => x?.toString()?.trim()?.at(0) != '_' && x?.toString()?.trim()?.at(0) != '.')
        let isValidImgFileList = filesList.every((element) => element.match(/\.(jpg|jpeg|png)$/i));
        return isValidImgFileList;
    } catch (err) {
        console.log('Error(isValidImageFileList)', err);
    }
}


const deleteLocalFolder = (folderPath) => {
    try {
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true }, (err) => {
                if (err) {
                    console.log('Error(deleteLocalFolder): ', err);
                    return false;
                }
                console.log('Folder deleted: ', folderPath);
                return true;
            });
        } else {
            console.log('Folder not found on this path', folderPath);
        }
    } catch (err) {
        console.log('Error(deleteLocalFolder)', err);
    }
}

const sendBulkImportReportEmail = async (req) => {
    try {

        let locals = {
            appname: 'WLP',
            successRecords: req.successRecords,
            failureRecords: req.failureRecords,
            baseUrl: req.baseUrl,
        };

        let emailTemplatePath = getEmailTemplatePath(req.path, req.language);

        const emailBody = await ejs.renderFile(emailTemplatePath, { locals: locals });
        //sending mail to user
        Mailer.sendEmail(req.email, emailBody, req.subject);

    } catch (err) {
        console.log(`Error(sendBulkImportReportEmail)`, err);
    }
};

const { fork } = require('child_process');

const unzipFile = (zipFilePath, extractionPath) => {
    try {

        return new Promise((resolve, reject) => {
            const childProcess = fork(path.join(__dirname, '../services/admin/unzipper.js'), [zipFilePath, extractionPath]);

            childProcess.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Unzipping failed with code ${code}`));
                }
            });
        });
    } catch (err) {
        console.log(`Error(unzipFile)`, err);
    }
}

module.exports = {
    getImageName,
    makeFolderOnLocal,
    generateUserUniqId,
    // generateUserName,
    checkAndGenerateReferralCode,
    sortBy,
    searchHelper,
    searchHelperForController,
    facetHelper,
    getPageAndLimit,
    getFileName,
    deleteFile,
    getSeederAdmins,
    generateOTP,
    sendOtpEmail,
    imageURL,
    validationMessageKey,
    toUpperCaseValidation,
    groupBy,
    deleteLocalFile,
    downloadImage,
    createLocalFile,
    sortDataBy,
    sendCustomEmailBookingEmail,
    replaceStringWithObjectData,
    delay,
    deleteFilesIfAnyValidationError,
    hasDuplicate,
    getPDFPageCount,
    thankYouEmail,
    contactUsEmail,
    generatePreviewOfPdf,
    readFirstLine,
    validateQuestionImportFields,
    paginateInArray,
    extractDataWithAdmZip,
    getListOfFilesOrFolderOfGivenPath,
    checkIfFileOrFolderInGivenPath,
    isValidImageFileList,
    deleteLocalFolder,
    sendBulkImportReportEmail,
    unzipFile,
    sendInquiryEmail,
    getLatLong
};
