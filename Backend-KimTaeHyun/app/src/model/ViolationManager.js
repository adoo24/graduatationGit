"use strict"

const violationStorage = require("./ViolationStorage");
class ViolationManager{
    constructor(req){
        this.body = req;
    }

    async getStudentsScoresFromViolationScore(){
        let response;
        let roomID = this.body.roomID;
        try {
            response = await violationStorage.getStudentsScoresFromViolationScore(roomID);
	    console.log(response);
        }catch(error){
            console.log(error);
        }
	return response;
    }

}

module.exports = ViolationManager;