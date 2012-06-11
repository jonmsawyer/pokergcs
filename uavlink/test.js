console.log("UAF UAV Ground Control Station Test Program\n");
var uavlink=require('./build/Release/uavlink');

console.log(JSON.stringify(uavlink.ground_get()));
