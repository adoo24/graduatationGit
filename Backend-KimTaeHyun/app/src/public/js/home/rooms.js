const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");


const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName = "";
let nickname = "";
let myPeerConnection;
let peopleInRoom = 1;
let auth = "";
let schoolid = "";

let pcObj = {

};

// 카메라를 찾는 함수

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option")
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

// 오디오와 비디오를 가져오는 함수 

async function getMedia(deviceId){
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user"},
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: deviceId },
    };
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
        
    } catch(e){
        console.log(e);
    }
}

// 뮤트

function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

// 카메라 껐다 켰다

function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));

    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

// 카메라 변환

async function handleCameraChange(){
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);

// Chatting room

const chatForm = document.querySelector("#chatForm");
const chatBox = document.querySelector("#chatBox");


function handleChatSubmit(event){
    event.preventDefault();
    const chatInput = chatForm.querySelector("input");
    const message = chatInput.value;
    chatInput.value = "";
    socket.emit("chat", `${nickname}: ${message}`, roomName);
    writeChat(`You: ${message}`);
}

function writeChat(message){
    const li = document.createElement("li");
    li.innerText = message;
    chatBox.appendChild(li);
}

chatForm.addEventListener("submit", handleChatSubmit);

// Welcome Form ( join a room )

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

// 방에들어가면

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
}
  


async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const inputRoomName = welcomeForm.querySelector("#roomName");
    roomName = inputRoomName.value;
    inputRoomName.value = "";
    socket.emit("join_room", roomName);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Leave Room

const leaveBtn = document.querySelector("#leave");

async function leaveRoom(){
    socket.disconnect();

    call.hidden = true;
    welcome.hidden = false;


    peopleInRoom = 1;
    nickname = "";
    auth = "";
    schoolid = "";
    myStream.getTracks().forEach((track) => track.stop());
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = "";
    
    myFace.srcObject = null;
    await clearAllVideos();
    await clearAllChat();
    document.location.reload();
}

function removeVideo(leaveSocktId){
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if(streamElement.id === leaveSocktId){
            streams.removeChild(streamElement);
        }
    });
}

async function clearAllVideos(){
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if(streamElement.id != "myStream"){
            streams.removeChild(streamElement);
        }
    });
}

async function clearAllChat(){
    const chatArr = chatBox.querySelectorAll("li");
    chatArr.forEach((chat) => chatBox.removeChild(chat));
}


leaveBtn.addEventListener("click", leaveRoom);

// Socket Code

socket.on("info", async(myId, myNickname, myAuth) => {
    schoolid = myId;
    nickname = myNickname;
    auth = myAuth;
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = nickname;
});


socket.on("welcome", async (userObj) => {
    await initCall();
    const length = userObj.length;
    if (length === 1){
        return;
    }
    for (let i = 0 ; i < length - 1; ++i){
        try{
            const newPC = makeConnection(
                userObj[i].socketId,
                userObj[i].myNickname,
                userObj[i].myAuth
            );
            const offer = await newPC.createOffer();
            await newPC.setLocalDescription(offer);
            socket.emit("offer", offer, userObj[i].socketId, nickname, auth);
        } catch (err){
            console.error(err);
        }
    }
});

socket.on("offer", async(offer, remoteSocketId, remoteNickname, remoteAuth) => {
    try{
        const newPC = makeConnection(remoteSocketId, remoteNickname, remoteAuth);
        await newPC.setRemoteDescription(offer);
        const answer = await newPC.createAnswer();
        await newPC.setLocalDescription(answer);
        socket.emit("answer", answer, remoteSocketId);
        writeChat(`${remoteNickname} joined the room`);
    } catch (err){
        console.error(err);
    }
});

socket.on("answer", async (answer, remoteSocketId) => {
    await pcObj[remoteSocketId].setRemoteDescription(answer);
});

socket.on("ice", async (ice, remoteSocketId) => { // ice 교환
    await pcObj[remoteSocketId].addIceCandidate(ice);
});

socket.on("chat", (message) => {
    writeChat(message);
});

socket.on("leave_room", (leaveSocktId, nickname) => {
    removeVideo(leaveSocktId);
    writeChat(`${nickname} leaved the room`);
    --peopleInRoom;
    
})

socket.on("room_change", (rooms, roomCount) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){
        return;
    }
    for (let i = 0; i < rooms.length; ++i){
        const li = document.createElement("li");
        li.innerText = `${rooms[i]}(${roomCount[i]})`;
        roomList.append(li);
    }
});

// RTC Code

function makeConnection(remoteSocketId, remoteNickname, remoteAuth) {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
        {
            urls: [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
            ],
          },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", (event) => {
        handleIce(event, remoteSocketId);
    });
    console.log(auth);
    console.log("------");
    console.log(remoteAuth);
    if (auth === 'professor'){
        console.log("123123");
        myPeerConnection.addEventListener("addstream", (event) => {
            handleAddStream(event, remoteSocketId, remoteNickname);
        });
        myStream
          .getTracks()
          .forEach((track) => myPeerConnection.addTrack(track, myStream));
    }
    else if (remoteAuth === 'professor'){
        console.log("234234")
        myPeerConnection.addEventListener("addstream", (event) => {
            handleAddStream(event, remoteSocketId, remoteNickname);
        });
        myStream
          .getTracks()
          .forEach((track) => myPeerConnection.addTrack(track, myStream));
    }

    
    pcObj[remoteSocketId] = myPeerConnection;

    ++peopleInRoom;
    return myPeerConnection;
}
  
  
function handleIce(event, remoteSocketId){
    if (event.candidate){
        socket.emit("ice", event.candidate, remoteSocketId);
    }
}

function handleAddStream(event, remoteSocketId, remoteNickname){
    const peerStream = event.stream;
    paintPeerFace(peerStream, remoteSocketId, remoteNickname);
}

function paintPeerFace(peerStream, id, remoteNickname){
    const streams = document.querySelector("#streams");
    const div = document.createElement("div");
    div.id = id;
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.width = "400";
    video.height = "400";
    video.srcObject = peerStream;
    const nicknameContainer = document.createElement("h3");
    nicknameContainer.id = "userNickname";
    nicknameContainer.innerText = remoteNickname;
    
    div.appendChild(video);
    div.appendChild(nicknameContainer);
    streams.appendChild(div);
}

