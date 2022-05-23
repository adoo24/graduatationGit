"use strict";

const multer = require("multer")

const path = require('path');
const upload = multer({ //저장 경로 지정
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'images/');
        },
        filename: function (req, file, cb) {
            cb(null, new Date().valueOf() + path.extname(file.originalname));
        }
    }),
});

module.exports = upload;





