const helper = require('../../helpers/helper')

exports.transformerAdd = (data) => {

    return {
        contactId: data?._id ? data._id : '',
        firstName: data?.firstName ? data.firstName : '',
        lastName: data?.lastName ? data.lastName : '',
        email: data?.email ? data.email : '',
        phone: data?.phone ? data.phone : '',
        dob: data?.dob ? data.dob : '',
        regDate: data?.regDate ? data.regDate : '',
        district: data?.district ? data.district : '',
        dob: data?.dob ? data.dob : '',
        gender: data?.gender ? data.gender : '',
        streetAddress: data?.streetAddress ? data.streetAddress : '',
        country: data?.country ? data.country : '',
        latitude: data?.latitude ? Number(data.latitude) : 0,
        longitude: data?.longitude ? Number(data.longitude) : 0,
        address: {
            streetAddress: data.address.streetName ? data.address.streetName : '',
            city: data.address?.city ? data.address?.city : '',
            state: data.address?.state ? data.address?.state : '',
            country: data.address?.country ? data.address?.country : '',
            zip: data.address?.zip ? data.address.zip : '',
            latitude: data.address?.latitude ? data.address.latitude : 0,
            longitude: data.address?.longitude ? data.address.longitude : 0
        },
        status: data?.status ? data.status : 0,
    };
};


const transformer = (data) => {
    if (!data.isSocialmanager) data.profileImage = data?.profileImage ? helper.imageURL(data.profileImage, 'manager') : ''
    if (data.address) {
        var addressData = data.address;
    }
    return {
        contactId: data?._id ? data._id : '',
        firstName: data?.firstName ? data.firstName : '',
        lastName: data?.lastName ? data.lastName : '',
        email: data?.email ? data.email : '',
        phone: data?.phone ? data.phone : '',
        dob: data?.dob ? data.dob : '',
        gender: data?.gender ? data.gender : '',
        // profileImage: data?.profileImage ? data.profileImage : '',
        title: data?.title ? data.title : '',
        voterNum: data?.voterNum ? data.voterNum : '',
        regDate: data?.regDate ? data.regDate : 0,
        district: data?.district ? data.district : 0,
        status: data?.status ? data.status : 0,
        address: {
            // streetAddress: addressData?.streetAddress ? addressData.streetAddress : '',
            streetAddress: addressData?.streetAddress ? addressData.streetAddress : '',
            zip: addressData?.zip ? addressData.zip : '',
            // cityId: addressData?.cityId ? addressData.cityId : '',
            city: addressData?.city ? addressData?.city : '',
            // stateId: addressData?.stateId ? addressData.stateId : '',
            state: addressData?.state ? addressData?.state : '',
            // countryId: addressData?.countryId ? addressData.countryId : '',
            country: addressData?.country ? addressData?.country : '',
            // operationalDays: addressData?.operationalDays ? addressData.operationalDays : '',
            latitude: addressData?.latitude ? addressData.latitude : 0,
            longitude: addressData?.longitude ? addressData.longitude : 0
        },
        streetAddress: data?.streetAddress ? data.streetAddress : '',
        stateId: data?.stateId ? data.stateId : '',
        cityId: data?.cityId ? data.cityId : '',
        zipId: data?.zipId ? data.zipId : '',
        country: data?.country ? data.country : '',
        latitude: data?.latitude ? Number(data.latitude) : 0,
        longitude: data?.longitude ? Number(data.longitude) : 0,

        surveyData: data?.surveyData ? data.surveyData : ''
    };
};

exports.contactListTransform = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(transformer(a));
        });
    }
    arrayData = data;
    return arrayData;
};


exports.contactViewTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = transformer(arrayData);
    }
    return responseData;
};

