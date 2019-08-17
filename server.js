const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

const sockets = {};
const rooms = {};

const colors = {
  blue: '#18A0FB',
  purple: '#7B61FF',
  hotPink: '#FF00FF',
  green: '#1BC47D',
  red: '#F24822',
  yellow: '#FFEB00'
};

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

      const usersInRoom = Object.keys(
        io
          .of('/')
          .in(userRoom)
          .clients().sockets
      );

      const users = usersInRoom.map(u => ({
        ...sockets[user.id]
      }));

      io.in(userRoom).emit('online', users);
    } catch (e) {
      console.log(e);
    }
  }

  socket.on('chat message', ({ roomName, message }) => {
    if (!user) {
      user = sockets[socket.id] = createUser(socket.id);
    }

    if (roomName) {
      if (!user.room) {
        user.room = roomName;
        socket.join(roomName);
      }

      // send to all in room except sender
      socket.broadcast.to(roomName).emit('chat message', {
        id: socket.id,
        user: sockets[socket.id],
        message
      });
    }
  });

  socket.emit('connected', user);
  sendOnline();

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

  socket.on('join room', room => {
    user.room = room;
    socket.join(room);

    sendOnline();
  });

  socket.on('disconnect', () => {
    const room = sockets[socket.id].room;
    delete sockets[socket.id];

    sendOnline(room);
  });
});

http.listen(port, () => {
  console.log('figma-chat-server is running!');
});
