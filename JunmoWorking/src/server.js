import http from "http";
import SocketIO from "socket.io"
import express from "express";

const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (_, res) => res.render('home'));
app.get('/*', (_, res) => res.redirect('/'));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

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

function publicRooms(){ // 현재 개설중인 방의 목록을 알려주는 함수이다. 
    const publicRooms = [];
    for (let i = 0; i < roomObj.length; ++i){
        publicRooms.push(roomObj[i].roomName);
    }
    return publicRooms;
}

function publicRoomCount(){ // 현재 개설중인 방의 인원수를 알려주는 함수이다. 
    const publicRoomCount = [];
    for (let i = 0; i < roomObj.length; ++i){
        publicRoomCount.push(roomObj[i].currentCount);
    }
    return publicRoomCount;
}

wsServer.on("connection", (socket) => {
    let myRoomName = null;
    let myNickname = null;
    wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount()); // 방에 누군가 들어가거나 나갈 경우 publicRooms, publicCount를 실행한다.

    socket.on("join_room", (roomName, nickname) => {    // join_room이 클라이언트 측에서 roomName, nickname을 매개변수로 emit 된 경우 실행한다.
        myRoomName = roomName;
        myNickname = nickname;

        let isRoomExist = false;
        let targetRoom = null;
        
        for (let i = 0; i < roomObj.length; ++i){   // 내가 들어가려는 방이 현재 있다면 그 방을 targetroom으로 한다.
            if(roomObj[i].roomName === roomName){
                isRoomExist = true;
                targetRoom = roomObj[i];
                break;
            }
        }

        if(!isRoomExist){   // 내가 들어가려는 방이 없다면 targetRoom을 새로 만든다.
            targetRoom = {
                roomName,
                currentCount: 0,
                users: [],
            };
            roomObj.push(targetRoom);
        }

        targetRoom.users.push({ // targetRoom으로 접속하고 count를 늘려준다.
            socketId: socket.id,
            nickname,
        });
        ++targetRoom.currentCount;

        socket.join(roomName);  // 방에 join 하는 socket.io 함수
        socket.emit("welcome", targetRoom.users);   // 클라이언트 측으로 targetRooms의 유저 목록을 매개변수로 하는 welcome을 emit한다.
        wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());
    });
    socket.on("offer", (offer, remoteSocketId, localNickname) => {  // 클라이언트 측에서 offer가 emit된 경우
        socket.to(remoteSocketId).emit("offer", offer, socket.id, localNickname);   // 상대의 소켓id로 본인의 소켓id와 닉네임을 변수로 offer을 emit한다.
    });
    socket.on("answer", (answer, remoteSocketId) => {   // 클라이언트 측에서 answer가 emit된 경우
        socket.to(remoteSocketId).emit("answer", answer, socket.id);    // 상대의 소켓id로 본인의 소켓id를 변수로 answer을 emit한다.
    });
    socket.on("ice", (ice, remoteSocketId) => { // 클라이언트 측에서 ice가 emit된 경우
        socket.to(remoteSocketId).emit("ice", ice, socket.id);  // ice를 emit하여 준다.
    });
    socket.on("chat", (message, roomName) => {  // 클라이언트 측에서 chat이 emit된 경우
        socket.to(roomName).emit("chat", message);  // 나를 제외한 방 전체로 chat을 emit한다.
    });
    socket.on("disconnecting", () => {  // disconnecting이 emit된 경우
        socket.to(myRoomName).emit("leave_room", socket.id, myNickname);    // 내가 접속한 방에 leave_room을 emit한다.

        let isRoomEmpty = false;
        for (let i = 0; i < roomObj.length; ++i){   // 방에서 나가면 user목록에서 나를 빼고 만약 사람이 없어진다면 방을 없앤다.
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
    socket.on("disconnect", () => { // disconnect가 emit되면 room_change를 emit한다.
        wsServer.sockets.emit("room_change", publicRooms(), publicRoomCount());
    });
});

const handListen = () => console.log(`listening on http://localhost:3000`);
httpServer.listen(3000, handListen);
