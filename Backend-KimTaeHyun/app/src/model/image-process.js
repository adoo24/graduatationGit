"use strict";

const multer = require("multer")

const path = require('path');
const upload = multer({
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

// router.post("/face-register", upload.array('faces'), (req,res) =>{
//     res.json(req.file)
//     console.log(req.file)
// });





