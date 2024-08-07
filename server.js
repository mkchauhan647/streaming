const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const next = require('next');
const bodyParser = require('body-parser');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

let isStreaming = false; // Track streaming status

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);
  
  app.use(express.static('public'));

  // / Middleware to parse JSON bodies
  app.use(bodyParser.json());

  app.post('/auth', (req, res) => {


    // console.log(req.body);
    console.log("auth", req.query);
    console.log("auth", req.url);
    console.log("auth", req.body);
    const pass = req.body.pass;

    if(pass=='password'){
      res.json({ auth: true })
    }
    else {
      res.status(403).json({ auth: false });
    }




    //  nextApp.render(req, res, '/admin');
  });

  let admin = {
    socket: null,
    offer: null,
    iceCandidates: [],
  }

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Notify new users about the current streaming status
    socket.emit('stream-status', isStreaming);

    // Notify existing users about the new user

    socket.on('registerAdmin', () => {
      console.log('Admin registered:', socket.id);
      admin.socket = socket;
    });
    
    socket.broadcast.emit('newPeer', socket.id);
    // Handle offer from a user
    socket.on('offer', (data) => {
      console.log('Received offer from:', data);

      if (admin.socket) {
        if (admin.socket.id == socket.id) {

          admin.offer = data;
         
       }
    }

      socket.to(data.userId).emit('offer', { ...data,userId:socket.id });
    });

    // Handle answer from a user
    socket.on('answer', (data) => {
      console.log('Received answer from:', socket.id);
      console.log('Received answer from:', data);
      socket.to(data.userId).emit('answer', { ...data,userId:socket.id });
    });

    // Handle ICE candidates from a user
    socket.on('ice-candidate', (data) => {
      console.log('Received ICE candidate from:', data);
      console.log('Received ICE candidate from:', socket.id);
      if (admin.socket) {
        if (admin.socket.id == socket.id) {
          admin.iceCandidates.push(data);
        }
      }
      socket.to(data.userId).emit('ice-candidate', { ...data,userId:socket.id });
      // socket.broadcast.emit('ice-candidate', data);
    });

    // Start streaming and notify all users
    socket.on('start-stream', () => {
      isStreaming = true;
      io.emit('stream-status', isStreaming); // Notify all clients that streaming has started
    });

    // Stop streaming and notify all users
    socket.on('stop-stream', () => {
      isStreaming = false;
      io.emit('stream-status', isStreaming); // Notify all clients that streaming has stopped
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Notify other clients about the disconnection
      // if (typeof admin.socket.id == 'undefined') return;
      if (admin.socket) {
        if (admin.socket.id == socket.id) {
          admin.socket = null;
          admin.offer = null;
          admin.iceCandidates = [];
          socket.broadcast.emit('admin-disconnected');
        } 
        
      }
     else {
        
        socket.broadcast.emit('user-disconnected', socket.id);
      }
    });
  });

  // API endpoint to check streaming status
  app.get('/stream-status', (req, res) => {
    res.json(isStreaming);
  });

  // Handle Next.js requests
  app.all('*', (req, res) => handle(req, res));

  // Start server
  server.listen(3001, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3001');
  });
});
