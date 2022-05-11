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
        video: { deviceId: { exact: deviceId} },
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

// 뮤트 기능

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

// 카메라를 껐다 켰다

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

// 카메라를 변환하는 함수

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

// 채팅 함수
function handleChatSubmit(event){  
    event.preventDefault();
    const chatInput = chatForm.querySelector("input");
    const message = chatInput.value;
    chatInput.value = "";
    socket.emit("chat", `${nickname}: ${message}`, roomName);   // 서버측으로 chat을 emit한다. 
    writeChat(`You: ${message}`);   // 내가 쓴 chat을 작성한다.
}

// 메세지를 출력하는 함수
function writeChat(message){
    const li = document.createElement("li");
    li.innerText = message;
    chatBox.appendChild(li);
}

chatForm.addEventListener("submit", handleChatSubmit);

// Welcome Form ( join a room )

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

// 방에들어가면 실행 welcome을 hidden해주고 call을 보여준다.

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
}
  
// join버튼을 누른 경우 실행되는 함수

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const inputRoomName = welcomeForm.querySelector("#roomName");
    const inputNickname = welcomeForm.querySelector("#nickname");
    const nicknameContainer = document.querySelector("#userNickname");
    roomName = inputRoomName.value; // 내가 입력한 roomName
    inputRoomName.value = "";
    nickname = inputNickname.value; // 내가 입력한 nickname
    inputNickname.value = "";
    nicknameContainer.innerText = nickname;
    socket.emit("join_room", roomName, nickname);   // 서버 측으로 내가 입력한 roomName과 nickname을 매개변수로 하는 join_room을 emit한다.
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Leave Room

const leaveBtn = document.querySelector("#leave");

// 방을 나가는 함수
function leaveRoom(){
    socket.disconnect();

    call.hidden = true;
    welcome.hidden = false;


    peopleInRoom = 1;
    nickname = "";

    myStream.getTracks().forEach((track) => track.stop());
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = "";
    
    myFace.srcObject = null;
    clearAllVideos();
    clearAllChat();
    document.location.reload(); // 화면을 새로고침하여 준다.
}

// 나간 사람의 비디오를 없애는 함수
function removeVideo(leaveSocktId){
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if(streamElement.id === leaveSocktId){
            streams.removeChild(streamElement);
        }
    });
}

// 다른 사람들의 비디오를 없애는 함수
function clearAllVideos(){
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if(streamElement.id != "myStream"){
            streams.removeChild(streamElement);
        }
    });
}

// 챗을 지우는 함수
function clearAllChat(){
    const chatArr = chatBox.querySelectorAll("li");
    chatArr.forEach((chat) => chatBox.removeChild(chat));
}


leaveBtn.addEventListener("click", leaveRoom);

// Socket Code

socket.on("welcome", async (userObj) => { // 서버측에서 welcome이 emit된 경우
    await initCall();
    
    const length = userObj.length;
    if (length === 1){  // 방에 혼자밖에 없으면 return한다.
        return;
    }
    for (let i = 0 ; i < length - 1; ++i){
        try{
            const newPC = makeConnection(   // 방의 다른 모든 유저들에 대하여 각각 makeConnection한다.
                userObj[i].socketId,
                userObj[i].nickname
            );
            const offer = await newPC.createOffer();    // offer을 생성한다.
            await newPC.setLocalDescription(offer);     // offer을 LocalDescription에 등록한다.
            socket.emit("offer", offer, userObj[i].socketId, nickname); // 서버측에 상대의 소켓id와 본인의 닉네임을 매개변수로 offer을 emit한다.
        } catch (err){
            console.error(err);
        }
    }
});

// 서버측에서 offer이 emit된 경우 실행한다.
socket.on("offer", async(offer, remoteSocketId, remoteNickname) => {
    try{
        const newPC = makeConnection(remoteSocketId, remoteNickname);   // 상대와 makeConnection해준다.
        await newPC.setRemoteDescription(offer);    // 받아들인 offer을 RemoteDescription에 등록한다.
        const answer = await newPC.createAnswer();  // answer을 생성한다.
        await newPC.setLocalDescription(answer);    // answer을 LocalDescription에 등록한다.
        socket.emit("answer", answer, remoteSocketId);  // answer을 서버측에 emit한다.
        writeChat(`${remoteNickname} joined the room`);
    } catch (err){
        console.error(err);
    }
});

socket.on("answer", async (answer, remoteSocketId) => { // 서버측에서 answer이 emit된 경우
    await pcObj[remoteSocketId].setRemoteDescription(answer);   // 받은 answer을 RemoteDescription에 등록한다.
});

socket.on("ice", async (ice, remoteSocketId) => { // ice가 emit된 경우
    await pcObj[remoteSocketId].addIceCandidate(ice);
});

socket.on("chat", (message) => {    // chat이 emit된 경우 writechat을 한다.
    writeChat(message);
});

socket.on("leave_room", (leaveSocktId, nickname) => {   // leave_room이 emit된 경우 
    removeVideo(leaveSocktId);  // 해당 인물의 비디오를 지우고 나갔다는 메세지를 출력한다.
    writeChat(`${nickname} leaved the room`);
    --peopleInRoom;
    
})

socket.on("room_change", (rooms, roomCount) => {    // room_change가 emit된 경우 방의 목록과 인원을 출력한다.
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

function makeConnection(remoteSocketId, remoteNickname) {
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
    if (nickname === 'admin'){  // 만약 본인이 관리자라면 
        myPeerConnection.addEventListener("addstream", (event) => {
            handleAddStream(event, remoteSocketId, remoteNickname); // 상대의 stream을 출력하고
        });
        myStream
          .getTracks()
          .forEach((track) => myPeerConnection.addTrack(track, myStream));  // 본인의 stream을 상대에게 전송한다.
    }
    else if (remoteNickname === 'admin'){   // 만약 본인이 관리자가 아니고 상대가 관리자라면
        myPeerConnection.addEventListener("addstream", (event) => { // 상대의 stream을 출력하고
            handleAddStream(event, remoteSocketId, remoteNickname);
        });
        myStream
          .getTracks()
          .forEach((track) => myPeerConnection.addTrack(track, myStream));  // 본인의 stream을 상대에게 전송한다.
    }

    
    pcObj[remoteSocketId] = myPeerConnection;

    ++peopleInRoom;
    return myPeerConnection;
}
  
  
function handleIce(event, remoteSocketId){
    if (event.candidate){
        socket.emit("ice", event.candidate, remoteSocketId);    // 서버 측으로 ice를 emit한다.
    }
}

function handleAddStream(event, remoteSocketId, remoteNickname){    // stream을 화면에 출력한다.
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
