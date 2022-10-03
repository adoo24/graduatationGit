"use strict"

const mysql = require("mysql");

const db = mysql.createConnection({
    host : 'gamdokdb.cy573e95fr0y.ap-northeast-2.rds.amazonaws.com',
    port : '3306',
    user: 'root',
    password: '12345678',
    database: 'gamdokdb',
})
db.connect();

module.exports = db;