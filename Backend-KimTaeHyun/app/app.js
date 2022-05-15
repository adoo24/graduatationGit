"use strict";

//모듈
const http = require("http");
const SocketIO = require("socket.io");
const express =require('express');
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
var FileStore = require('session-file-store')(expressSession);


//앱 세팅
app.set("views", "./src/views");
app.set('view engine', 'ejs');

app.use(express.static(`${__dirname}/src/public`))//미들웨어 등록
app.use(bodyParser.json());
// URL을 통해 전달되는 데이터에 한글, 공백 등과 같은 문자가 포함될 경우 제대로 인식되지 않는 문제 해결
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
    secret : 'my key',
    resave : false,
    saveUninitialized: true,
    store: new FileStore(),
}));
//라우팅
const home = require("./src/routes/home");

app.use("/", home); // use -> 미들웨어 등록해주는 메서드
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

app.get('/rooms', (req, res) =>{
    console.log(req.session);
    res.render('home/rooms')
});

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

const handListen = () => console.log(`listening on http://localhost:3000`);
httpServer.listen(3000, handListen);



module.exports = {
    app,
    wsServer,
}