"use strict";

const UserStorage = require("./UserStorage");

class User{
    constructor(req) {
        this.body = req.body;
        this.session = req.session;
        this.file = req.file;
    }

    async login(){
        const client= this.body; //body에 유저 정보들
        const session = this.session //session에 session정보들
        var idd;
        var pswordd;
        try { //아이디가 db에 있다면 id,psword를 db에서 받아옴
            const {id,psword} = await UserStorage.getUserInfo(client.id);
            idd = id;
            pswordd = psword;
        } catch(error) { //아이디가 db에 없을 때
            console.log("에러1")
            return {success: false, msg: "아이디 혹은 비밀번호가 틀렸습니다."};
        }
        if (session.user) { //login이 호출되는 시점에 session이 살아있다면 이 메세지가 나가는지 테스트
            console.log('이미 로그인되어 미팅룸 페이지로 이동');
            return {success: true};
        }
        else if(idd){ //id는 맞는데 비번이 틀린경우
            if (idd === client.id && pswordd === client.psword){
                return { success: true};
            }
            return {success: false, msg: "아이디 혹은 비밀번호가 틀렸습니다."};
            console.log("에러2");
        }

    }

    async register() {
        const client = this.body;
        const response = await UserStorage.save(client);
        return response;
    }

}

module.exports = User;