const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const captureBtn = document.getElementById("capture");
const testBtn = document.getElementById("test");
const canvas = document.getElementById("canvas");
const logOutBtn = document.getElementById("logout");


const call = document.getElementById("call");

call.hidden = true;
canvas.hidden = true;
let myStream;
let onlyStream;
let muted = false;
let cameraOff = false;
let testing = false;
let roomName = "";
let nickname = "";
let myPeerConnection;
let peopleInRoom = 1;
let auth = "";
let schoolid = "";
let path1 = ""
let path2 = ""
let interval1;
let interval2;
let interval3;
let professorSocket;
let changeForm;
let changeValue;

let pcObj = {

};

let studentList = {};

// 카메라를 찾는 함수

logOutBtn.addEventListener("click", () => {
    socket.emit("logout");
    document.location.replace('/');
    console.log("go to main page");
})

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
    //
    const myInitialConstrains = {
        audio: false,
        video: { facingMode: "user"},
    };
    const myCameraConstraints = {
        audio: false,
        video: { deviceId: deviceId },
    };

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
        onlyStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? myCameraConstraints : myInitialConstrains
        );
        myFace.srcObject = onlyStream;
        document.getElementById("myStream").style.order= -999;
        if(!deviceId){
            await getCameras();
        }
        
    } catch(e){
        console.log(e);
    }
}
let recorder;
let recordedBlobs=[];
for (let i =0;i<10;i++){
    recordedBlobs[i]=new Array();
}
let state=0;
const wait = (timeToDelay) => new Promise((resolve)=> setTimeout(resolve, timeToDelay))


async function handleRecording(){                 //영상 5초단위로 저장하는 함수들
    state=(state+1)%10
    await startRecording();
    await wait(4000)
    await stopRecording()
    await wait(300)
    download()
}

function handleDataAvailable(event){
    if (event.data && event.data.size>0){
        recordedBlobs[state].push(event.data);
    }
}


async function startRecording(){
    recordedBlobs[state]=[];
    var options ={mimeType: 'video/webm'};
    recorder=await new MediaRecorder(myFace.srcObject,options);
    recorder.ondataavailable = handleDataAvailable;
    recorder.start(10);
    console.log("recorder started",state,recorder)
}

async function stopRecording(){
    console.log("stop에서 부른 recorder",state,recorder)
    recorder.stop();
    console.log("recorder stopped")
}

var shouldDownload=false;           //부정행위 발생시 true로 변해서 영상 다운로드

async function download(){                //영상 다운로드 로직
    if (!shouldDownload){console.log('Not downloaded',recordedBlobs[state],state);
     return;}
    var blob= new Blob(recordedBlobs[state],{type:'video/webm'});
    var myvideo=await blobToFile(blob,"myvideo.webm")
    socket.emit("fraudCapture",myvideo);
    console.log('Downloaded',recordedBlobs[state],state)
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href=url;
    a.download='test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },100);
}

