const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;
const rooms = {};

app.use(express.static('public'));

io.on('connection', socket => {
  console.log('Player connected: '+socket.id);

  socket.on('joinRoom', roomName => {
    if(!rooms[roomName]) rooms[roomName] = { players: {} };
    rooms[roomName].players[socket.id] = {x:0,y:0,weapon:'sword',stickman:'blue',hat:null};
    socket.join(roomName);
    socket.emit('roomData', rooms[roomName].players);
    socket.to(roomName).emit('playerJoined', {id:socket.id,data:rooms[roomName].players[socket.id]});
  });

  socket.on('updateState', data => {
    for(const roomName in rooms){
      if(rooms[roomName].players[socket.id]){
        rooms[roomName].players[socket.id] = data;
        socket.to(roomName).emit('stateUpdate',{id:socket.id,data});
      }
    }
  });

  socket.on('disconnect', () => {
    for(const roomName in rooms){
      if(rooms[roomName].players[socket.id]){
        delete rooms[roomName].players[socket.id];
        socket.to(roomName).emit('playerLeft', socket.id);
      }
    }
    console.log('Player disconnected: '+socket.id);
  });
});

server.listen(PORT, ()=>console.log('Server running on port '+PORT));
