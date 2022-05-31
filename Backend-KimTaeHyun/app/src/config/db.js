"use strict"

const mysql = require("mysql");

const db = mysql.createConnection({
    host : 'localhost',
    port : '3306',
    user: 'root',
    password: 'rlaxogus121@',
    database: 'bemysupervisor',
})
db.connect();

module.exports = db;