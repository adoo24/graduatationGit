const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const captureBtn = document.getElementById("capture");
const canvas = document.getElementById("canvas");


const call = document.getElementById("call");

call.hidden = true;
canvas.hidden = true;
let myStream;
let muted = false;
let cameraOff = false;
let roomName = "";
let nickname = "";
let myPeerConnection;
let peopleInRoom = 1;
let auth = "";
let schoolid = "";
let path1 = ""
let path2 = ""

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

let flag=1;
let left_cnt=0
let right_cnt=0
let noFace_cnt=0
let negScore=0
const detectFaces = async () => {
    try {
        const [prediction, predictions] = await Promise.all([model.estimateFaces(myFace, false), model1.estimateHands(myFace)])
        if (predictions.length > 0) {
            const result = predictions[0].landmarks;
            for (let i = 0; i < 5; i++) {                                  //y값 위치로 손모양 판별
                for (let j = 0; j < 3; j++) {
                    if (result[(i * 4) + j + 2][1] > result[(i * 4) + j + 1][1]) {
                        flag = 0;
                    }
                }
            }
            for (let i = 0; i < 4; i++) {                               //왼손만 인식
                for (let j = 0; j < 4; j++) {
                    if (result[(i + 1) * 4 + j + 1][0] < result[i * 4 + j + 1][0]) {
                        flag = 0;
                    }
                }
            }
            if (flag == 1) {
                console.log("It is hand")
            } else flag = 1;
        }
        if (left_cnt > 10 || right_cnt > 10 || noFace_cnt > 10) {
            negScore++
            left_cnt = 0;
            right_cnt = 0;
            noFace_cnt = 0;
        }
        if (prediction.length > 1) {
            console.log("2 or more faces detected")
            return
        } else if (prediction == 0) {
            console.log("No Faces detected")
            noFace_cnt += 1
            return
        } else noFace_cnt = 0;
        prediction.forEach((pred) => {
            let eye = [[pred.landmarks[0][0], pred.landmarks[0][1]], [pred.landmarks[1][0], pred.landmarks[1][1]]];
            let center_eyes = [(pred.landmarks[0][0] + pred.landmarks[1][0]) / 2, (pred.landmarks[0][1] + pred.landmarks[1][1]) / 2]
            if (pred.landmarks[2][0] < (eye[0][0] + center_eyes[0]) / 2) {
                console.log("Left")
                left_cnt += 1
            } else if (pred.landmarks[2][0] > (eye[1][0] + center_eyes[0]) / 2) {
                console.log("Right")
                right_cnt += 1
            } else {
                console.log("Center")
                left_cnt = 0
                right_cnt = 0
            }
        });
    } catch (e) {
        console.log(e);
    }

};
myFace.addEventListener("loadeddata", async () =>{
    try {
        if (auth == "student") {
            model = await blazeface.load();
            model1 = await handpose.load();
            setInterval(detectFaces, 100);
        }
    } catch (e) {
        console.log(e);
    }
});
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

// 캡쳐

const dataURLtoFile = (dataurl, fileName) => {
 
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
        
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], fileName, {type:mime});
}




captureBtn.addEventListener("click", async function() {
    canvas.getContext('2d').drawImage(myFace, 0, 0, canvas.width, canvas.height);
    let image_data_url = canvas.toDataURL('image/jpeg');
    var file = dataURLtoFile(image_data_url, 'capture.jpg');
    Promise.all([
        socket.emit("capture", file),
        faceapi.nets.faceRecognitionNet.loadFromUri('js/home/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('js/home/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('js/home/models'),
    ])
        .then(start)

    async function start() {
        try {
            let image = await faceapi.fetchImage('capture/' + schoolid + ' ' + nickname + '.jpg')
            const labeledFaceDescriptors = await loadLabeledImages()
            const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45)
            console.log("Model Loaded")
            const singleResult = await faceapi
                .detectSingleFace(image)
                .withFaceLandmarks()
                .withFaceDescriptor()
            if (singleResult) {
                const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor)
                if (bestMatch.label == "Junseo")              //유동적으로 바뀌게 수정해야함
                    alert("사진과 일치합니다.")
                else
                    alert("사진과 일치하지 않습니다.")
            } else {
                alert("얼굴이 감지되지 않습니다. 다시 한번 캡처해주세요.")
            }
        } catch (e) {
            console.log(e);
        }
    }

    function loadLabeledImages() {
        const labels = ["Junseo"]
        return Promise.all(
            labels.map(async label => {
                    try {
                        const descriptions = []
                        let img = await faceapi.fetchImage(path1); //회원가입했을때사진
                        let detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                        descriptions.push(detections.descriptor)
                        img = await faceapi.fetchImage(path2); //회원가입했을때사진
                        detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                        descriptions.push(detections.descriptor)
                        return new faceapi.LabeledFaceDescriptors(label, descriptions)
                    } catch (e) {
                        console.log(e);
                    }
                }
            )
        )
    }
});




// 카메라 변환

async function handleCameraChange(){
    try {
        await getMedia(cameraSelect.value);
        if (myPeerConnection) {
            const videoTrack = myStream.getVideoTracks()[0];
            const videoSender = myPeerConnection
                .getSenders()
                .find((sender) => sender.track.kind === "video");
            videoSender.replaceTrack(videoTrack);
        }
    } catch (e) {
        console.log(e);
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
    try {
        welcome.hidden = true;
        call.hidden = false;
        await getMedia();
    } catch (e) {
        console.log(e);
    }
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
    try {
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
    } catch (e) {
        console.log(e);
    }
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

socket.on("studentInfo", async(myId, myNickname, myAuth, myPath1, myPath2) => {
    schoolid = myId;
    nickname = myNickname;
    auth = myAuth;
    path1 = myPath1;
    path2 = myPath2;
    path1 = path1.replace(/\\/g, '/');
    path2 = path2.replace(/\\/g, '/');
    path1 = path1.substr(11);
    path2 = path2.substr(11);

    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = nickname;
});

socket.on("professorInfo", async(myId, myNickname, myAuth) => {
    schoolid = myId;
    nickname = myNickname;
    auth = myAuth;
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = nickname;
    captureBtn.hidden=true;
})

socket.on("welcome", async (userObj) => {
    try {
        await initCall();
    } catch (e) {
        console.log(e);
    }
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
    try {
        await pcObj[remoteSocketId].setRemoteDescription(answer);
    } catch (e) {
        console.log(e);
    }
});

socket.on("ice", async (ice, remoteSocketId) => { // ice 교환
    try {
        await pcObj[remoteSocketId].addIceCandidate(ice);
    } catch (e) {
        console.log(e);
    }
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

