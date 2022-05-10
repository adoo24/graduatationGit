"use strict";

//모듈
const http = require("http");
const SocketIO = require("socket.io");
const express =require('express');
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const cons = require('consolidate')


//앱 세팅
app.set("views", "./src/views");
app.engine('ejs', cons.ejs);
app.engine('pug', cons.pug);
app.set('view engine', 'ejs')

app.use(express.static(`${__dirname}/src/public`))//미들웨어 등록
app.use(bodyParser.json());
// URL을 통해 전달되는 데이터에 한글, 공백 등과 같은 문자가 포함될 경우 제대로 인식되지 않는 문제 해결
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(expressSession({
    secret : 'my key',
    resave : true,
    saveUninitialized: true
}));
//라우팅
const home = require("./src/routes/home");

app.use("/", home); // use -> 미들웨어 등록해주는 메서드
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

const handListen = () => console.log(`listening on http://localhost:5000`);
httpServer.listen(3000, handListen);

module.exports = {
    app,
    wsServer,
}