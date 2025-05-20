const multer = require('multer');
const path = require('path');
const responseHelper = require('../helpers/responseHelper');
const constants = require('../../config/constants');
const { makeFolderOnLocal } = require('../helpers/helper');


let imageFieldList = ['profileImage', 'picture'];
let pdfFieldList = ["trailPdf"];
let xlsxFieldList = ["lessonFile"];
let csvFieldList = ['contactImportFile'];
let questionCsvFieldList = ['questionImportFile'];
let zipFieldList = ['questionsImportZipFile'];

//middleware for adding image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        switch (file.fieldname) {

            case 'picture':
            case 'profileImage':
            case 'document':
                makeFolderOnLocal(constants.USER_PROFILE_IMAGE_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.USER_PROFILE_IMAGE_UPLOAD_PATH_LOCAL));
                break;

            case 'lessonFile':
                makeFolderOnLocal(constants.LESSON_IMPORTS_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.LESSON_IMPORTS_UPLOAD_PATH_LOCAL));
                break;

            case 'mcqImages':
                makeFolderOnLocal(constants.QUESTIONS_MCQ_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.QUESTIONS_MCQ_UPLOAD_PATH_LOCAL));
                break;

            case 'questionsImportZipFile':
            case 'contactImportFile':
                makeFolderOnLocal(constants.CONTACTS_IMPORT_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.CONTACTS_IMPORT_UPLOAD_PATH_LOCAL));
                break;
            case 'questionImportFile':
                makeFolderOnLocal(constants.QUESTION_IMPORT_UPLOAD_PATH_LOCAL);
                cb(null, path.join(constants.QUESTION_IMPORT_UPLOAD_PATH_LOCAL));
                break;
                
            default:
                console.log(`fieldName not found: ${file}`);
                break;
        }
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
});
// module.exports = storage

module.exports.upload = multer({ storage: storage });

module.exports.uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 1000 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {
        if (imageFieldList.includes(file.fieldname)) {
            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|pdf|PDF)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validImage', false);
            }
            cb(undefined, true);
        } else if (pdfFieldList.includes(file.fieldname)) {
            if (!file.originalname.match(/\.(pdf|PDF)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validPDF', false);
            }
            cb(undefined, true);
        } else if (xlsxFieldList.includes(file.fieldname)) {
            if (!file.originalname.match(/\.(xlsx|XLSX)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validXLSX', false);
            }
            cb(undefined, true);
        } else if (csvFieldList.includes(file.fieldname)) {
            console.log("CSV file Uploaded.......,", file);
            if (!file.originalname.match(/\.(csv|CSV)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validCSV', false);
            }
            cb(undefined, true);
        } else if (questionCsvFieldList.includes(file.fieldname)) {
            console.log("CSV file Uploaded.......,", file);
            if (!file.originalname.match(/\.(csv|CSV)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validCSV', false);
            }
            cb(undefined, true);
        } else if (zipFieldList.includes(file.fieldname)) {
            if (!file.originalname.match(/\.(zip)$/i)) {
                req.files.isFileTypeError = true;
                return cb('validZIP', false);
            }
            cb(undefined, true);
        }
    },
}).fields([
    { name: 'picture', maxCount: 1 },
    { name: 'profileImage', maxCount: 1 },
    { name: 'mcqImages', maxCount: 5 },
    { name: 'contactImportFile', maxCount: 1 },
    { name: 'questionImportFile', maxCount: 1 },
    { name: 'questionsImportZipFile', maxCount: 1 }

]);

module.exports.validMulterUploadMiddleware = (multerUploadFunction) => {

    return (req, res, next) =>
        multerUploadFunction(req, res, (err) => {
            // handle Multer error
            if (err && err.name && err.name === 'MulterError') {

                if (err.message == 'Unexpected field') {
                    return responseHelper.error(res, res.__('unexpectedFileField'), constants.WEB_STATUS_CODE.BAD_REQUEST);
                }
                if (err.code == 'LIMIT_UNEXPECTED_FILE') {
                    return responseHelper.error(res, res.__('fileLimitExceeded'), constants.WEB_STATUS_CODE.BAD_REQUEST);
                }
                if (err.code == 'LIMIT_FILE_SIZE') {
                    return responseHelper.error(res, res.__('fileSizeUploadLimitExceeded'), constants.WEB_STATUS_CODE.BAD_REQUEST);
                }

                return responseHelper.error(res, res.__('SomethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
            }
            if (err) {
                // handle other errors
                return responseHelper.error(res, res.__(err), constants.WEB_STATUS_CODE.SERVER_ERROR);
            }
            next();
        });
};