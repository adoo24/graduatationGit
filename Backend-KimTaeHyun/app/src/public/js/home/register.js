"use strict";

const id  = document.querySelector("#id"),
    name = document.querySelector("#name"),
    psword = document.querySelector("#psword"),
    confirmPsword = document.querySelector("#confirm-psword"),
    dept = document.querySelector("#dept"),
    registerBtn = document.querySelector("#button");

registerBtn.addEventListener("click", register);

function register() {
    if(!id.value) return alert("학번을 입력해 주십시오.");
    if(!name.value) return alert("이름을 입력해 주십시오.");
    if (psword.value !== confirmPsword.value){
        return alert("비밀번호가 일치하지 않습니다.");
    }
    if (!dept.value) return alert("학과를 입력해 주십시오.");
    const req = {
        id: id.value,
        name: name.value,
        psword: psword.value,
        dept : dept.value,
    };
    localStorage.setItem('items',JSON.stringify(req));
    console.log(req);
    location.href = "/face-register";
    // console.log(JSON.stringify(req));
    // fetch("/register", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(req), //단순히 문자열로 바꾸는 메소드
    // }).then((res) => res.json())
    //     .then((res) => {
    //         if (res.success){
    //             location.href = "/face-register"
    //         } else{
    //             alert(res.msg);
    //         }
    //     })
    //     .catch((err) => {
    //         console.error(new Error("회원가입 중 에러 발생"));
    //     });
}

