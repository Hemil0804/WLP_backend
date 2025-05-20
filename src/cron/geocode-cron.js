const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const Contact = require('../models/contact.model');  // Import the Location model

const googleApiKey = process.env.YOUR_GOOGLE_GEOCODING_API_KEY;

// Function to get latitude and longitude by address
async function getLatLongByAddress(address, retries = 2) {
    const { streetAddress, city, state, zip, country } = address;
    const fullAddress = `${streetAddress}, ${city}, ${state}, ${zip}, ${country}`;

    try {
        // console.log("fullAddress ----------", fullAddress)/
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                address: fullAddress,
                key: googleApiKey
            }
        });

        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return location;
        } else {
            throw new Error(`Geocoding API error: ${response.data.status}`);
        }
    } catch (error) {
        if (retries > 0) {
            console.log("retries ", retries)
            return console.warn(`Retrying geocode fetch: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Increase delay between retries
            return getLatLongByAddress(address, retries - 1);
        } else {
            console.error(`Error fetching geocode after retries: ${error.message}`);
            return null;
        }
    }
}

// Function to update latitude and longitude in batches
const updateLatLongInBatches = async (batchSize = 100, delay = 10) => {
    let offset = 0;
    let records;

    try {
        do {
            try {
                records = await Contact.find({ 'address.streetAddress': { $ne: null }, updatedLatLong: false }).skip(offset).limit(batchSize);
                if (records.length === 0) break;
            } catch (error) {
                console.error('Error fetching records:', error);
                break; // Exit the loop if there's an error fetching records
            }
            records
 
            for (const record of records) {
                try {
                     const location = await getLatLongByAddress(record.address);
                    if (location) {
                        try {
                            await Contact.updateOne(
                                { _id: record._id },
                                {
                                    $set: {
                                        'address.latitude': location.lat,
                                        'address.longitude': location.lng,
                                        latitude: location.lat,
                                        longitude: location.lng,
                                        updatedLatLong: true
                                    }
                                }
                            );
                        } catch (updateError) {
                            console.error(`Error updating record ${record._id}:`, updateError);
                        }
                    }
                } catch (locationError) {
                    console.error(`Error getting location for record ${record._id}:`, locationError);
                }

                // Optional: Add a delay between requests to respect rate limits
                // await new Promise(resolve => setTimeout(resolve, delay));
            }

            offset += batchSize;
        } while (records.length > 0);
    } catch (error) {
        console.error('Unexpected error in updateLatLongInBatches:', error);
    }
};

// Schedule the cron job to run every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running cron job to update lat/long for records');
    await updateLatLongInBatches();
    console.log('Lat/long update job completed');
});


// Export the update function
module.exports = {
    updateLatLongInBatches,
};