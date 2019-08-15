const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

const sockets = {};

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

const createUser = (name = '', color = '', room = '') => ({
  name: '',
  color: '',
  room: ''
});

io.on('connection', socket => {
  let user = (sockets[socket.id] = createUser());

  socket.on('chat message', ({ roomName, message }) => {
    if (!user) {
      user = sockets[socket.id] = createUser();
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

  socket.on('connected', () => socket.emit('connected', user));
  socket.on('set username', name => (user.name = name));
  socket.on('reconnect', () => socket.emit('user reconnected'));

  socket.on('join room', room => {
    // console.log('join room', room);

    user.room = room;
    socket.join(room);
  });

  socket.on('disconnect', () => {
    delete sockets[socket.id];
  });
});

http.listen(port, () => {
  console.log('figma-chat-server is running!');
});
