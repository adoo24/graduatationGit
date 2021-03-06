"use strict";

const express = require("express");
const router = express.Router();
const img = require("../../model/image-process.js");

const ctrl = require("./home.ctrl");

router.get("/", ctrl.output.home);
router.get("/login", ctrl.output.login);
router.get("/register", ctrl.output.register);
router.get("/face-register", ctrl.output.upload);

router.post("/login", ctrl.process.login);
router.post("/register",  ctrl.process.register);
router.post("/face-register", img.array('images', 2), ctrl.process.upload);

module.exports = router;