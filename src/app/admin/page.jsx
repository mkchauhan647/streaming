'use client'
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const Admin = () => {
  const [peers, setPeers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);
  const peersRef = useRef([]);


  async function authorize(){
    try {
      const pass = prompt("Enter the password");
      const response = await fetch("http://localhost:3001/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pass })
      });
      if (!response.ok) {
        alert("Unauthorized");
        document.write("Unauthorized");
        return false;

      }

      return true;
    } catch(error){
      console.log(error);
    }
  }

  const handleStartStream = async () => {

    // console.log(authorize());

    if (! (await authorize())) {
      // document.write("Unauthorized");
      return;
    }



    try {
      const response = await fetch("http://localhost:3000/stream-status");
      if (response.ok) {
        const data = await response.json();
        if (data.streaming) {
          return alert("Stream is already started");
        }
      }
    } catch (error) {
      console.log(error);
    }

    const newSocket = io();

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    setStream(stream);
    const video = document.getElementById("video");
    video.srcObject = stream;

    newSocket.emit('registerAdmin');

    newSocket.on('newPeer', (userId) => {
      const newPeer = new RTCPeerConnection();
      peersRef.current.push({ peerId: userId, peer: newPeer });
      setPeers([...peersRef.current]);

      newPeer.onicecandidate = (event) => {
        if (event.candidate) {
          newSocket.emit("ice-candidate", { userId, candidate: event.candidate });
        }
      }

      stream.getTracks().forEach(track => newPeer.addTrack(track, stream));

      newPeer.createOffer().then((offer) => {
        return newPeer.setLocalDescription(offer);
      }).then(() => {
        newSocket.emit("offer", { userId, offer: newPeer.localDescription });
      });

      newSocket.on("answer", async (answer) => {
        // const peerObj = peersRef.current.find(p => p.peerId === answer.userId);
        // if (peerObj) {
        //   const newDesc = new RTCSessionDescription(answer.answer);
        //   await peerObj.peer.setRemoteDescription(newDesc);
        // }
        const desc = new RTCSessionDescription(answer.answer);

        if (newPeer.signalingState == "have-local-offer" || newPeer.signalingState == 'have-remote-pranswer') {
          await newPeer.setRemoteDescription(desc);
        }
      });

      newSocket.on('ice-candidate', async (candidate) => {
        const peerObj = peersRef.current.find(p => p.peerId === candidate.userId);
        if (peerObj) {
          await peerObj.peer.addIceCandidate(new RTCIceCandidate(candidate.candidate));
        }
      });
    });

    setSocket(newSocket);
  }

  const handleStopStream = async () => {
    try {
      const response = await fetch("http://localhost:5000/stream-status");
      if (response.ok) {
        const data = await response.json();
        if (!data.streaming) {
          return alert("Stream is not started");
        }
      }
    } catch (error) {
      console.log(error);
    }

    const video = document.getElementById("video");
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }

    setPeers([]);
    setSocket(null);
    setStream(null);
    peersRef.current = [];
  }


  useEffect(() => {
    
    

    // authorize();



  },[])


  return (
    <div className="bg-[#28252a] min-h-screen pt-5">
      <div className="container mx-auto">
        <div className="flex flex-col gap-5 xl:px-[150px]">
          <div className="border border-white rounded">
            <video id="video" src="/large.mp4" className="w-full h-[510px] object-cover" controls autoPlay playsInline muted></video>
          </div>
          <h1 className="text-2xl xl:text-4xl text-white text-center">Admin Page</h1>
          <div className="flex gap-4 justify-center items-center">
            <button className="bg-transparent text-white border border-white px-4 py-2 rounded-lg" onClick={handleStartStream}>Start Stream</button>
            <button className="bg-red-500 text-white px-4 py-2 border border-white rounded-lg" onClick={handleStopStream}>Stop Stream</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin;
