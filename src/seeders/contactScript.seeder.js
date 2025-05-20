const contactCityModel = require('../models/contactCity.model');
const contactStateModel = require('../models/contactState.model');
const contactZipCodeModel = require('../models/contactZipCode.model');
const contactModel = require('../models/contact.model');
const { v4: uuidv4 } = require('uuid'); // Make sure to import uuidv4

function createSlug(text) {
    return text
        .toLowerCase() // Convert to lowercase
        .trim() // Remove leading/trailing spaces
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove multiple hyphens
}

module.exports = {
    run: () =>
        new Promise((resolve) => {
            (async () => {
                try {
                    let contactList = await contactModel.find();
                    let contactStateList = await contactStateModel.find();
                    let contactCityList = await contactCityModel.find();
                    let contactZipCodeList = await contactZipCodeModel.find();

                    for (let contact of contactList) {
                        console.log('contact',contact);

                        let stateSlug = createSlug(contact.address.state)
                        let state = contactStateList.find(state => state.slug === stateSlug);
                        if (!state) {
                            let stateId = uuidv4();
                            let data = {
                                uuid: stateId,
                                slug: stateSlug,
                                name: contact.address.state
                            };
                            // Save the new contact state
                            await new contactStateModel(data).save();
                            contactStateList.push(data);
                            state = data;
                        }

                        let citySlug = createSlug(contact.address.city)
                        let cityWithState = contactCityList.find(city => city.slug === citySlug && city.stateId == state.uuid);
                        if (!cityWithState) {
                            let cityId = uuidv4();
                            let dataState = {
                                uuid: cityId,
                                stateId: state.uuid,
                                slug: citySlug,
                                name: contact.address.city
                            };
                            // Save the new contact state
                            await new contactCityModel(dataState).save();
                            contactCityList.push(dataState);
                            cityWithState = dataState;
                        }

                        let zipWithCityState = contactZipCodeList.find(item => item.zip === contact.address.zip && item.stateId == state.uuid && item.cityId == cityWithState.uuid);
                        if (!zipWithCityState) {
                            let contactId = uuidv4();
                            let dataContact = {
                                uuid: contactId,
                                cityId: cityWithState.uuid,
                                stateId: state.uuid,
                                zip: contact.address.zip
                            };
                            // Save the new contact state
                            await new contactZipCodeModel(dataContact).save();
                            contactZipCodeList.push(dataContact);
                            zipWithCityState = dataContact;
                        }
                        console.log('id:', contact._id)
                        let updateObj = { zipId: zipWithCityState.uuid, cityId: zipWithCityState.cityId, stateId: zipWithCityState.stateId, latitude: contact.address.latitude, longitude: contact.address.longitude }
                        console.log('updateObj:', updateObj)
                        await contactModel.findOneAndUpdate({ _id: contact._id }, { $set: updateObj })
                    }

                    // Send a success response
                    console.log('Contacts updated successfully');
                    resolve(true);

                } catch (err) {
                    console.log('Error(contactUpdateScript)', err);
                    reject(err)
                }
            })();
        })
};
