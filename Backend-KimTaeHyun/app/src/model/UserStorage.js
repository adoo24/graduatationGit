"use strict";

const db = require("../config/db");

class UserStorage {
    static async searchUser(id) {
        return new Promise((resolve, reject) => {
            db.query("select * from student where id = ?", [id], (err, data) => {
                if (data.length === 0){
                    db.query("select * from professor where id = ?", [id], (err,data)=>{
                        if (data.length === 0){
                            resolve({success: true});
                        }
                        else {
                            reject(new Error("중복"));
                        }
                    })
                }
                else {
                    reject(new Error("중복"));
                }
            })
        })
    }

    static async getUser(id) { //id가 db에 조회가 안되는 경우, 에러가 난 경우 제외하고 db에서 아이디,비번을 빼옴
        return new Promise((resolve, reject) => {
            db.query("select * from student where id = ?", [id], (err, data) => {
                if (data.length === 0){
                    db.query("select * from professor where id = ?", [id], (err,data) =>{
                        if (data.length === 0) {
                            reject(new Error("데이터 없음"));
                        }
                        else{
                            console.log("3")
                            resolve({id: data[0].id, psword: data[0].password,
                                nickname : data[0].name, auth : "professor"});
                            console.log({id: data[0].id, psword: data[0].password,
                                nickname: data[0].name, auth: "professor"});
                        }
                    })
                }
                else{
                    resolve({id: data[0].id, psword: data[0].password,
                            nickname : data[0].name, auth: "student",
                            face1: data[0].face1, face2: data[0].face2});
                    console.log("하위 로그는 UserStorage");
                    console.log({id: data[0].id, psword: data[0].password,
                        nickname: data[0].name, auth: "student",
                    face1: data[0].face1, face2: data[0].face2});
                }
            })
        })
    }

    static async save(userInfo, files = null) { //회원정보,사진경로를 db에 저장. 저장 시 성공, 에러시 실패
        if (userInfo.auth === "student") {
            return new Promise((resolve, reject) => {
                db.query("insert into student (id,name,password,dept,face1,face2) values(?, ?, ?, ?, ?, ?);",
                    [userInfo.id, userInfo.name, userInfo.psword, userInfo.dept, files.file1.path, files.file2.path]
                    , (err, data) => {
                        if (err){
                            reject(`${err}`);
                        } else{
                            resolve({success: true});
                        }
                    })
            })
        }
        else{
            return new Promise((resolve, reject) => {
                db.query("insert into professor (id,name,password,dept) values(?, ?, ?, ?);",
                    [userInfo.id, userInfo.name, userInfo.psword, userInfo.dept]
                    , (err, data) => {
                        if (err) {
                            reject(`${err}`);
                        } else{
                            resolve(data);
                        }
                    })
            })
        }
    }

    static async getUserViolation(userID){
        return new Promise((resolve,reject) =>{
            db.query("select address, vtime from violation where sid = ?;", [userID]
                , (err, data) => {
                    if (err){
                        reject(`${err}`)
                    } else {
                        var address = new Array();
                        var vTime = new Array();
                        for (let i = 0; i< data.length(); ++i){
                            address.push(data[i].address);
                            vTime.push(data[i].vtime);
                        }
                        return {address: address, time: vTime};
                    }
                })
        })
    }
}

module.exports = UserStorage;