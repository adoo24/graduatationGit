"use strict";

const image = document.getElementById("face-image");
const registerBtn = document.querySelector("#button");
registerBtn.addEventListener("click", faceRegister);
const item = localStorage.getItem('items');//?JSON.parse(localStorage.getItem('items')): [];
console.log(item);
localStorage.clear();
var imageArr;

const formdata = new FormData();

image.onchange = () =>{
    const selectedImage = [...image.files];
    imageArr = selectedImage;
    const fileReader1= new FileReader();
    const fileReader2= new FileReader();
    if (selectedImage.length !== 2){
        alert("사진을 2개 업로드해주세요.");
    }
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

function faceRegister() {
    //to do if 사진 invalid or 인식실패 => 다른 사진
    if (imageArr.length !== 2){
        alert("사진을 2개 업로드 후 회원가입 해주세요");
    }
    var file = document.getElementById('face-image').files[0];
    formdata.append('images', file);
    file = document.getElementById('face-image').files[1];
    formdata.append('images', file);

    fetch("/face-register",{
        method :"POST",
        body: formdata,
    }).then((res) => res.json())
        .then((res) => {
            if (res.success){
                location.href = "/"
            } else{
                alert(res.msg);
            }
        })
        .catch((err) => {
            console.error(new Error("사진등록 중 에러 발생"));
        });
}