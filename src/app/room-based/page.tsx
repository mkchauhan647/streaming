'use client'
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io("https://near-slime-lemonade.glitch.me");

const AdminPage = () => {
  const [room, setRoom] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  let localStream: MediaStream | null = null;
  let peerConnection: RTCPeerConnection | null = null;

  useEffect(() => {
    console.log("I am running two times right? ")
    socket.on('answer', handleReceiveAnswer);
    socket.on('candidate', handleNewICECandidateMsg);

    // 
    // return () => {
    //   socket.off('answer', handleReceiveAnswer);
    //   socket.off('candidate', handleNewICECandidateMsg);
    // }

  }, [socket,peerConnection,room]);

  const handleReceiveAnswer = async (answer: RTCSessionDescriptionInit) => {
    console.log('Received answer',answer);
    await peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));

  };

  const handleNewICECandidateMsg = async (candidate: RTCIceCandidateInit) => {
    await peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const createPeerConnection = () => {
    // const pc = new RTCPeerConnection({
    //   iceServers: [{ urls: 'stun:stun.stunprotocol.org' }]
    // });

    const configuration = { 
      iceServers: [{
        urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302','stun:stun3.l.google.com:19302','stun:stun4.l.google.com:19302'],
        
      }],
      iceCandidatePoolSize: 10,
      // Add TURN server here if available
    };
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate) {


        socket.emit('candidate', event.candidate.toJSON(), room);
      }
    };

    pc.ontrack = (event) => {
      console.log('Stream received from client');
    };

    // if (localStream) {
      localStream?.getTracks().forEach(track => {
        pc.addTrack(track, localStream as MediaStream);
      });
    // }

    return pc;
  };

  const startStreaming = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    peerConnection = createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer, room);
  };



  return (
    <div>
      <input type="text" placeholder="Room ID" value={room} onChange={e => setRoom(e.target.value)} />
      <button onClick={startStreaming}>Start Streaming</button>
      <video ref={localVideoRef} autoPlay playsInline muted></video>
    </div>
  );
};

export default AdminPage;
