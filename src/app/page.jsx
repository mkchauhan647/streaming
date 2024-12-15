'use client'

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const User = () => {
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);

  const handleStartStream = async () => {
    console.log("Start Stream");

    // const newPeer = new RTCPeerConnection();
    const configuration = { 
      iceServers: [{
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302','stun:stun4.l.google.com:19302'],
        
      }],
      iceCandidatePoolSize: 10,
      // Add TURN server here if available
    };
    const newPeer = new RTCPeerConnection(configuration);
    // const newSocket = io("https://ninth-bejewled-saver.glitch.me");
    // const newSocket = io('http://192.168.31.87:3001');
    // const newSocket = io('http://localhost:3000');
    const getUrl = window.location;

    // alert(getUrl);

    console.log("getUrl", getUrl);

    const newSocket = io(getUrl.origin)

    setPeer(newPeer);
    setSocket(newSocket);

    newSocket.on('offer', async (offer) => {
      console.log("offer", offer);
      await newPeer.setRemoteDescription(new RTCSessionDescription(offer.offer));
      const answer = await newPeer.createAnswer();
      await newPeer.setLocalDescription(answer);
      newSocket.emit("answer", { userId: offer.userId, answer: answer });

      newPeer.onicecandidate = (event) => {
        if (event.candidate) {
          newSocket.emit("ice-candidate", { userId: offer.userId, candidate: event.candidate });
        }
      }
    });

    newPeer.ontrack = (event) => {
      console.log('event', event);
      const video = document.getElementById("video");
      video.srcObject = event.streams[0];
    }

    newSocket.on('ice-candidate', async (candidate) => {
      console.log("candidate", candidate);
      await newPeer.addIceCandidate(new RTCIceCandidate(candidate.candidate));
    });
  }

  const handleStopStream = () => {
    console.log("Stop Stream");

    if (peer) {
      peer.close();
    }
    if (socket) {
      socket.close();
    }

    setPeer(null);
    setSocket(null);
    setStream(null);
  }

  useEffect(() => {
    if (stream) {
      const video = document.getElementById("video");
      video.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-[#28252a] min-h-screen pb-5">
      <div className="container mx-auto">
        <div className="flex flex-col gap-4 xl:px-[150px] justify-center items-center min-h-screen ">
          <div className="border border-white rounded">
            <video id="video" className="w-full h-[3j00px] xl:h-[480px] xl:object-cover" controls autoPlay playsInline></video>
          </div>
          <h1 className="text-2xl xl:text-4xl text-white text-center">Streaming Page</h1>
          <div className="flex gap-4 justify-center items-center">
            <button className="bg-transparent text-white border border-white px-4 py-2 rounded-lg" onClick={handleStartStream}>Start Stream</button>
            <button className="bg-red-500 text-white px-4 py-2 border border-white rounded-lg" onClick={handleStopStream}>Stop Stream</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default User;
