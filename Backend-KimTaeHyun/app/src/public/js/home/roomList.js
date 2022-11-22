const URLSearch = new URLSearchParams(location.search);
let myId;
let myName;

function searchParam(key) {
    return new URLSearchParams(location.search).get(key);
};

window.onload = function () {
    myId = searchParam('id');
    myName = searchParam('name');
    document.getElementById('topName').innerText = myName;
};

function showRoomList(data){
    const roomList=document.getElementById("ListRoom")
    roomList.innerHTML="";
    if(data.length === 0){
        return;
    }
    for (let i = 0; i < data.length; ++i){
        const tr = document.createElement("tr");
        const th1 = document.createElement("th");
        const th2 = document.createElement("th");
        const th3 = document.createElement("th");
        db=data[i]
        th1.innerText=db['id']
        th2.innerText = db['date']
        th3.innerText = db['room']
        tr.append(th1)
        tr.append(th2)
        tr.append(th3)
        roomList.append(tr);
    }
    for (let i =0;i<data.length;i++){
        const th2 = roomList.childNodes[i];
        th2.onclick = function(event){
            roomName = data[i]['id']
            // socket.emit("join_room",`${rooms[i]}`);
            //클릭시 그 방의 정보들 가진 chart로 이동
        }
        th2.style="cursor:pointer;"
    }
}