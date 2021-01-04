const app = require('express')();
const pkg = require('./package.json');
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send({
    name: 'figma-chat',
    version: pkg.version,
  });
});

const createUser = (id = '', name = '', color = '', room = '') => ({
  id,
  name,
  color,
  room,
});

io.on('connection', (socket) => {
  if (!socket.user) {
    socket.user = createUser(socket.id);
  }

  async function sendOnline(room = '') {
    try {
      let userRoom = room;

      if (socket?.user?.room) {
        userRoom = socket.user.room;
      }

      if (userRoom) {
        const sockets = await io.of('/').in(userRoom).allSockets();
        const users = Array.from(sockets)
          .map((id) => io.of('/').sockets.get(id))
          .filter(Boolean)
          .map((s) => s.user);

        io.in(userRoom).emit('online', users);
      }
    } catch (e) {
      console.log(e);
    }
  }

  function joinLeave(currentSocket, type = 'JOIN') {
    currentSocket.broadcast
      .to(currentSocket.user.room)
      .emit('join leave message', {
        id: currentSocket.id,
        user: currentSocket.user,
        type,
      });
  }

  socket.on('chat message', ({ roomName, message }) => {
    if (roomName) {
      if (!socket.user.room) {
        socket.user.room = roomName;
        socket.join(roomName);
        sendOnline(roomName);
      }

      // send to all in room except sender
      socket.broadcast.to(roomName).emit('chat message', {
        id: socket.id,
        user: socket.user,
        message,
      });
    }
  });

  socket.on('set user', (userOptions) => {
    socket.user = {
      ...socket.user,
      ...userOptions,
    };

    sendOnline();
  });

  socket.on('reconnect', () => {
    sendOnline();

    socket.emit('user reconnected');
  });

  socket.on('join room', ({ room, settings }) => {
    socket.join(room);

    socket.user = {
      ...socket.user,
      ...settings,
      room,
    };

    joinLeave(socket);
    sendOnline(room);
  });

  socket.on('disconnect', () => {
    joinLeave(socket, 'LEAVE');
    socket.leave(socket.user.room);

    sendOnline(socket.user.room);
  });
});

http.listen(port, () => {
  console.log('figma-chat-server is running!');
});
