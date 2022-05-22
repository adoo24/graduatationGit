let video = document.getElementById("video");
let model, model1;
let fingerLookupIndices ={
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20]
  }
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const setUpCamera = () =>{
    navigator.mediaDevices.getUserMedia({
        video: {width: 600, height: 400},
        audio: false,
        facingMode: 'user'
    })
    .then((stream)=>{
        video.srcObject = stream;
    });
};
let left_cnt=0
let right_cnt=0
let noFace_cnt=0
let negScore=0

function drawPoint(y, x, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
  }
  function drawKeypoints(keypoints) {
    const keypointsArray = keypoints;
    for (let i = 0; i < keypointsArray.length; i++) {
      const y = keypointsArray[i][0];
      const x = keypointsArray[i][1];
      drawPoint(x - 2, y - 2, 3);
    }
    const fingers = Object.keys(fingerLookupIndices);
    for (let i = 0; i < fingers.length; i++) {
      const finger = fingers[i];
      const points = fingerLookupIndices[finger].map(idx => keypoints[idx]);
      drawPath(points, false);
    }
  }
  function drawPath(points, closePath) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    }
  
    if (closePath) {
      region.closePath();
    }
    ctx.stroke(region);
  }

const detectFaces = async () => {
    document.getElementById("score").innerHTML ="<b>Your NegScore is "+negScore+"</b>";
    const [prediction,predictions] = await Promise.all([model.estimateFaces(video, false),model1.estimateHands(video)])
    ctx.drawImage(video, 0, 0,  600, 400);
    if (predictions.length > 0) {
        const result = predictions[0].landmarks;
        drawKeypoints(result, predictions[0].annotations);
        for(let i=0;i<5;i++){                                  //y값 위치로 손모양 판별
           for(let j=0;j<3;j++){
             if(result[(i*4)+j+2][1]>result[(i*4)+j+1][1]){
               flag=0;
             }
          }
        }
         for(let i=0;i<4;i++){                               //왼손만 인식
           for(let j=0;j<4;j++){
             if(result[(i+1)*4+j+1][0]<result[i*4+j+1][0]){
               flag=0;
             }
           }
         }
        if(flag==1){
          console.log("It is hand")
        }
        else flag=1;
      }
    if(left_cnt>10||right_cnt>10||noFace_cnt>10){
        negScore++
        left_cnt=0;
        right_cnt=0;
        noFace_cnt=0;
    }
    if(prediction.length>1){
        console.log("2 or more faces detected")
        return
    }
    else if(prediction==0){
        console.log("No Faces detected")
        noFace_cnt+=1
        return
    }
    else noFace_cnt=0;
    prediction.forEach((pred) => {
        ctx.beginPath();
        ctx.lineWidth = "4";
        ctx.strokeStyle = "blue";
        ctx.rect(
            pred.topLeft[0],
            pred.topLeft[1],
            pred.bottomRight[0]-pred.topLeft[0],
            pred.bottomRight[1]-pred.topLeft[1]
        );
        ctx.stroke();
        ctx.fillStyle ="red";
        for(let i=0;i<4;i++){
            ctx.fillRect(pred.landmarks[i][0],pred.landmarks[i][1],5,5);
        }
        let eye=[[pred.landmarks[0][0],pred.landmarks[0][1]],[pred.landmarks[1][0],pred.landmarks[1][1]]];
        let center_eyes=[(pred.landmarks[0][0]+pred.landmarks[1][0])/2,(pred.landmarks[0][1]+pred.landmarks[1][1])/2]
        ctx.fillRect(center_eyes[0],center_eyes[1],5,5);
        if(pred.landmarks[2][0]<(eye[0][0]+center_eyes[0])/2){
            console.log("Left")
            left_cnt+=1
        }
        else if(pred.landmarks[2][0]>(eye[1][0]+center_eyes[0])/2){
            console.log("Right")
            right_cnt+=1
        }
        else{
            console.log("Center")
            left_cnt=0
            right_cnt=0
        }
        ctx.fillRect((eye[0][0]+center_eyes[0])/2,(eye[0][1]+center_eyes[1])/2,5,5);
        ctx.fillRect((eye[1][0]+center_eyes[0])/2,(eye[1][1]+center_eyes[1])/2,5,5);
    });

};

setUpCamera();
video.addEventListener("loadeddata", async () =>{
    model = await blazeface.load();
    model1 = await handpose.load();
    setInterval(detectFaces,100);
});
