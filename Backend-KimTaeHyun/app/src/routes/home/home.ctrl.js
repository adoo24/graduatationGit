"use strict";

const UserStorage = require("../../model/UserStorage");
const User = require("../../model/User");
const ImageUpload = require("../../model/ImageUpload")
const multer = require("multer");
const upload = multer({dest: "images/"});

const output = {
    home: (req, res) => {
        res.render("home/index");
    },
    login: (req, res) => {
        if (req.session.user){
            res.redirect('home/rooms')
        } else
        res.render("home/login");
    },
    register: (req,res) =>{
        res.render("home/register");
    },
    upload: (req,res) =>{
        res.render("home/face-register");
    }
}

var info;
const process = {
    login: async (req, res) => {
        const user = new User(req);
        const response = await user.login();
        return res.json(response);
    },
    register: async (req, res) => {
        info = req.body;
        return {success: true};
    },
    upload: (req,res) => {
        console.log(req.files);
        const imageUpload = new ImageUpload(info, req.files);
        const response = imageUpload.register();
        return res.json(response);
    }
}

module.exports = {
    output,
    process,
};