"use strict"
const roomStorage = require("./RoomStorage");

class RoomManager{
    constructor(req) {
        this.body = req;
    }
    async getRoomsByProfessor(){
        let response;
        let professorID = this.body.pid;
        try {
            response = await roomStorage.getRoomsByProfessor(professorID);
        }catch(error){
            console.log(error);
        }
	return response;
    }
}

module.exports = RoomManager;