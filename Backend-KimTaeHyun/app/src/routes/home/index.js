"use strict";

const express = require("express");
const router = express.Router();
const img = require("../../model/image-process.js");

const ctrl = require("./home.ctrl");

router.get("/", ctrl.output.home); //get post 자체가 요청
router.get("/login", ctrl.output.login);
router.get("/register", ctrl.output.register);
router.get("/face-register", ctrl.output.upload);

router.post("/login", ctrl.process.login); //login화면에서 login버튼 누르면 post로 요청이가고 ctrl의 login으로
router.post("/register",  ctrl.process.register);
router.post("/face-register", img.array('images', 2), ctrl.process.upload);

module.exports = router;