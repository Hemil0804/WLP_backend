const nodemailer = require('nodemailer');
const {
    SENDER_EMAIL,
    SENDER_PASSWORD,
    EMAIL_SERVICE,
    EMAIL_PORT
} = require('../../config/key');

const sendEmail = async (email, emailBody, subject) => {
    try {
        const transporter = nodemailer.createTransport({
            service: EMAIL_SERVICE,
            host: 'smtp.gmail.com',
            auth: {
                user: SENDER_EMAIL,
                pass: SENDER_PASSWORD,
            },
        });


        let mailData = {
            from: {
                name: 'WLP',
                address: SENDER_EMAIL,
            },
            to: email,
            subject: subject,
            html: emailBody,
        };
        transporter.sendMail(mailData);
        console.log('Email has been sent successfully to ' + ' ' + email);
        return true;

    } catch (err) {
        console.log('Error(sendEmail)', err);
        return false;
    }
};

const sendAdminEmail = async (email, emailBody, subject, userName) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: EMAIL_PORT,
            auth: {
                user: SENDER_EMAIL,
                pass: SENDER_PASSWORD,
            },
        });

        let mailData = {
            from: {
                name: userName,
                address: SENDER_EMAIL,
            },
            to: email,
            subject: subject,
            html: emailBody,
        };
        transporter.sendMail(mailData);
        console.log('Email has been sent successfully to ' + ' ' + email);
        return true;

    } catch (err) {
        console.log('Error(sendAdminEmail)', err);
        return false;
    }
};

const sendCourseInquiryEmail = (email, emailBody, subject, data) => {

    let transport = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        host: 'smtp.gmail.com',
        auth: {
            user: SENDER_EMAIL,
            pass: SENDER_PASSWORD,
        }
    });
    let mailOptions = {
        to: email,
        from: {
            name: 'WLP',
            address: SENDER_EMAIL,
        },
        subject: subject,
        html: emailBody,
        attachments: [
            {   // binary buffer as an attachment
                filename: data.inquiryTitle,
                path: data.inquiryPdf
            },
        ]
    };
    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions).then((result) => {
            console.log(111)
            resolve(true);
        }).catch(err => {
            console.log(err);
        })
    })
}

module.exports = { sendAdminEmail, sendEmail ,sendCourseInquiryEmail};