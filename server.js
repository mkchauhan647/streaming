// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const next = require('next');
// const bodyParser = require('body-parser');

// const dev = process.env.NODE_ENV !== 'production';
// // const nextApp = next({ dev });
// // in production mode
// const nextApp = next({ dev: false });
// const handle = nextApp.getRequestHandler();

// let isStreaming = false; // Track streaming status

// nextApp.prepare().then(() => {
//   const app = express();
//   const server = http.createServer(app);
//   const io = socketIo(server);
  
//   app.use(express.static('public'));

//   // / Middleware to parse JSON bodies
//   app.use(bodyParser.json());

//   app.post('/auth', (req, res) => {


//     // console.log(req.body);
//     console.log("auth", req.query);
//     console.log("auth", req.url);
//     console.log("auth", req.body);
//     const pass = req.body.pass;

//     if(pass=='password'){
//       res.json({ auth: true })
//     }
//     else {
//       res.status(403).json({ auth: false });
//     }




//     //  nextApp.render(req, res, '/admin');
//   });

//   let admin = {
//     socket: null,
//     offer: null,
//     iceCandidates: [],
//   }

//   io.on('connection', (socket) => {
//     console.log('New client connected:', socket.id);

//     // Notify new users about the current streaming status
//     socket.emit('stream-status', isStreaming);

//     // Notify existing users about the new user

//     socket.on('registerAdmin', () => {
//       console.log('Admin registered:', socket.id);
//       admin.socket = socket;
//     });
    
//     socket.broadcast.emit('newPeer', socket.id);
//     // Handle offer from a user
//     socket.on('offer', (data) => {
//       console.log('Received offer from:', data);

//       if (admin.socket) {
//         if (admin.socket.id == socket.id) {

//           admin.offer = data;
         
//        }
//     }

//       socket.to(data.userId).emit('offer', { ...data,userId:socket.id });
//     });

//     // Handle answer from a user
//     socket.on('answer', (data) => {
//       console.log('Received answer from:', socket.id);
//       console.log('Received answer from:', data);
//       socket.to(data.userId).emit('answer', { ...data,userId:socket.id });
//     });

//     // Handle ICE candidates from a user
//     socket.on('ice-candidate', (data) => {
//       console.log('Received ICE candidate from:', data);
//       console.log('Received ICE candidate from:', socket.id);
//       if (admin.socket) {
//         if (admin.socket.id == socket.id) {
//           admin.iceCandidates.push(data);
//         }
//       }
//       socket.to(data.userId).emit('ice-candidate', { ...data,userId:socket.id });
//       // socket.broadcast.emit('ice-candidate', data);
//     });

//     // Start streaming and notify all users
//     socket.on('start-stream', () => {
//       isStreaming = true;
//       io.emit('stream-status', isStreaming); // Notify all clients that streaming has started
//     });

//     // Stop streaming and notify all users
//     socket.on('stop-stream', () => {
//       isStreaming = false;
//       io.emit('stream-status', isStreaming); // Notify all clients that streaming has stopped
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//       console.log('Client disconnected:', socket.id);
//       // Notify other clients about the disconnection
//       // if (typeof admin.socket.id == 'undefined') return;
//       if (admin.socket) {
//         if (admin.socket.id == socket.id) {
//           admin.socket = null;
//           admin.offer = null;
//           admin.iceCandidates = [];
//           socket.broadcast.emit('admin-disconnected');
//         }
        
//       }
//      else {
        
//         socket.broadcast.emit('user-disconnected', socket.id);
//       }
//     });
//   });

//   // API endpoint to check streaming status
//   app.get('/stream-status', (req, res) => {
//     res.json(isStreaming);
//   });

//   // Handle Next.js requests
//   app.all('*', (req, res) => handle(req, res));

//   // Start server
//   server.listen(3000, (err) => {
//     if (err) throw err;
//     console.log('> Ready on http://localhost:3001');
//   });
// });


// const express = require('express');
// const { createServer } = require('http');
// const next = require('next');
// const { Server } = require("socket.io");

// const port = parseInt(process.env.PORT, 10) || 3000;
// const dev = process.env.NODE_ENV !== 'production';
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   const server = express();
//   const httpServer = createServer(server);
//   const io = new Server(httpServer);

//   io.on('connection', socket => {
//     console.log('a user connected:', socket.id);

//     // Handling signaling data for WebRTC
//     socket.on('offer', (offer, room) => {
//       socket.to(room).emit('offer', offer, room);
//     });

//     socket.on('answer', (answer, room) => {
//       socket.to(room).emit('answer', answer);
//     });

//     socket.on('candidate', (candidate, room) => {
//       socket.to(room).emit('candidate', candidate);
//     });

//     socket.on('join', (room) => {
//       socket.join(room);
//       console.log(`User ${socket.id} joined room ${room}`);
//     });
//   });

//   server.all('*', (req, res) => {
//     return handle(req, res);
//   });

//   httpServer.listen(port, () => {
//     console.log(`> Ready on http://localhost:${port}`);
//   });
// });

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const io = new Server(httpServer);

  // Store active offers by room
  const activeOffers = {};

  io.on('connection', socket => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join', room => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
      // Send the current offer to the newly joined client if it exists
      if (activeOffers[room]) {
        console.log('Sending offer to new user:', activeOffers[room]);
        const data = {offer: activeOffers[room], room:room};
        socket.emit('offer', data );
      }
    });

    socket.on('offer', (offer, room) => {
      console.log('Offer received and storing/broadcasting to room:', room,offer);
      // Store the offer for new joiners
      activeOffers[room] = offer;
      // Broadcast the offer to all others in the room
      socket.to(room).emit('offer', offer);
      // socket.broadcast.emit('offer', offer, room);
    });

    socket.on('answer', (answer, room) => {
      console.log('Answer received and broadcasting to room:', room,answer);
      socket.broadcast.emit('answer', answer);
      // socket.to(room).emit('answer', answer);
    });

    socket.on('candidate', (candidate, room) => {
      console.log('Candidate received and broadcasting to room:', room);
      // socket.to(room).emit('candidate', candidate);
      socket.broadcast.emit('candidate', candidate);
    });

    socket.on('disconnect', () => {
      // Optional: Cleanup if the disconnecting user is the admin
      console.log(`User disconnected: ${socket.id}`);
      // Logic to determine and remove room offer could be added here
    });
  });

  server.all('*', (req, res) => handle(req, res));

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
