require('dotenv').config({ path: "../.env" });

const environment = process.env.ENVIRONMENT;
const key = environment ? environment.toUpperCase() : 'LOCAL'; // Default to LOCAL if not set

module.exports = {
	PORT: key === 'PRODUCTION' ? process.env.PORT_PROD : key === 'DEV' ? process.env.PORT_DEV : process.env.PORT_LOCAL,
	DB_AUTH_URL: key === 'PRODUCTION' ? process.env.DB_AUTH_URL_PROD : key === 'DEV' ? process.env.DB_AUTH_URL_DEV : process.env.DB_AUTH_URL_LOCAL,
	JWT_AUTH_TOKEN_SECRET: key === 'PRODUCTION' ? process.env.JWT_AUTH_TOKEN_SECRET_PROD : key === 'DEV' ? process.env.JWT_AUTH_TOKEN_SECRET_DEV : process.env.JWT_AUTH_TOKEN_SECRET_LOCAL,
	JWT_EXPIRES_IN: key === 'PRODUCTION' ? process.env.JWT_EXPIRES_IN_PROD : key === 'DEV' ? process.env.JWT_EXPIRES_IN_DEV : process.env.JWT_EXPIRES_IN_LOCAL,
	EMAIL_FROM: key === 'PRODUCTION' ? process.env.EMAIL_FROM_PROD : key === 'DEV' ? process.env.EMAIL_FROM_DEV : process.env.EMAIL_FROM_LOCAL,
	EMAIL_PASSWORD: key === 'PRODUCTION' ? process.env.EMAIL_PASSWORD_PROD : key === 'DEV' ? process.env.EMAIL_PASSWORD_DEV : process.env.EMAIL_PASSWORD_LOCAL,
	EMAIL_SERVICE: key === 'PRODUCTION' ? process.env.EMAIL_SERVICE_PROD : key === 'DEV' ? process.env.EMAIL_SERVICE_DEV : process.env.EMAIL_SERVICE_LOCAL,
	EMAIL_PORT: key === 'PRODUCTION' ? process.env.EMAIL_PORT_PROD : key === 'DEV' ? process.env.EMAIL_PORT_DEV : process.env.EMAIL_PORT_LOCAL,
	IMAGE_LINK: key === 'PRODUCTION' ? process.env.IMAGE_LINK_PROD : key === 'DEV' ? process.env.IMAGE_LINK_DEV : process.env.IMAGE_LINK_LOCAL,
	DEFAULT_IMAGE_LINK: key === 'PRODUCTION' ? process.env.DEFAULT_IMAGE_LINK_PROD : key === 'DEV' ? process.env.DEFAULT_IMAGE_LINK_DEV : process.env.DEFAULT_IMAGE_LINK_LOCAL,
	SENDER_EMAIL: key === 'PRODUCTION' ? process.env.SENDER_EMAIL_PROD : key === 'DEV' ? process.env.SENDER_EMAIL_DEV : process.env.SENDER_EMAIL_LOCAL,
	SENDER_PASSWORD: key === 'PRODUCTION' ? process.env.SENDER_PASSWORD_PROD : key === 'DEV' ? process.env.SENDER_PASSWORD_DEV : process.env.SENDER_PASSWORD_LOCAL,
	YOUR_GOOGLE_GEOCODING_API_KEY: process.env.YOUR_GOOGLE_GEOCODING_API_KEY, // This is same for all envs
	BASE_URL: key === 'PRODUCTION' ? process.env.BASE_URL_PROD : key === 'DEV' ? process.env.BASE_URL_DEV : process.env.BASE_URL_LOCAL,
	IS_SSL: process.env.IS_SSL,
	ENVIRONMENT: key,
	PAGINATION_LIMIT: 10
};
