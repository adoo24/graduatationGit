"use strict";

const image = document.getElementById("face-image");
const registerBtn = document.querySelector("#button");
registerBtn.addEventListener("click", faceRegister);
const item = localStorage.getItem('items');//?JSON.parse(localStorage.getItem('items')): [];
console.log(item);
localStorage.clear();
var imageArr;

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('js/home/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('js/home/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('js/home/models'),
])
    .then(start)

async function start() {
    const labeledFaceDescriptors = await loadLabeledImages()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5)
    image.onchange = async () =>{
        const selectedImage = [...image.files];
        imageArr = selectedImage;
        const fileReader1= new FileReader();
        const fileReader2= new FileReader();
        if (selectedImage.length !== 2){
            alert("사진을 2개 업로드해주세요.");
        }
        let imgs = selectedImage[0];
        imgs = await faceapi.bufferToImage(selectedImage[0])
        let detections = await faceapi.detectAllFaces(imgs).withFaceLandmarks().withFaceDescriptors()
        let detect1 = detections.length
        imgs = selectedImage[1];
        imgs = await faceapi.bufferToImage(selectedImage[1])
        detections = await faceapi.detectAllFaces(imgs).withFaceLandmarks().withFaceDescriptors()
        let detect2 = detections.length
        if (detect2==0 || detect1==0){
            console.log("No Human")
        }
        else
            console.log("Human")
        fileReader1.readAsDataURL(selectedImage[0]);
        fileReader1.onload = () => {
            document.getElementById("previewImg1").src
                = fileReader1.result;
        }
        fileReader2.readAsDataURL(selectedImage[1]);
        fileReader2.onload = () => {
            document.getElementById("previewImg2").src
                = fileReader2.result;
        }
    }
}

function loadLabeledImages() {
    const labels = ["Junseo"]
    return Promise.all(
        labels.map(async label => {
            const descriptions = []
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/adoo24/graduatationGit/main/%EA%B9%80%EC%A4%80%EC%84%9C/${i}.png`)
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }

            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

const formdata = new FormData();
// formdata.append('key', new Blob([JSON.stringify(item)] , {type: "application/json"}));
//
// image.onchange = () =>{
//     const selectedImage = [...image.files];
//     imageArr = selectedImage;
//     const fileReader1= new FileReader();
//     const fileReader2= new FileReader();
//     if (selectedImage.length !== 2){
//         alert("사진을 2개 업로드해주세요.");
//     }
//     fileReader1.readAsDataURL(selectedImage[0]);
//     fileReader1.onload = () => {
//         document.getElementById("previewImg1").src
//         = fileReader1.result;
//     }
//     fileReader2.readAsDataURL(selectedImage[1]);
//     fileReader2.onload = () => {
//         document.getElementById("previewImg2").src
//             = fileReader2.result;
//     }
// }

function faceRegister() {
    //to do if 사진 invalid or 인식실패 => 다른 사진
    if (imageArr.length !== 2){
        alert("사진을 2개 업로드 후 회원가입 해주세요");
    }
    var file = document.getElementById('face-image').files[0];
    formdata.append('images', file);
    file = document.getElementById('face-image').files[1];
    formdata.append('images', file);
    console.log(formdata);

    fetch("/face-register",{
        method :"POST",
        body: formdata,
    }).then((res) => res.json())
        .then((res) => {
            console.log("faceRegister response 체크");
            console.log(res);
            if (res.success){
                console.log("faceRegister success")
                alert("회원가입에 성공했습니다.")
                location.href = "/login"
            } else{
                alert("이미 가입된 회원입니다.");
            }
        })
        .catch((err) => {
            console.error(new Error("사진등록 중 에러 발생"));
        });
}