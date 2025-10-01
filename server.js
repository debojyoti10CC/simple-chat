const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DEFAULT_ROOM = 'mainroom';
let rooms = {}; // { roomName: [ { sender, text, time } ] }
let usernames = {}; // socket.id -> nickname

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('connected:', socket.id);
  socket.join(DEFAULT_ROOM);

  // Send old messages to new user
  if (!rooms[DEFAULT_ROOM]) rooms[DEFAULT_ROOM] = [];
  rooms[DEFAULT_ROOM].forEach(msg => socket.emit('message', msg));

  socket.on('setName', name => {
    usernames[socket.id] = name || 'Anonymous';
    io.to(DEFAULT_ROOM).emit('system', `${usernames[socket.id]} joined the chat`);
  });

  socket.on('message', ({ text }) => {
    const sender = usernames[socket.id] || 'Anonymous';
    const msg = { sender, text, time: new Date().toLocaleTimeString() };
    rooms[DEFAULT_ROOM].push(msg);
    io.to(DEFAULT_ROOM).emit('message', msg);
  });

  socket.on('typing', () => {
    const sender = usernames[socket.id] || 'Anonymous';
    socket.to(DEFAULT_ROOM).emit('typing', `${sender} is typing...`);
  });

  socket.on('disconnect', () => {
    const sender = usernames[socket.id] || 'Anonymous';
    io.to(DEFAULT_ROOM).emit('system', `${sender} left the chat`);
    delete usernames[socket.id];
    console.log('disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`listening on ${PORT}`));
