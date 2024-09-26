document.addEventListener("DOMContentLoaded", () => {
  let wt = new WarpTalk("wss", "warp.cs.au.dk/talk/");
  let room;
  let currentUser = "";
  let isInRoom = false;
  let roomUsersMap = {};
  let usersInRoom = document.getElementById("clients");

  document.getElementById("login-button").addEventListener("click", () => {
    const nickname = document.getElementById("nickname").value;
    if (nickname) {
      currentUser = nickname;
      wt.connect(onConnected, nickname);
      displaySystemMessage(`Connected anonymously as ${nickname}`);
    } else {
      alert("Please enter a nickname for anonymous connection.");
    }
  });

  function onConnected() {
    displaySystemMessage(
      "Connection established. Please select a room to join."
    );
  }

  document.querySelectorAll(".room-item").forEach((item) => {
    item.addEventListener("click", function () {
      const roomName = this.querySelector("strong").textContent;
      leaveRoom();
      joinRoom(roomName);
    });
  });

  function joinRoom(roomName) {
    room = wt.join(roomName);
    isInRoom = true;
    displaySystemMessage(`You have joined ${roomName}.`);

    if (!roomUsersMap[roomName]) {
      roomUsersMap[roomName] = [];
    }

    updateDisplayedUserList(roomName);

    document.getElementById("leave-button").style.display = "inline-block";
    document.getElementById("message-list").classList.remove("collapsed");

    room.onMessage((room, msg) => {
      if (isInRoom) {
        displayMessage(msg.sender, msg.message);
      }
    });

    room.onJoin((room, nickname) => {
      if (isInRoom) {
        displaySystemMessage(`${nickname} has joined the room.`);
        updateUserList(roomName, nickname, true);
        updateDisplayedUserList(roomName);
      }
    });

    room.onLeave((room, nickname) => {
      if (isInRoom) {
        displaySystemMessage(`${nickname} has left the room.`);
        updateUserList(roomName, nickname, false);
        updateDisplayedUserList(roomName);
      }
    });
  }

  document.getElementById("leave-button").addEventListener("click", () => {
    leaveRoom();
  });

  function leaveRoom() {
    if (room) {
      isInRoom = false;

      room.onMessage = () => {};
      room.onJoin = () => {};
      room.onLeave = () => {};
      wt.leave(room.name);
      room = null;

      document.getElementById("message-list").innerHTML = "";
      document.getElementById("clients").innerHTML = "";
      document.getElementById("leave-button").style.display = "none";
    }
  }

  function updateUserList(roomName, name, online) {
    if (online) {
      if (!roomUsersMap[roomName].includes(name)) {
        roomUsersMap[roomName].push(name);
      }
    } else {
      roomUsersMap[roomName] = roomUsersMap[roomName].filter(
        (user) => user !== name
      );
    }
  }

  function updateDisplayedUserList(roomName) {
    usersInRoom.innerHTML = ""; // Clear current list
    roomUsersMap[roomName].forEach((user) => {
      const userElement = document.createElement("li");
      userElement.textContent = user;
      usersInRoom.appendChild(userElement);
    });
  }

  document.getElementById("send-button").addEventListener("click", () => {
    const message = document.getElementById("message-input").value;
    if (message && room) {
      room.send(message);
      document.getElementById("message-input").value = "";
    }
  });

  function displayMessage(sender, message) {
    const messageList = document.getElementById("message-list");
    const listItem = document.createElement("div");

    const currentTime = new Date().toLocaleTimeString();
    if (sender === currentUser) {
      listItem.classList.add("my-message");
      listItem.innerHTML = `<strong>[${currentTime}]</strong> ${message}`;
    } else {
      listItem.classList.add("message");
      listItem.innerHTML = `<strong>[${currentTime}] ${sender}:</strong> ${message}`;
    }

    messageList.appendChild(listItem);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function displaySystemMessage(message) {
    const messageList = document.getElementById("message-list");
    const listItem = document.createElement("div");
    listItem.classList.add("system-message");
    listItem.textContent = message;
    messageList.appendChild(listItem);
    messageList.scrollTop = messageList.scrollHeight;
  }
});
