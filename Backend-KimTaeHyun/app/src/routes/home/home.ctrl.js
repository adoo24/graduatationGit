"use strict";

const UserStorage = require("../../model/UserStorage");
const User = require("../../model/User");
const ImageUpload = require("../../model/ImageUpload")
const multer = require("multer");
const http = require("http");
const SocketIO = require("socket.io");
const upload = multer({dest: "images/"});
const wsServer = require("../../../app")

const output = {
    home: (req, res) => {
        console.log(req.session);
        // "/"이라는 URL 요청이 들어오면 home/index를 렌더링. 즉 /에 /view/home/index.ejs를 띄어놓는다 생각하면됨
        res.render("home/index");
    },
    login: (req, res) => {
        // if (req.session.isLogined === true){
        //     res.redirect('/rooms') //session 유지 테스트
        // } else
        res.render("home/login");
    },
    register: (req,res) =>{
        res.render("home/register");
    },
    upload: (req,res) =>{
        res.render("home/face-register");
    },
}


var info;

const process = { //이경우 public/js/home에 있는 js파일들, 즉 프론트로부터 요청이 오면 처리하고 응답을 보냄.
    login: async (req, res) => {
        const user = new User(req); //req 파라미터로 user 객체 생성. req 안에는 id,psword가 json객체로 묶여있음.
        const response = await user.login(); //login함수 실행. 로그인 로직(db와 비교)처리 후 success t/f를 리턴
        if (response.success){
            req.session.isLogined = true;
            req.session.uid = response.id;
            req.session.nickname = response.nickname;
            req.session.auth = response.auth;
            req.session.face1 = response.face1;
            req.session.face2 = response.face2;
        }
        return res.json(response);
    },
    register: async (req, res) => {
        info = req.body;
        const user = new User(req);
        if (req.body.auth === 'professor') {
            let response = await user.checkUser(); //중복인지 체크부터 한다.
            if (response.success == true){
                response = await user.register();
            }
            return res.json(response);
        } else{
            const response = await user.checkUser(); //유저아이디만 보내서 중복됐는지 검사
            return res.json(response);
        }
    }
    ,
    upload: (req, res) => { //실질적인 회원등록.
        console.log(req.files);
        console.log(info);
        const imageUpload = new ImageUpload(info, req.files); //유저정보, 유저얼굴사진 정보 함께 보냄
        const response = await imageUpload.register(); //db에 저장
        console.log(response);
        return res.json(response); //성공/실패
    },
}

module.exports = { //module.exports하면 지금 이 파일 home.ctrl.js를 import한 곳에서 output과 process함수 사용 가능
    output,
    process,
};