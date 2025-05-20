const Admin = require('../models/admin.model');
const helper = require('../helpers/helper');

module.exports = {
    run: () =>
        new Promise((resolve) => {
            (async () => {
                let admin = await helper.getSeederAdmins();
                let insertedIds = await Admin.insertMany(admin);
                console.log('insertedIds', insertedIds);
                resolve(true);
            })();
        })
};
