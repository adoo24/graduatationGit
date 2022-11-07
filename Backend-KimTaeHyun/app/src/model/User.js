"use strict";

const UserStorage = require("./UserStorage");

class User{
    constructor(req) {
        this.body = req.body;
        this.session = req.session;
        this.file = req.file;
    }

    async checkUser() {
        const client = this.body;
        let response;
        try {
            response = await UserStorage.searchUser(client.id);
            console.log(client.id);
        } catch (error) {
            console.log("회원가입중복");
            return {success: false, msg: "이미 존재하는 회원입니다."}
        }
        return response;
    }

    async login(){
        const client= this.body; //body에 유저 정보들
        const session = this.session //session에 session정보들
        var uId;
        var uPsword;
        var uNickname;
        var uAuth;
        var uFace1;
        var uFace2;
        try { //아이디가 db에 있다면 id,psword를 db에서 받아옴
            const info = await UserStorage.getUser(client.id);
            const id = info.id;
            const psword = info.psword;
            const nickname = info.nickname;
            const auth = info.auth;
            const face1 = info.face1;
            const face2 = info.face2;
            uId = id;
            uPsword = psword;
            uNickname = nickname;
            uAuth = auth;
            uFace1 = face1;
            uFace2 = face2;
        } catch(error) { //아이디가 db에 없을 때
            console.log("에러1")
            return {success: false, msg: "아이디 혹은 비밀번호가 틀렸습니다."};
        }
        if (session.isLogined == true) { //login이 호출되는 시점에 session이 살아있다면 이 메세지가 나가는지 테스트
            console.log('이미 로그인되어 미팅룸 페이지로 이동');
            return {success: true, id: uId, nickname: uNickname, auth: uAuth, face1: uFace1, face2: uFace2 };
        }
        else if(uId){ //id는 맞는데 비번이 틀린경우
            if (uId === client.id && uPsword === client.psword){
                return {success: true, id: uId, nickname: uNickname, auth: uAuth, face1: uFace1, face2: uFace2 };
            }
            return {success: false, msg: "아이디 혹은 비밀번호가 틀렸습니다."};
            console.log("에러2");
        }
    }

    async register() {
        const client = this.body;
        console.log(client);
        let response;
        try{
            response = await UserStorage.save(client);
        } catch(error) {
            console.log("로그인중복");
            return {success: false, msg: "이미 존재하는 회원입니다."}
        }
        return response;
    }
}

module.exports = User;