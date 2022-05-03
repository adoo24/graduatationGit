"use strict";

const db = require("../config/db");

class UserStorage {

    static getUsers() {

    }

    static async getUserInfo(id) {
        return new Promise((resolve, reject) => {
            db.query("select * from student where id = ?", [id], (err, data) => {
                if (err === null|| data === []) reject(`${err}`);
                else{
                    resolve({id: data[0].id, psword: data[0].password});
                    console.log({id: data[0].id, psword: data[0].password});
                }
            })
        })
    }

    static async save(userInfo, files) {
        return new Promise((resolve, reject) => {
            db.query("insert into student (id,name,password,dept,face1,face2) values(?, ?, ?, ?, ?, ?);",
                [userInfo.id, userInfo.name, userInfo.psword, userInfo.dept, files.file1.path, files.file2.path]
                , (err, data) => {
                if (err) reject(`${err}`);
                resolve({success: true});
            })
        })
    }
}

module.exports = UserStorage;