let flag=1;     //손 위치 인식하기 위해서, 0이면 손들었다고 인식
let left_cnt=0
let right_cnt=0
let noFace_cnt=0
let twoFace_cnt=0
function initiate(){        //부정 행위 로직 초기화
    left_cnt=0
    right_cnt=0
    noFace_cnt=0
    twoFace_cnt=0
    noFace_cnt=0
    shouldDownload=false
}
const detectFaces = async () => {
    const [prediction] = await Promise.all([model.estimateFaces(myFace, false)])
    if(left_cnt+right_cnt>30){                              //얼굴이 정면을 충분히 바라보지 않음
        negScore = 1
        socket.emit("violation",negScore, professorSocket);
        left_cnt=0;
        right_cnt=0;
        noFace_cnt=0;
        shouldDownload=true                                 //부정행위 발생, 다운로드 한다고 판단
        console.log('Do not shake your head')
    }
    if(noFace_cnt>20){
        negScore = 3
        socket.emit("violation",negScore, professorSocket);
        noFace_cnt=0;
        shouldDownload=true
    }
    if(twoFace_cnt>20){
        negScore = 3;
        socket.emit("violation",negScore, professorSocket);
        twoFace_cnt=0;
        shouldDownload=true
    }
    if(prediction.length>1){
        console.log("2 or more faces detected")
        twoFace_cnt+=1
        return
    }
    else if(prediction==0){
        console.log("No Faces detected")
        noFace_cnt+=1
        return
    }
    else noFace_cnt=0;
    prediction.forEach((pred) => {                  //0.1초에 한번씩 얼굴 및 손 위치 분석
        let eye=[[pred.landmarks[0][0],pred.landmarks[0][1]],[pred.landmarks[1][0],pred.landmarks[1][1]]];
        let center_eyes=[(pred.landmarks[0][0]+pred.landmarks[1][0])/2,(pred.landmarks[0][1]+pred.landmarks[1][1])/2]
        if(pred.landmarks[2][0]<(eye[0][0]+center_eyes[0])/2){
            console.log("Left")
            left_cnt+=1                             //왼쪽을 보고 있음
        }
        else if(pred.landmarks[2][0]>(eye[1][0]+center_eyes[0])/2){
            console.log("Right")
            right_cnt+=1                            //오른쪽을 보고 있음
        }
        else{
            console.log("Center")                   //아니면 중앙
        }
    });

};
myFace.addEventListener("loadeddata", async () =>{
     try {
         if (auth == "student") {
             model = await blazeface.load();
             //setInterval(detectFaces, 100);
             //setInterval(handleRecording,10000);          //5초에 한번씩 영상 저장할지 말지 정함
             //setInterval(initiate,10000);   
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
    onlyStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

// 테스트 시작 / 종료

function handleTestClick() {
    if(testing) {
        testBtn.innerText = "test start";
        testing = false;
        writeChat("시험을 종료합니다");
        socket.emit("finishTest");
    } else {
        testBtn.innerText = "test finish";
        testing = true;
        writeChat("시험을 시작합니다");
        socket.emit("startTest");
    }
}

socket.on("modelOn", () => {
    writeChat("시험을 시작합니다");
    console.log("시험시작");
    try {
        if (auth == "student") {
            interval1 = setInterval(detectFaces, 100);
            interval2 = setInterval(handleRecording,5000);          //5초에 한번씩 영상 저장할지 말지 정함
            interval3 = setInterval(initiate,5000);   
        }
    } catch (e) {
        console.log(e);
    }
});

socket.on("modelOff", () => {
    writeChat("시험을 종료합니다");
    console.log("시험 종료");
    try {
        if (auth = "student") {
            clearInterval(interval1);
            clearInterval(interval2);
            clearInterval(interval3);
        }
    } catch (e) {
        console.log(e);
    }
});

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

function blobToFile(theBlob, fileName){
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
}
async function fraudCapture(url){
    canvas.getContext('2d').drawImage(myFace, 0, 0, canvas.width, canvas.height);
    var file = dataURLtoFile(url, 'capture.webm');
    socket.emit("fraudCapture",file)
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
                if (bestMatch.label == "Junseo") {           //유동적으로 바뀌게 수정해야함
                    alert("사진과 일치합니다.");
                    socket.emit("confirm", nickname);
                }
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
testBtn.addEventListener("click", handleTestClick);
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

// 감독관에게 studentList 보여주기

const studentBox = document.querySelector("#studentBox");

function insertStudent(student){
    const find = document.getElementById(student);
    if (find) {
        return;
    }
    const li = document.createElement("li");
    li.innerText = student + " : 미 인증";
    li.id = student;

    studentBox.appendChild(li);
}

function deleteStudent(student){
    const li = document.getElementById(student);
    li.remove();
}

socket.on("captureDone", (doneStudent) => {
    const li = document.getElementById(doneStudent);
    li.innerText = doneStudent + " : 인증 완료";
    console.log("인증 완료 학생 추가");
})

//socket.on("violation", ??? ) ???에 해당 부정행위가 뭔지랑 동영상 저장된 경로만 보내주면됨

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

function removeVideo(leaveSocketId){
    const streams = document.querySelector("#streams");
    const streamArr = streams.querySelectorAll("div");
    streamArr.forEach((streamElement) => {
        if(streamElement.id === leaveSocketId){
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

const professorForm = document.getElementById("professorForm");

socket.on("authSend", (getAuth) => {
    auth = getAuth;
    if (getAuth == "student") {
        professorForm.hidden = true;
    }
});

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
    studentBox.hidden = true;
    testBtn.hidden = true;
});

socket.on("professorInfo", async(myId, myNickname, myAuth) => {
    schoolid = myId;
    nickname = myNickname;
    auth = myAuth;
    const nicknameContainer = document.querySelector("#userNickname");
    nicknameContainer.innerText = nickname;
    captureBtn.hidden=true;
    studentBox.hidden=false;
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
            const newPC = await makeConnection(
                userObj[i].socketId,
                userObj[i].myNickname,
                userObj[i].auth
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
        const newPC = await makeConnection(remoteSocketId, remoteNickname, remoteAuth);
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

socket.on("leave_room", (leaveSocketId, nickname) => {
    removeVideo(leaveSocketId);
    deleteStudent(nickname);
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
        const li = document.createElement("button");
        li.innerText = `${rooms[i]}`;
        roomList.append(li);
    }
    for (let i =0;i<rooms.length;i++){
        const btn = roomList.childNodes[i];
        btn.onclick = function(event){
            socket.emit("join_room",`${rooms[i]}`);
        }
    }
});

// 변경된 점수 받기
socket.on("updateScore", (remoteSocketId, updateScore) => {
    studentList[remoteSocketId] = updateScore;
    document.getElementById(remoteSocketId).style.order = -1 * updateScore;
    document.getElementById(remoteSocketId).childNodes[2].innerText = updateScore; //?
});

// RTC Code

async function makeConnection (remoteSocketId, remoteNickname, remoteAuth) {
    myPeerConnection = await new RTCPeerConnection({
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
        myPeerConnection.addEventListener("addstream", (event) => {
            handleAddStream(event, remoteSocketId, remoteNickname, remoteAuth);
        });
        myStream
          .getTracks()
          .forEach((track) => myPeerConnection.addTrack(track, myStream));
        if (remoteAuth == 'student'){
            insertStudent(remoteNickname);
            studentList[remoteSocketId] = 0;
        }
    }
    else if (remoteAuth === 'professor'){
        myPeerConnection.addEventListener("addstream", (event) => {
            handleAddStream(event, remoteSocketId, remoteNickname, remoteAuth);
        });
        myStream
          .getTracks()
          .forEach((track) => myPeerConnection.addTrack(track, myStream));
        professorSocket = remoteSocketId;
        console.log(`상대 소켓 아이디는 ${professorSocket}`);
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

function handleAddStream(event, remoteSocketId, remoteNickname, remoteAuth){
    const peerStream = event.stream;
    paintPeerFace(peerStream, remoteSocketId, remoteNickname, remoteAuth);
}

function paintPeerFace(peerStream, id, remoteNickname, remoteAuth){
    const streams = document.querySelector("#streams");
    const div = document.createElement("div");
    div.id = id;
    div.style.order = studentList[id];
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
    if (remoteAuth != 'professor') {
        const scoreContainer = document.createElement("h3");
        scoreContainer.id = "userNegScore"
        scoreContainer.innerText = 0;
        div.appendChild(scoreContainer);
    }
    streams.appendChild(div);
}

