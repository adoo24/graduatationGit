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

    static async save(userInfo) {
        return new Promise((resolve, reject) => {
            db.query("insert into student (id,name,password,dept) values(?, ?, ?, ?);",
                [userInfo.id, userInfo.name, userInfo.psword, userInfo.dept]
                , (err, data) => {
                if (err) reject(`${err}`);
                resolve({success: true});
            })
        })
    }
}

module.exports = UserStorage;