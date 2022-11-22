"use strict"
const db = require("../config/db");

class RoomStorage{
    static async getRoomsByProfessor(pid){
        return new Promise(((resolve, reject) => {
            db.query("select * from room where pid = ?", [pid],
                (err,data) => {
                if (err){
                    reject(new Error("room db¿¡·¯"));
                } else {
                    var rooms = new Array();
                    var times = new Array();
                    for (let i = 0; i< data.length; ++i){
                        rooms.push(data[i].rid);
                        times.push(data[i].rtime);
                    }
                    resolve({success: true, rooms: rooms, times: times});
                }
                })
        }))
    }
}

module.exports = RoomStorage;