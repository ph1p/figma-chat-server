const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

const sockets = {};

app.get('/', (req, res) => {
  res.send({
    name: 'figma-chat',
    version: '1.0.0'
  });
});

const createUser = (id = '', name = '', color = '', room = '') => ({
  id,
  name,
  color,
  room
});

io.on('connection', socket => {
  let user = (sockets[socket.id] = createUser(socket.id));

  function sendOnline(room = '') {
    try {
      let userRoom = room;

      if (!userRoom && sockets[socket.id]) {
        userRoom = sockets[socket.id].room;
      }

      io.in(userRoom).clients((err, clients) => {
        const users = clients.map(id => ({
          ...sockets[id]
        }));
        io.in(userRoom).emit('online', users);
      });
    } catch (e) { }
  }

  function joinLeave(socket, room, type = 'JOIN') {
    socket.broadcast.to(room).emit('join leave message', {
      id: socket.id,
      user: sockets[socket.id],
      type
    });
  }

  socket.on('chat message', ({ roomName, message }) => {
    if (!user) {
      user = sockets[socket.id] = createUser(socket.id);
    }

    if (roomName) {
      if (!user.room) {
        sockets[socket.id].room = roomName;
        socket.join(roomName);
        sendOnline(roomName);
      }

      // send to all in room except sender
      socket.broadcast.to(roomName).emit('chat message', {
        id: socket.id,
        user: sockets[socket.id],
        message
      });
    }
  });

  setTimeout(() => socket.emit('connected', user), 100);

  socket.on('set user', user => {
    sockets[socket.id] = {
      ...sockets[socket.id],
      ...user
    };

    sendOnline();
  });

  socket.on('reconnect', () => {
    sendOnline();

    socket.emit('user reconnected');
  });

  socket.on('join room', ({ room, settings }) => {
    socket.join(room, () => {
      sockets[socket.id] = {
        ...sockets[socket.id],
        ...settings,
        room
      };

      joinLeave(socket, room);
      sendOnline(room);
    });
  });

  socket.on('disconnect', () => {
    const room = sockets[socket.id].room;

    joinLeave(socket, room, 'LEAVE');

    delete sockets[socket.id];

    sendOnline(room);
  });
});

http.listen(port, () => {
  console.log('figma-chat-server is running!');
});
