"use strict";

const id  = document.querySelector("#id"),
    psword = document.querySelector("#psword"),
    loginBtn = document.querySelector("#button");

loginBtn.addEventListener("click", login);

function login() {
    const req = {
        id: id.value,
        psword: psword.value,
    };
    if(!id.value) return alert("아이디를 입력해 주십시오.");
    if(!psword.value) return alert("비밀번호를 입력해 주십시오.")
    console.log(req);
    console.log(JSON.stringify(req));
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req), //단순히 문자열로 바꾸는 메소드
    }).then((res) => res.json())
        .then((res) => {
            if (res.success){
                location.href = "/rooms"
            } else{
                alert(res.msg);
            }
        })
        .catch((err) => {
            console.error(new Error("로그인 중 에러 발생"));
        });
}

