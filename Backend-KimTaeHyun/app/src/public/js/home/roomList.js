const URLSearch = new URLSearchParams(location.search);
let myId;
let myName;

function searchParam(key) {
    return new URLSearchParams(location.search).get(key);
};

window.onload = function () {
    myId = sessionStorage.id;
    myName = sessionStorage.name;
    document.getElementById('topName').innerText = myName;

    const req = {
        pid : myId,
    };

    fetch("/roomList", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(req), //단순히 문자열로 바꾸는 메소드
    }).then((res) => res.json())
        .then((res) => {
            if (res.success){
                showRoomList(res['rooms'],res['times']);
            } else{
                console.log("fail");
                alert("fail");
            }
        })
        .catch((err) => {
            console.log(err);
        });
};

function showRoomList(rooms, times){
    const roomList=document.getElementById("ListRoom")
    roomList.innerHTML="";
    if(rooms.length === 0){
       return;
    }
    for (let i = 0; i < rooms.length; ++i){
        const tr = document.createElement("tr");
        const th1 = document.createElement("th");
        const th2 = document.createElement("th");
        var room = rooms[i];
        var time = times[i];
        th1.innerText= room;
        th2.innerText = time;
        tr.append(th1);
        tr.append(th2);
        roomList.append(tr);
    }
    for (let i =0;i<rooms.length;i++){
        const th2 = roomList.childNodes[i];
        th2.onclick = function(event){
            roomName = rooms[i];
            console.log(roomName)
            location.href=`/charts?roomName=${roomName}`;
        }
        th2.style="cursor:pointer;"
    }
}