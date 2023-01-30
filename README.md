# 감독을 부탁해
졸업 프로젝트 감독을 부탁해 팀의 레포지토리입니다.

## 팀원
- [김준서](https://github.com/adoo24)
- [김준모](https://github.com/a00700c)
- [김태현](https://github.com/bradbrad97)

## 프로젝트 설명
- 프로젝트 목적 : 비대면 시험에서의 부정 행위를 방지하기 위하여 실시간 캠 화면 공유가 가능하고, AI를 이용하여 시험 도중 부정 행위를 감지할 수 있는 사이트의 개발
- 사용한 언어 : JavaScript
- 사용한 기술 : Node.js, Express, socket.io, webRTC, tensorflow.js, MySQL, AWS EC2, AWS RDS, https
- 프로젝트 진행 기간 : 2022년 3월 ~ 2022년 11월
- 사이트 메인 페이지 : https://bemysupervisor.com

# Project View And Description

- 메인 페이지

![메인 페이지](https://user-images.githubusercontent.com/96877973/215488642-9cf898f5-a272-4dfd-b6fc-51e801bc9000.png)


- 회원 가입 페이지

회원 가입 시 아이디, 이름, 비밀번호, 학과, 학생/교수 의 정보를 입력한다. 학생일 경우 사진 등록 절차를 추가로 거치게 된다.

![회원가입 1](https://user-images.githubusercontent.com/96877973/215488653-b7d4aa8d-4f2d-4a38-a985-206051711c2f.png)


- 회원 가입 시 사진 등록

학생의 경우 회원 가입 시 2장의 사진을 등록한다. 해당 과정에서 AI를 통해 2장의 사진이 동일 인물의 사진인지, 얼굴이 제대로 나왔는지 체크한다.

![회원가입 2](https://user-images.githubusercontent.com/96877973/215488658-0f26d19f-6b9c-485a-b7c4-4ffa2095f46b.PNG)


- 로그인 후 방 목록 페이지로 이동

해당 페이지에서는 감독 권한을 가진 사람은 방을 만들 수 있고, 학생은 생성된 방 목록에서 참가를 할 수 있다.

![룸 메인 페이지](https://user-images.githubusercontent.com/96877973/215488640-6b3d2f7e-9fe4-44b9-bea0-bd2ba57bb751.png)


- 룸 내 페이지

룸 내에서는 감독과 학생들이 접속해 있으며, 감독은 학생의 캠 화면을 감시할 수 있다. 또한 감독이 test start 버튼을 누르게 되면 학생의 브라우저에서 AI가 부정행위를 감지하기 시작한다. 부정 행위가 감지되면 해당 순간의 영상이 서버에 저장된다.

또한 학생은 캡처 버튼을 눌러 현재 본인의 캠 화면과 회원 가입시 등록한 사진을 비교하여 본인 인증을 한다.

감독은 현재 방 내 접속해 있는 학생의 리스트 및 본인 인증 상태를 확인할 수 있으며, 학생들의 부정 점수(부정 행위가 감지될 시 증가함)를 볼 수 있으며, 학생들의 캠 순서는 부정행위의 내림차순으로 정렬된다.

또한 방에 접속한 유저간 채팅도 가능하다.

<img width="960" alt="룸 내 페이지" src="https://user-images.githubusercontent.com/96877973/215488623-f0069445-4c48-409c-9cab-830d3eb700cd.png">


- 시험 목록 페이지

교수 권한의 계정은 본인이 실시하였던 시험의 목록과 시간을 볼 수 있으며, 해당 시험에서의 부정 행위를 열람할 수 있다.

<img width="960" alt="시험 목록 페이지" src="https://user-images.githubusercontent.com/96877973/215488644-70e06c00-8f78-424f-a7d3-30db1f2554ff.png">



- 룸 내 정보 페이지

교수는 자신이 실시한 시험을 클릭하게 되면 해당 룸 내에서의 학생들의 부정점수를 차트로 열람 할 수 있다. 학생을 클릭하게 된다면, 해당 학생의 시험 내 부정 행위를 시간으로 나타내며, 영상으로 열람할 수 있다. 

<img width="960" alt="차트 페이지" src="https://user-images.githubusercontent.com/96877973/215488651-39dcfdde-7d14-440c-98f1-f19c235e5c2a.png">


<img width="960" alt="차트 페이지 2" src="https://user-images.githubusercontent.com/96877973/215488647-bcaa5bad-b20b-4f40-aee4-f9194f5f00a7.png">



- 부정 행위 동영상 열람

해당 시험에서 AI가 감지한 학생의 부정 행위가 의심되는 순간을 3초의 증거영상으로 열람할 수 있다. (해당 사진은 얼굴이 2명 이상 감지된 경우이다. 부정 행위 의심은 얼굴이 상 하 좌 우로 일정 시간 이상 움직이거나, 얼굴이 감지되지 않거나, 얼굴이 2개 이상 감지되는 경우이다.)

<img width="960" alt="동영상" src="https://user-images.githubusercontent.com/96877973/215488614-af2251bd-6f7b-417c-b07c-abe35ca8a464.png">
