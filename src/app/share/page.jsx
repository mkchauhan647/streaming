// components/ScreenSharing.js

'use client'
import React, { useEffect, useState, useRef } from 'react';
import SimpleWebRTC from 'simplewebrtc';

const ScreenSharing = () => {
  const [webrtc, setWebrtc] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const webrtc = new SimpleWebRTC({
      localVideoEl: 'localVideo',
      remoteVideosEl: '',
      autoRequestMedia: true,
    });

    webrtc.on('localStream', (stream) => {
      videoRef.current.srcObject = stream;
    });

    setWebrtc(webrtc);

    return () => {
      webrtc.stopLocalVideo();
      webrtc.leaveRoom();
    };
  }, []);

  const startScreenShare = () => {
    webrtc.shareScreen((err) => {
      if (err) {
        console.error('Screen share error:', err);
      }
    });
  };

  return (
    <div>
      <video ref={videoRef} id="localVideo" autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
      <button onClick={startScreenShare}>Start Screen Share</button>
    </div>
  );
};

export default ScreenSharing;
