"use strict";

const UserStorage = require("./UserStorage");

class User{
    constructor(body,file = undefined) {
        this.body = body;
        this.file = file;
    }

    async login(){
        const client= this.body;
        const {id,psword} = await UserStorage.getUserInfo(client.id);
        if(id){
            if (id === client.id && psword === client.psword){
                return { success: true};
            }
            return {success: false, msg: "비밀번호가 틀렸습니다."};
        }
        return {success: false, msg: "존재하지 않는 학번입니다."};
    }

    async register() {
        const client = this.body;
        const file = this.file;
        const response = await UserStorage.save(client);
        return response;
    }

    upload() {

    }


}

module.exports = User;