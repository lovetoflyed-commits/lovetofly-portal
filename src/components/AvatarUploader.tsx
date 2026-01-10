"use client";
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  initialAvatarUrl?: string | null;
  onPhotoSelected?: (dataUrl: string) => void;
};

export default function AvatarUploader({ initialAvatarUrl, onPhotoSelected }: Props) {
  const [preview, setPreview] = useState<string | null>(initialAvatarUrl || null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setPreview(initialAvatarUrl || null);
  }, [initialAvatarUrl]);

  // Cleanup: stop camera when component unmounts
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - cleaning up camera...');
      const stream = videoRef.current?.srcObject as MediaStream | undefined;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => {
          console.log(`Cleanup: stopping ${track.kind} track`);
          track.stop();
        });
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
      console.log('✅ Cleanup complete');
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem válida');
      return;
    }
    
    // Convert to data URL for preview and parent callback
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      onPhotoSelected?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setError(null);
    setStreaming(true); // Show modal immediately
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
      setStreaming(false);
    }
  };

  const stopCamera = () => {
    console.log('🔴 Stopping camera...');
    
    // Get all tracks from the stream
    const stream = videoRef.current?.srcObject as MediaStream | undefined;
    if (stream) {
      const tracks = stream.getTracks();
      console.log('Found tracks:', tracks.length);
      tracks.forEach((track) => {
        console.log(`Stopping ${track.kind} track, state: ${track.readyState}`);
        track.stop();
        console.log(`After stop, state: ${track.readyState}`);
      });
    }
    
    // Clear video element aggressively
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = ''; // Clear src as well
      videoRef.current.load(); // Force reload to release all resources
    }
    
    setStreaming(false);
    console.log('✅ Camera stopped, streaming=false');
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    console.log('📸 Capturing photo...');
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    
    // Stop camera after capturing
    console.log('Stopping camera after capture...');
    stopCamera();
    
    // Notify parent component about the new photo
    onPhotoSelected?.(dataUrl);
  };



  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400">Sem foto</span>
            )}
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            <label className="px-3 py-2 bg-white border border-slate-200 rounded font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <span>Escolher foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button type="button" onClick={startCamera} className="px-3 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
              Usar câmera
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm font-bold">{error}</div>
        )}
      </div>

      {/* Camera Modal */}
      {streaming && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tirar Selfie</h3>
            <div className="space-y-4">
              <video 
                ref={videoRef} 
                className="w-full rounded-lg border-2 border-slate-300" 
                playsInline 
                muted 
                autoPlay
              />
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={stopCamera} 
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={capturePhoto} 
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
                >
                  📸 Capturar Foto
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}
