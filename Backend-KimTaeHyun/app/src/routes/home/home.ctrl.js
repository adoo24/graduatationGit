"use strict";

const UserStorage = require("../../model/UserStorage");
const User = require("../../model/User");
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
        const user = new User(req.body);
        info = req.body;
        const response = await user.register();
        return res.json(response);
    },
    upload: (req,res) => {
        const imageUpload = new ImageUpload(info, req.files);
    }
}

module.exports = {
    output,
    process,
};