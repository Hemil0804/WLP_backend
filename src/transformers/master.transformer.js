exports.transformCity = (data) => {
    return {
        _id: data?._id ? data._id : '',
        name: data?.size ? data.size : '',
        status: data?.status ? data.status : 0
    };
};

exports.listTransformCity = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformCity(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.transformState = (data) => {
    return {
        _id: data?._id ? data._id : '',
        name: data?.size ? data.size : '',
        status: data?.status ? data.status : 0
    };
};

exports.listTransformState = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformState(a));
        });
    }
    arrayData = data;
    return arrayData;
};

exports.transformZip = (data) => {
    return {
        _id: data?._id ? data._id : '',
        name: data?.size ? data.size : '',
        status: data?.status ? data.status : 0
    };
};

exports.listTransformState = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformZip(a));
        });
    }
    arrayData = data;
    return arrayData;
};



exports.viewSizeTransform = (arrayData) => {
    let sizeData = null;

    if (arrayData) {
        sizeData = this.transformSize(arrayData);
    }
    arrayData = sizeData
    return arrayData;
};

// ====================================================================================================================================================================================

exports.transformContactCity = (data) => {
    return {
        cityId: data?.uuid ? data.uuid : '',
        name: data?.name ? data.name : '',
        stateId: data?.stateId ? data.stateId : '',
        status: data?.status ? data.status : 0
    };
};

exports.listTransformContactCity = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformContactCity(a));
        });
    }
    arrayData = data;
    return arrayData;
};


exports.transformContactState = (data) => {
    return {
        stateId: data?.uuid ? data.uuid : '',
        name: data?.name ? data.name : '',
        status: data?.status ? data.status : 0
    };
};

exports.listTransformContactState = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformContactState(a));
        });
    }
    arrayData = data;
    return arrayData;
};


exports.transformContactZip = (data) => {
    return {
        zipId: data?.uuid ? data.uuid : '',
        zip: data?.zip ? data.zip : '',
        stateId: data?.stateId ? data.stateId : '',
        cityId: data?.cityId ? data.cityId : '',
        status: data?.status ? data.status : 0
    };
};

exports.listTransformContactZip = (arrayData) => {
    let data = [];
    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformContactZip(a));
        });
    }
    arrayData = data;
    return arrayData;
};
