const socket = io().connect("/");

let myLat;
let myLong;

//updating location
if (!navigator.geolocation) {
  alert("Geolocation is Not Supported");
} else {
  navigator.geolocation.getCurrentPosition((position) => {
    myLat = position.coords.latitude;
    myLong = position.coords.longitude;
    console.log(myLat);
    console.log(myLong);
    socket.emit("myLoc", {
      myLat: myLat,
      myLong: myLong,
    });
  });
}

//UI elements
const msgForm = document.querySelector("#sendMessageForm");
const message = document.querySelector("input");
const smButton = document.querySelector("button");
const locatButton = document.querySelector("#sendLocat");
const messages = document.querySelector("#messages");
const sidebar = document.querySelector("#sidebar");
const tempInfo = document.querySelector("#tempinfo");
const camButton = document.querySelector("#cameraButton");
const muteButton = document.querySelector("#muteButton");
const videoGrid = document.getElementById("video-grid");

//templates
const messageTemp = document.querySelector("#message-template").innerHTML;
const locTemp = document.querySelector("#loc-template").innerHTML;
const sidebarTemp = document.querySelector("#sidebar-template").innerHTML;
const sidebarWeth = document.querySelector("#sidebar-weather").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;
var peer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443});
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      console.log("call");
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });
    socket.on("vid-join", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

peer.on("open",(id)=>{
  console.log(id);
  socket.emit("join-vid",id);
})

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

camButton.addEventListener("click",()=>{
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
})

muteButton.addEventListener("click",()=>{
  const enabled=myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
})

locatButton.addEventListener("click", () => {
  locatButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is Not Supported");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    //const data=JSON.parse(position);
    //const loc=data.coords;
    console.log(position.coords.latitude, position.coords.longitude);

    //sending location
    socket.emit(
      "Location",
      {
        Latitude: position.coords.latitude,
        Longitude: position.coords.longitude,
      },
      () => {
        locatButton.removeAttribute("disabled");
        console.log("Location Shared");
      }
    );
  });
});

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  smButton.setAttribute("disabled", "disabled");
  const text = message.value;

  //sending message
  socket.emit("recieved", text, (error) => {
    smButton.removeAttribute("disabled");
    message.value = "";
    message.focus();
    if (error) {
      return console.log(error);
    }
    console.log("delivered");
  });
});

//for autoScrolling
const autoScroll = () => {
  const newMessage = messages.lastElementChild;

  const newMessageStyle = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight;
  const msgsContainerHeight = messages.scrollHeight;

  const scrollOffset = messages.scrollTop + visibleHeight;

  if (msgsContainerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

//recieving message
socket.on("sent", (data) => {
  console.log(data);
  const html = Mustache.render(messageTemp, {
    message: data.text,
    username: data.username,
    createdAt: moment(data.createdAt).format("LT"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

// socket.on('message',(msg)=>{
//     console.log(msg)
// })

//recieving location
socket.on("recievedLoc", (locData) => {
  console.log(locData);
  const html = Mustache.render(locTemp, {
    url: locData.url,
    createdAt: moment(locData.createdAt).format("LT"),
    username: locData.username,
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

//when a user enters update the userList
socket.on("roomData", ({ room, users }) => {
  // const temperature;
  // weath(temperature);
  // console.log(temperature);
  // const t=30;

  //connectToNewUser(userId, stream);
  const html = Mustache.render(sidebarTemp, {
    room,
    users,
  });
  sidebar.innerHTML = html;
});

socket.on("temperature", ({ temp }) => {
  console.log(temp);
  const t = temp;
  const html = Mustache.render(sidebarWeth, {
    t,
  });
  tempInfo.innerHTML = html;
});

//for sending username and roomname
socket.emit("Join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
