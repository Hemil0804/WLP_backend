require('dotenv').config('../.env');
require('dotenv').config();
const cors = require("cors");
require('./connection/db');

const express = require('express');
const app = express();
const fs = require('fs');
const http = require('http');
const path = require('path');
const https = require('https');
const bodyParser = require('body-parser');
const i18n = require('./i18n/i18n');

const { logger } = require('./helpers/loggerService');
const { PORT, IS_SSL, BASE_URL, DB_AUTH_URL, ENVIRONMENT } = require('../config/key');

function shouldCompress(req, res) {
    if (req.headers['x-no-compression']) {
        // don't compress responses with this request header
        return false
    }

    // fallback to standard filter function
    return compression.filter(req, res)
}

// Parse request data to json
app.use(bodyParser.json());
// Language file
app.use(i18n);

app.use(cors({ origin: '*' }));

// Parse form-data
app.use(bodyParser.urlencoded({ extended: false }));

let server
let serverSSl
if (IS_SSL == 'true') {

    const options = {
        key: fs.readFileSync('/var/www/ssl/multiqos.com.key'),
        cert: fs.readFileSync('/var/www/ssl/X509.crt'),
        ca: fs.readFileSync('/var/www/ssl/ca-bundle.crt')
    };
    serverSSl = https.createServer(options, app);

    serverSSl.listen(PORT, () => {
        console.log('server listening on port:', PORT)
    })
} else {
    console.log('No -----------IS_SSL')
    server = http.createServer(app)
    server.listen(PORT, () => {
        console.log('Server listening on port:', PORT)
    })
}

logger.debug('.....................................................................................');
logger.debug(`🚀ENV:📡 ${ENVIRONMENT}`);
logger.debug(`🚀BASEURL:${BASE_URL}`);
logger.debug(`🚀DB URL:🔋 ${DB_AUTH_URL}`);
logger.debug('.....................................................................................');

app.get('/', (req, res) => {
    res.send('Wel-come to WLP node service✨🌐.');
});

app.get('/health', (req, res) => res.sendStatus(constants.WEB_STATUS_CODE.OK));

// Api routes
const commonRoute = require('./routes/common.route');
const constants = require('../config/constants');
app.use(commonRoute);

// Run default scripts
// require('./scripts/defaultScripts').makeFolderForUploadingImages;

const publicDirectory = path.join(__dirname, '../');
app.use(express.static(publicDirectory))


// For security
// app.use(helmet());

app.use('*', (req, res, next) => {
    res.status(404).json({
        success: 'false',
        message: 'Page not found',
        error: {
            statusCode: 404,
            message: 'You reached a route that is not defined on this server',
        },
    });
})
