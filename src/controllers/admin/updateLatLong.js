// // cronJobs.js
// const cron = require('node-cron');
// const axios = require('axios');
// const mongoose = require('mongoose');
// const Contact = require('./models/Contact'); // Adjust the path to your Contact model

// mongoose.connect('mongodb://localhost:27017/yourdatabase', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// async function getLatLong(address) {
//     const apiKey = '';
//     const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
//     try {
//         const response = await axios.get(url, { timeout: 15000 });
//         if (response.data.status === 'OK') {
//             const location = response.data.results[0].geometry.location;
//             return {
//                 latitude: location.lat,
//                 longitude: location.lng,
//             };
//         } else {
//             console.error('Geocoding API error:', response.data.status);
//             return { latitude: null, longitude: null };
//         }
//     } catch (error) {
//         console.error('Error fetching geocoding data:', error);
//         return { latitude: null, longitude: null };
//     }
// }

// async function updateLatLong() {
//     try {
//         const contacts = await Contact.find({
//             'address.latitude': { $exists: false },
//             'address.longitude': { $exists: false },
//         });

//         for (const contact of contacts) {
//             const address = `${contact.address.streetAddress}, ${contact.address.city}, ${contact.address.state}, ${contact.address.zip}`;
//             const { latitude, longitude } = await getLatLong(address);

//             contact.address.latitude = latitude;
//             contact.address.longitude = longitude;
//             await contact.save();

//             console.log(`Updated contact ${contact._id} with latitude: ${latitude}, longitude: ${longitude}`);
//         }
//     } catch (error) {
//         console.error('Error updating contacts:', error);
//     }
// }

// // Schedule the cron job to run every day at midnight
// cron.schedule('0 0 * * *', updateLatLong);

// console.log('Cron job to update latitude and longitude has been scheduled');
