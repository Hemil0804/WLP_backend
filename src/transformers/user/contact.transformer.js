const transformerContact = (data) => {
    if (data.address) {
        var addressData = data.address;

    }
    return {
        contactId: data?._id ? data._id : '',
        contactStateId: data?.contactStateId ? data.contactStateId : 0,
        firstName: data?.firstName ? data.firstName : '',
        lastName: data?.lastName ? data.lastName : '',
        email: data?.email ? data.email : '',
        mobileNumber: data?.phone ? data.phone : '',
        // profileImage: data?.profileImage ? data.profileImage : '',
        title: data?.title ? data.title : '',
        voterNum: data?.voterNum ? data.voterNum : '',
        regDate: data?.regDate ? data.regDate : 0,
        district: data?.district ? data.district : 0,
        streetAddress: data?.streetAddress ? data.streetAddress : '',
        city: data?.cityData.length > 0 ? data.cityData[0].name : '',
        cityId: data?.cityId ? data.cityId : 0,
        state: data?.stateData.length > 0 ? data.stateData[0].name : '',
        stateId: data?.stateId ? data.stateId : 0,
        zip: data?.zipData.length > 0 ? data.zipData[0].zip : '',
        zipId: data?.zipId ? data.zipId : 0,
        country: data?.country ? data.country : '',
        latitude: data?.latitude ? Number(data.latitude) : 0,
        longitude: data?.longitude ? Number(data.longitude) : 0,
        // status: data?.status ? data.status : 0,
        address: {
            streetAddress: addressData?.streetAddress ? addressData.streetAddress : '',
            zip: addressData?.zip ? addressData.zip : '',
            city: addressData?.city ? addressData?.city : '',
            state: addressData?.state ? addressData?.state : '',
            country: addressData?.country ? addressData?.country : '',
            latitude: addressData?.latitude ? addressData.latitude : 0,
            longitude: addressData?.longitude ? addressData.longitude : 0
        },
        surveyData: data?.surveyData ? data.surveyData : ''
    };
};


const contactViewTransform = (arrayData) => {
    let responseData = null;
    if (arrayData) {
        responseData = transformerContact(arrayData);
    }
    return responseData;
};


const contactListTransform = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(transformerContact(a));
        });
    }
    arrayData = data;
    return arrayData;
};

module.exports = {
    contactViewTransform,
    contactListTransform,
};