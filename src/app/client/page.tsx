'use client'
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io("https://near-slime-lemonade.glitch.me");

const ClientPage = () => {
  const [room, setRoom] = useState('');
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  let peerConnection: RTCPeerConnection | null = null;

  useEffect(() => {
   

    if (!room) return;
    
    socket.on('offer', handleReceiveOffer);
    socket.on('candidate', handleNewICECandidateMsg);


    return () => {
      socket.off('answer', handleReceiveOffer);
      socket.off('candidate', handleNewICECandidateMsg);
    }
  }, [socket,peerConnection,room]);

  const handleReceiveOffer = async (offer:any) => {
    console.log("room",offer.room);
    console.log('Received offer',offer);
    peerConnection = createPeerConnection();

    // check state of peer connection
    

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer.offer));
    const answer = await peerConnection.createAnswer();

    // check state of peer connection
    // if (peerConnection.signalingState !== 'stable') return;

    // it does have local offer or remote offer or both
    // if (!peerConnection.localDescription) {
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer', answer, offer.room);
    // }

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
      if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };


  const joinRoom = () => {
    socket.emit('join', room);
  };

  return (
    <div>
      <input type="text" placeholder="Room ID" value={room} onChange={e => setRoom(e.target.value)} />
      <button onClick={joinRoom}>Join Room</button>
      <video ref={remoteVideoRef} autoPlay playsInline></video>
    </div>
  );
};

export default ClientPage;
