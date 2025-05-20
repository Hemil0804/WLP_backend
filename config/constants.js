module.exports = {

    WEB_STATUS_CODE: {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        SERVER_ERROR: 500,
        MAINTENANCE: 503
    },

    META_STATUS: {
        DATA: 1,                            // When there is success response from api
        NO_DATA: 0                          // When there is no data found in api  // Not when there is no response data in api response
    },

    CMS_SLUG: {
        CONTRACT: "contract"
    },

    PAGE: 1,
    LIMIT: 10,

    STATUS: {
        ACTIVE: 1,
        INACTIVE: 2,
        DELETED: 3
    },

    USER_TYPE: {
        FREE: 1,
        COURSE: 2,
        SIMULATION: 3
    },

    USER_ROLE: {
        ADMIN: 1,
        MANAGER: 2,
        POLL_TAKER: 3,
        TEAM_OWNER: 4
    },

    ADMIN_PROFILE_PICTURE_UPLOAD_PATH_LOCAL: 'public/uploads/admin',
    USER_PROFILE_IMAGE_UPLOAD_PATH_LOCAL: 'public/uploads/user',
    QUESTIONS_MCQ_UPLOAD_PATH_LOCAL: 'public/uploads/questionMcq',
    CONTACTS_IMPORT_UPLOAD_PATH_LOCAL: 'public/uploads/contactImportFile',
    QUESTION_IMPORT_UPLOAD_PATH_LOCAL: 'public/uploads/questionImportFile',


    SUBSCRIPTION_PLAN: {
        ONE_SHOT: 1,
        TWO_SHOT: 2
    },

    QUESTION_TYPE: {
        MCQ: 1,
        SINGLE_CHOICE: 2,
        DESCRIPTIVE: 3,
        YES_NO: 4
    },

    QUESTION_BY: {
        ADMIN: 1,
        MANAGER: 2,
        POLL_TAKER: 3
    },

    SUBSCRIPTION_TYPE: {
        FREE: 1,
        BASIC: 2,
        TEAM: 3,
        ORGANIZATION: 4,
    },

    MCQ_OPTIONS_TYPE: {
        STRING: 1,
        IMAGE: 2,
    },

    DEVICE_TYPE: {
        APP: "app",
        WEB: "web",
    }

}   