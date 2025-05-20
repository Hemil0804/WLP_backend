const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Contact = require('./../models/contact.model');
const constants = require("../../config/constants");

mongoose.connect('mongodb://wlp:wlp002910@110.227.212.251:27017/', {
    // Removed deprecated options
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Could not connect to MongoDB', err);

});

function generateContacts(numberOfContacts) {
    const contacts = [];

    for (let i = 0; i < numberOfContacts; i++) {
        const contact = {
            fullName: faker.person.fullName(), // Updated method
            email: faker.internet.email(),
            mobileNumber: faker.phone.number(),
            address: {
                streetAddress: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                latitude: parseFloat(faker.location.latitude()),
                longitude: parseFloat(faker.location.longitude()),
                zipCode: faker.location.zipCode(),
                country: faker.location.country()
            },
            status: constants.STATUS.ACTIVE,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        contacts.push(contact);
    }

    return contacts;
}

async function seedContacts() {
    const contacts = generateContacts(250);

    try {
        await Contact.insertMany(contacts);
        console.log('Seeded 250 contacts successfully');
    } catch (error) {
        console.error('Error seeding contacts:', error);
    } finally {
        mongoose.connection.close();
    }
}

seedContacts();