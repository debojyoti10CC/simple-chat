const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve client files from /public
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('connected:', socket.id);

  socket.on('join', room => {
    socket.join(room);
    socket.to(room).emit('system', `${socket.id} joined`);
  });

  socket.on('message', ({room, text}) => {
    io.to(room).emit('message', { sender: socket.id, text });
  });

  socket.on('disconnect', () => console.log('disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`listening on ${PORT}`));
