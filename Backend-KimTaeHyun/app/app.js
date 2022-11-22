"use strict";

//모듈
const fs = require('fs');
const http = require("http");
const https = require("https");
const SocketIO = require("socket.io");
const express =require('express');
const db = require("./src/config/db");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
var FileStore = require('session-file-store')(expressSession);
var tmpid;
var tmpauth;
var tmpname;
var tmpPath1;
var tmpPath2;
var toDestory;

// Certificate 인증서 경로
const privateKey = fs.readFileSync('/etc/letsencrypt/live/bemysupervisor.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/bemysupervisor.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/bemysupervisor.com/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};



//앱 세팅
app.set("views", "./src/views");
app.set('view engine', 'ejs');

app.use(express.static(`${__dirname}/src/public`))//미들웨어 등록
app.use(bodyParser.json());
// URL을 통해 전달되는 데이터에 한글, 공백 등과 같은 문자가 포함될 경우 제대로 인식되지 않는 문제 해결
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
// app.enable('trust proxy');

app.use(expressSession({
    secret : 'my key',
    resave : false,
    saveUninitialized: true,
    store: new FileStore(),
    // cookie: {
    //     domain: 'bemysupervisor.com', path:'/',
    //     expires: new Date(Date.now() + 3600000)
    // }
}));
//라우팅
const home = require("./src/routes/home");

app.use("/", home); // use -> 미들웨어 등록해주는 메서드
// const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const wsServer = SocketIO(httpsServer);

app.get('/rooms', (req, res) =>{
    tmpid = req.session.uid;
    tmpauth = req.session.auth;
    tmpname = req.session.nickname;
    tmpPath1 = req.session.face1;
    tmpPath2 = req.session.face2;
    toDestory = req.session;
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

function updateNegativeScore(myRoomName, myId, scoreToAdd){ //수정
    for (let i = 0; i< roomObj.length; ++i){
        if(roomObj[i].roomName === myRoomName){
            let currentScore = roomObj[i].userScores.get(myId);
            let updateScore = currentScore+scoreToAdd;
            roomObj[i].userScores.set(myId, updateScore);
            console.log(myRoomName, myId, "의 현재점수: ", updateScore);
            return updateScore;
        }
    }
}

async function saveRoomDB(roomInfo){
    let rid = roomInfo.roomName;
    let rtime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let hostID = roomInfo.hostId;
    await db.query("insert into room (rid, hostID, rtime) values (?,?,?);",[rid, hostID, rtime], (err,data) =>{
      if (err) console.log(err);
      else console.log("룸 DB저장 성공");
    });
}

async function saveVideoDB(filePath, sid, rid){
    await db.query("insert into violation (sid, rid, address) values (?,?,?);", [sid, rid, filePath], (err,data) =>{
        if (err) console.log(err);
        else console.log("부정행위 DB저장 성공");
    });
}

wsServer.on("connection", (socket) => {
    let myRoomName = null;
    let myNickname = tmpname;
    let myId = tmpid;
    let myAuth = tmpauth;
    let myPath1 = tmpPath1;
    let myPath2 = tmpPath2;
    wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());
    socket.emit("authSend", myAuth);

    socket.on("join_room", (roomName) => {
        roomName = roomName
        myRoomName = roomName;
        let isRoomExist = false;
        let targetRoom = null;
        for (let i = 0; i < roomObj.length; ++i){
            if(roomObj[i].roomName === roomName){ //현재 존재하는 룸이 있다면 그 룸으로 들어간다.
                isRoomExist = true;
                targetRoom = roomObj[i];
                break;
	    }
        }

        if(!isRoomExist){ //현재 존재하는 룸이 없다면 룸을 새로 만든다.
            targetRoom = {
                hostId: myId, //todo. 시험 담당 교수의 id를 넣어줘야함. 시험이 끝난 후 교수는 자신이 맡은 과목 시험의 부정점수를 확인해야 함.
                roomName,
                currentCount: 0,
                users: [],
                userScores: new Map() //수정됨. 여기서 users를 key = userID, value = negativeScore
            };
            saveRoomDB(targetRoom);
            roomObj.push(targetRoom);
        }

        targetRoom.users.push({
            socketId: socket.id,
            myNickname,
            auth: myAuth
        });
        ++targetRoom.currentCount;

        if (targetRoom.userScores.has(myId) == false){
            targetRoom.userScores.set(myId,0) //점수 0으로 초기화
            console.log("유저점수 생성 완료" , targetRoom.userScores.get(myId));
        }

        socket.join(roomName);
        if(myAuth==="professor"){
            socket.emit("professorInfo", myId, myNickname, myAuth);
        }
        else{
            socket.emit("studentInfo", myId, myNickname, myAuth, myPath1, myPath2);
        }
        socket.emit("welcome", targetRoom.users);
        wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());

    });
    socket.on("offer", (offer, remoteSocketId, localNickname, localAuth) => {
        socket.to(remoteSocketId).emit("offer", offer, socket.id, localNickname, localAuth);
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
    socket.on("disconnecting", () => { //disconnection돼도 userScores map에선 삭제되지 않음. 시험 먼저끝나서 나가버린 경우에도 history가 남아야함.
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
    socket.on("capture", (file) => {
        fs.writeFile("/home/ubuntu/graduatationGit/Backend-KimTaeHyun/app/src/public/capture/" + myId + " " + myNickname + ".jpg", file, (err) => {if (err) console.log(err)});
    });
    socket.on("confirm", (confirmName) => {
        for (let i = 0; i < roomObj.length; ++i) {
            if (roomObj[i].roomName === myRoomName) {
                for (let j = 0; j < roomObj[i].users.length; ++j) {
                    if (roomObj[i].users[j].auth === "professor") {
                        socket.to(roomObj[i].users[j].socketId).emit("captureDone", confirmName);
                    }
                }
            }
        }
    });

    socket.on("violation", (scoreToAdd, professorSocket) => {
        let newScore = updateNegativeScore(myRoomName, myId, scoreToAdd);
        socket.to(professorSocket).emit("updateScore", socket.id, newScore);
    }); 

    socket.on("fraudCapture", (file) => {       //동영상 서버에 저장
        var today = new Date();   
        var hours = ('0' + today.getHours()).slice(-2); 
        var minutes = ('0' + today.getMinutes()).slice(-2);
        var seconds = ('0' + today.getSeconds()).slice(-2); 
        var timeString = hours + ':' + minutes  + ':' + seconds;
        var filePath = "/home/ubuntu/graduatationGit/Backend-KimTaeHyun/app/src/public/capture/" +"Fraud "+timeString+" " + myId + " " + myNickname + ".webm"
        fs.writeFile(filePath, file,  (err) => {if (err) console.log(err)});
        saveVideoDB(filePath, myId, myRoomName);
    });

    socket.on("logout", () => {
        if(toDestory.uid){
            toDestory.destroy(function(err){
                if(err){
                    console.log(err);
                }else{
                    console.log("go to mainpage");
                }
            })
        }else{
            console.log("go to mainpage");
        }
    })

    socket.on("startTest", () => {
        socket.to(myRoomName).emit("modelOn");
    });
    socket.on("finishTest", () => {
        socket.to(myRoomName).emit("modelOff");
    });
});

const handListen = () => console.log(`listening on http://localhost:3000`);
//httpServer.listen(3000, handListen);
httpsServer.listen(3000,handListen);



module.exports = {
    app,
    wsServer,
}
