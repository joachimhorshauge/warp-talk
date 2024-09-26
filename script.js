document.addEventListener("DOMContentLoaded", () => {
  const warpTalkServerUrl = "warp.cs.au.dk/talk/";
  const wt = new WarpTalk("wss", warpTalkServerUrl);
  let currentRoomName = null;
  let currentUser = "";
  let roomUsers = {};
  let availableRooms = [];
  let trackedRooms = {};

  const usersInRoomElement = document.getElementById("clients");
  const messageListElement = document.getElementById("message-list");
  const leaveButtonElement = document.getElementById("leave-button");
  const nicknameInput = document.getElementById("nickname");
  const passwordInput = document.getElementById("password");
  const messageInputElement = document.getElementById("message-input");

  setupEventListeners();

  function setupEventListeners() {
    document
      .getElementById("login-button")
      .addEventListener("click", handleLogin);
    document
      .getElementById("logout-button")
      .addEventListener("click", handleLogout);
    document
      .getElementById("send-button")
      .addEventListener("click", sendMessage);

    messageInputElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !messageInputElement.disabled) {
        event.preventDefault();
        sendMessage();
      }
    });

    leaveButtonElement.addEventListener("click", leaveCurrentRoom);
  }

  function handleLogin() {
    const nickname = nicknameInput.value;
    const password = passwordInput.value;

    if (!nickname) {
      alert("Please enter a nickname for anonymous connection.");
      return;
    }

    currentUser = nickname;

    wt.connect(onConnected, nickname, password);
    if (password) {
      displaySystemMessage(`Connected with registered account ${nickname}`);
    } else {
      displaySystemMessage(`Connected anonymously as ${nickname}`);
    }
  }

  function handleLogout() {
    wt.logout();
    currentUser = "";
    displaySystemMessage("Disconnected.");

    clearRoomUI();
    messageInputElement.disabled = true;
    document.getElementById("send-button").disabled = true;
  }

  function displayRoomList() {
    const roomListElement = document.getElementById("room-list");
    roomListElement.innerHTML = "";

    availableRooms.forEach((room) => {
      const roomItem = document.createElement("div");
      roomItem.classList.add("room-item");
      roomItem.innerHTML = `<strong>${room.name}</strong>: ${
        room.description || ""
      }`;
      roomItem.addEventListener("click", () => switchRoom(room.name));
      roomListElement.appendChild(roomItem);
    });
  }

  function onConnected() {
    displaySystemMessage("Connection established. Loading rooms...");

    wt.getRooms((rooms) => {
      availableRooms = rooms;
      if (availableRooms && availableRooms.length > 0) {
        displaySystemMessage("Rooms loaded. Please select a room to join.");
        displayRoomList();

        availableRooms.forEach((room) => {
          trackRoomUsers(room.name);
        });
      } else {
        displaySystemMessage("No rooms are available.");
      }
    });
  }

  function trackRoomUsers(roomName) {
    const room = wt.join(roomName);
    trackedRooms[roomName] = room;

    if (!roomUsers[roomName]) {
      roomUsers[roomName] = [];
    }

    room.onSelfJoin = () => {
      updateUserList(roomName, currentUser, true);
      if (currentRoomName === roomName) {
        updateDisplayedUserList(roomName);
      }
    };

    room.onJoin((room, nickname) => {
      updateUserList(roomName, nickname, true);
      if (currentRoomName === roomName) {
        updateDisplayedUserList(roomName);
      }
    });

    room.onLeave((room, nickname) => {
      updateUserList(roomName, nickname, false);
      if (currentRoomName === roomName) {
        updateDisplayedUserList(roomName);
      }
    });

    room.onMessage((room, msg) => {
      if (currentRoomName === roomName) {
        displayMessage(msg.sender, msg.message);
      }
    });
  }

  function switchRoom(roomName) {
    if (currentRoomName) {
      leaveCurrentRoom();
    }
    joinRoom(roomName);
  }

  function joinRoom(roomName) {
    currentRoomName = roomName;
    displaySystemMessage(`You have joined ${roomName}`);

    updateDisplayedUserList(roomName);
    showRoomUI();

    messageInputElement.disabled = false;
    document.getElementById("send-button").disabled = false;
  }

  function leaveCurrentRoom() {
    if (currentRoomName) {
      displaySystemMessage(`You have left ${currentRoomName}`);
      currentRoomName = null;
      clearRoomUI();

      messageInputElement.disabled = true;
      document.getElementById("send-button").disabled = true;
    }
  }

  function sendMessage() {
    const message = messageInputElement.value.trim();
    if (message && currentRoomName) {
      const room = trackedRooms[currentRoomName];
      room.send(message);
      messageInputElement.value = "";
      messageInputElement.focus();
    }
  }

  function displayMessage(sender, message) {
    const listItem = document.createElement("div");
    const currentTime = new Date().toLocaleTimeString();
    listItem.classList.add(sender === currentUser ? "my-message" : "message");
    listItem.innerHTML =
      sender === currentUser
        ? `<strong>[${currentTime}]</strong> ${message}`
        : `<strong>[${currentTime}] ${sender}:</strong> ${message}`;

    messageListElement.appendChild(listItem);
    messageListElement.scrollTop = messageListElement.scrollHeight;
  }

  function displaySystemMessage(message) {
    const systemMessageElement = document.createElement("div");
    systemMessageElement.classList.add("system-message");
    systemMessageElement.textContent = message;
    messageListElement.appendChild(systemMessageElement);
    messageListElement.scrollTop = messageListElement.scrollHeight;
  }

  function updateUserList(roomName, name, isOnline) {
    if (isOnline) {
      if (!roomUsers[roomName].includes(name)) {
        roomUsers[roomName].push(name);
      }
    } else {
      roomUsers[roomName] = roomUsers[roomName].filter((user) => user !== name);
    }
  }

  function updateDisplayedUserList(roomName) {
    usersInRoomElement.innerHTML = "";
    roomUsers[roomName].forEach((user) => {
      const userElement = document.createElement("li");
      userElement.textContent = user;
      usersInRoomElement.appendChild(userElement);
    });
  }

  function showRoomUI() {
    leaveButtonElement.style.display = "inline-block";
    messageListElement.classList.remove("collapsed");
    messageInputElement.disabled = false;
    document.getElementById("send-button").disabled = false;
  }

  function clearRoomUI() {
    messageListElement.innerHTML = "";
    usersInRoomElement.innerHTML = "";
    leaveButtonElement.style.display = "none";
    messageInputElement.disabled = true;
    document.getElementById("send-button").disabled = true;
  }
});
