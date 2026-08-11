import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useCubeStore } from '../store/cubeStore';

const CameraContext = createContext(null);

export const CameraProvider = ({ children }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const setCameraActive = useCubeStore((state) => state.setCameraActive);

  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (isMounted) {
          setStream(mediaStream);
          setCameraActive(true);
        }
      } catch (err) {
        console.error("Failed to access camera", err);
        if (isMounted) setCameraActive(false);
      }
    };
    
    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CameraContext.Provider value={{ videoRef, stream }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => useContext(CameraContext);
