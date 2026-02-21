import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, RefreshCw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { attendanceAPI } from '../services/apiServices';
import { useAuth } from '../contexts/AuthContext';

function AttendanceMarking() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please allow camera permissions.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = async (action) => {
        if (!videoRef.current || !canvasRef.current || !user) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Capture image
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            // Get location (optional but good for attendance)
            let location = null;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                } catch (geoErr) {
                    console.warn('Geolocation not available:', geoErr);
                }
            }

            // 2. Prepare payload
            // Fix: Prioritize user.employee.id if available, as that's the guaranteed Employee UUID
            const employeeId = user.employee?.id || user.employee_id || user.id;

            if (!employeeId) {
                throw new Error('Employee profile not found. Cannot mark attendance.');
            }

            const payload = {
                employee_id: employeeId,
                location: location,
                face_match_confidence: 0.98, // Mocked for now as we don't have face api in frontend
                liveness_verified: true,
                device_info: {
                    userAgent: navigator.userAgent
                }
            };

            // 3. Call API
            let response;
            if (action === 'check-in') {
                response = await attendanceAPI.checkIn(payload);
            } else {
                response = await attendanceAPI.checkOut(payload);
            }

            if (response.data?.success) {
                setSuccess(`Successfully marked ${action === 'check-in' ? 'Check In' : 'Check Out'}!`);
                setTimeout(() => navigate('/employee/dashboard'), 2000);
            } else {
                throw new Error(response.data?.message || 'Failed to mark attendance');
            }

        } catch (err) {
            console.error('Attendance error:', err);
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-teal-50 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center">
                    <button
                        onClick={() => navigate('/employee/dashboard')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                </div>

                {/* Camera View */}
                <div className="bg-teal-50/95 rounded-xl shadow-lg overflow-hidden mb-6 relative">
                    <div className="aspect-video bg-black relative">
                        {!stream && !error && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <RefreshCw className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
                                <div className="text-center p-4">
                                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                                    <p>{error}</p>
                                    <button
                                        onClick={startCamera}
                                        className="mt-4 px-4 py-2 bg-blue-600 rounded text-sm hover:bg-blue-700"
                                    >
                                        Retry Camera
                                    </button>
                                </div>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${stream ? 'opacity-100' : 'opacity-0'}`}
                            onLoadedMetadata={() => videoRef.current.play()}
                        />
                        {/* Face guide overlay */}
                        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/50 rounded-lg m-12"></div>

                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="p-6">
                        {/* Status Message */}
                        {success && (
                            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center animate-fade-in">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                {success}
                            </div>
                        )}
                        {error && !stream && (
                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => handleCapture('check-in')}
                                disabled={loading || !stream}
                                className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all ${loading || !stream
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 mr-2" />}
                                Check In
                            </button>

                            <button
                                onClick={() => handleCapture('check-out')}
                                disabled={loading || !stream}
                                className={`flex-1 flex items-center justify-center px-6 py-3 rounded-lg text-white font-medium transition-all ${loading || !stream
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 mr-2" />}
                                Check Out
                            </button>
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Ensure your face is clearly visible within the frame.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AttendanceMarking;
