import http from "http";
import SocketIO from "socket.io"
import express from "express";

const app = express();


app.set('view engine', 'pug');
app.set('views', __dirname + './src/views');
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

const handListen = () => console.log(`listening on http://localhost:5000`);
httpServer.listen(5000, handListen);
