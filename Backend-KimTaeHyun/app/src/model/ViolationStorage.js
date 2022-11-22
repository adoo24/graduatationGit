"use strict"

const db = require("../config/db");

class ViolationStorage{
    static async getUserViolation(userID, roomID){
        return new Promise((resolve,reject) =>{
            db.query("select address, vtime from violation where sid = ? and rid = ?;",
                [userID, roomID]
                , (err, data) => {
                    if (err){
                        reject(`${err}`)
                    } else {
                        var address = new Array();
                        var vTime = new Array();
                        for (let i = 0; i< data.length; ++i){
                            address.push(data[i].address);
                            vTime.push(data[i].vtime);
                        }
                        resolve ({success: true, address: address, time: vTime});
                    }
                })
        })
    }

    static async getStudentsScoresFromViolationScore(roomID){
	console.log(roomID);
        return new Promise((resolve, reject) => {
            db.query("select sid, score from NegativeScore where rid = ?;",
                [roomID],
                (err,data) =>{
                    if (err){
                        reject(`${err}`)
                    } else {
                        var students = new Array();
                        var scores = new Array();
				
                        for (let i = 0; i< data.length; ++i){
			       console.log(data[i].sid, data[i].score);
                            students.push(data[i].sid);
                            scores.push(data[i].score);
                        }
                        
                      	resolve({success: true,  students: students, scores: scores});
                    }
                })
        })
    }
}

module.exports = ViolationStorage;