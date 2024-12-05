const express = require("express");
const app = express();
const path = require("path");

const { v4: uuidv4 } = require("uuid");

const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const waitingUsers = [];
io.on("connection", (socket) => {
  socket.on("join", () => {
    if (waitingUsers.length > 0) {
      let room = uuidv4();
      socket.join(room);
      let user2 = waitingUsers.pop();
      user2.join(room);
      io.to(room).emit("joinRoom", room);
      // console.log(room);
    } else {
      waitingUsers.push(socket);
    }
  });
  socket.on("sendMessage", (data) => {
    io.to(data.room).emit("message", { message: data.message, id: socket.id });
  });

  socket.on("signalingMessage", function (data) {
    socket.broadcast.to(data.room).emit("signalingMessage", data.message);
  });

  
  socket.on("startVideoCall", ({ room }) => {
    socket.broadcast.to(room).emit("incomingCall");
  });
  socket.on("acceptCall", ({ room }) => {
    socket.broadcast.to(room).emit("callAccepted");
  });

  socket.on("rejectCall", function ({ room }) {
    socket.broadcast.to(room).emit("callRejected");
  });

  socket.on("disconnect", function () {
    let index = waitingUsers.findIndex(
      (waitinguser) => waitinguser.id === socket.id
    );
    waitingUsers.splice(index, 1);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/chat", (req, res) => {
  res.render("chat");
})


server.listen(process.env.PORT || 3000);
