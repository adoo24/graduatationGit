"use strict";

const UserStorage = require("./UserStorage");

class User{
    constructor(userInfo, files = null) {
        this.body = userInfo;
        this.file = files;
    }

    async register() { //UserStorage의 save 호출하여 저장
        const info = this.body;
        const file = this.file;
        const upload = {
                    file1 : file[0],
                    file2 : file[1],
                };
        const response = await UserStorage.save(info, upload);
        console.log(response);
        return response;
    }

}

module.exports = User;