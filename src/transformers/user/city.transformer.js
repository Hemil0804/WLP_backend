exports.transformCity = (data) => {
    return {
        cityId: data?._id ? data._id : '',
        name: data?.name ? data.name : '',
    };
};

exports.cityListTransformer = (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {
        arrayData.forEach((a) => {
            data.push(this.transformCity(a));
        });
    }
    arrayData = data;
    return arrayData;
};




exports.transformCountryState = async (data) => {
    return {
        countryId: data?.countryData?._id ? data.countryData._id : '',
        countryName: data?.countryData?.name ? data.countryData.name : '',
        stateId: data?._id ? data._id : '',
        stateName: data?.name ? data.name : '',
        status: data?.status ? data.status : 0
    }
}

exports.transformCountryStateDetails = async (arrayData) => {
    let data = [];

    if (arrayData && arrayData.length > 0) {

        for (let index = 0; index < arrayData.length; index++) {
            let a = arrayData[index]
            data.push(await this.transformCountryState(a))

        }
    }
    arrayData = data;
    return arrayData;
}