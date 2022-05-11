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
        // "/"이라는 URL 요청이 들어오면 home/index를 렌더링. 즉 /에 /view/home/index.ejs를 띄어놓는다 생각하면됨
        res.render("home/index");
    },
    login: (req, res) => {
        if (req.session.user){
            res.redirect('home/rooms') //session 유지 테스트
        } else
        res.render("home/login");
    },
    register: (req,res) =>{
        res.render("home/register");
    },
    upload: (req,res) =>{
        res.render("home/face-register");
    },
    rooms: (req,res) =>{
        res.render("home/rooms");

    }
}

var info;
const process = { //이경우 public/js/home에 있는 js파일들, 즉 프론트로부터 요청이 오면 처리하고 응답을 보냄.
    login: async (req, res) => {
        const user = new User(req); //req 파라미터로 user 객체 생성. req 안에는 id,psword가 json객체로 묶여있음.
        const response = await user.login(); //login함수 실행. 로그인 로직(db와 비교)처리 후 success t/f를 리턴
        return res.json(response);
    },
    register: async (req, res) => { //하는 일 없이 그저 upload로 req.body(이름,비번,학과 같은 text user info들) 넘겨주는 용도
        info = req.body;
        if (req.body.authority === "professor"){

        }
        return {success: true};
    },
    upload: (req,res) => { //실질적인 회원등록.
        console.log(req.files);
        const imageUpload = new ImageUpload(info, req.files); //유저정보, 유저얼굴사진 정보 함께 보냄
        const response = imageUpload.register(); //db에 저장
        return res.json(response); //성공/실패
    },
    rooms: (req,res) => {
        console.log("kd");
        let roomObj = [
            // {
            //     roomName,
            //     currentCount,
            //     users: [
            //         {
            //             socketId,
            //             nickname
            //         },
            //     ],
            // },
        ];

        function publicRooms(){
            const publicRooms = [];
            for (let i = 0; i < roomObj.length; ++i){
                publicRooms.push(roomObj[i].roomName);
            }
            return publicRooms;
        }

        function publicRoomCount(){
            const publicRoomCount = [];
            for (let i = 0; i < roomObj.length; ++i){
                publicRoomCount.push(roomObj[i].currentCount);
            }
            return publicRoomCount;
        }

        wsServer.on("connection", (socket) => {
            console.log("kd");
            let myRoomName = null;
            let myNickname = null;
            wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());

            socket.on("join_room", (roomName, nickname) => {
                myRoomName = roomName;
                myNickname = nickname;

                let isRoomExist = false;
                let targetRoom = null;

                for (let i = 0; i < roomObj.length; ++i){
                    if(roomObj[i].roomName === roomName){
                        isRoomExist = true;
                        targetRoom = roomObj[i];
                        break;
                    }
                }

                if(!isRoomExist){
                    targetRoom = {
                        roomName,
                        currentCount: 0,
                        users: [],
                    };
                    roomObj.push(targetRoom);
                }

                targetRoom.users.push({
                    socketId: socket.id,
                    nickname,
                });
                ++targetRoom.currentCount;

                socket.join(roomName);
                socket.emit("welcome", targetRoom.users);
                wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());

            });
            socket.on("offer", (offer, remoteSocketId, localNickname) => {
                socket.to(remoteSocketId).emit("offer", offer, socket.id, localNickname);
            });
            socket.on("answer", (answer, remoteSocketId) => {
                socket.to(remoteSocketId).emit("answer", answer, socket.id);
            });
            socket.on("ice", (ice, remoteSocketId) => {
                socket.to(remoteSocketId).emit("ice", ice, socket.id);
            });
            socket.on("chat", (message, roomName) => {
                socket.to(roomName).emit("chat", message);
            });
            socket.on("disconnecting", () => {
                socket.to(myRoomName).emit("leave_room", socket.id, myNickname);

                let isRoomEmpty = false;
                for (let i = 0; i < roomObj.length; ++i){
                    if(roomObj[i].roomName === myRoomName){
                        const newUsers = roomObj[i].users.filter(
                            (user) => user.socketId != socket.id
                        );
                        roomObj[i].users = newUsers;
                        --roomObj[i].currentCount;

                        if(roomObj[i].currentCount == 0){
                            isRoomEmpty = true;
                        }
                    }
                }
                if (isRoomEmpty){
                    const newRoomObj = roomObj.filter(
                        (roomObj) => roomObj.currentCount != 0
                    );
                    roomObj = newRoomObj;
                }

            });
            socket.on("disconnect", () => {
                wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());
            });
        });
    }
}

module.exports = { //module.exports하면 지금 이 파일 home.ctrl.js를 import한 곳에서 output과 process함수 사용 가능
    output,
    process,
};