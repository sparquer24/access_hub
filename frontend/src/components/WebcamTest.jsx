import React from 'react';
import WebcamCapture from './common/WebcamCapture.jsx';

const WebcamTest = () => {
  const handleImageCapture = (base64Image) => {
    console.log('Image captured:', base64Image);
    alert('Image captured successfully! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-teal-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🧪 Webcam Test Page
        </h1>

        <div className="bg-teal-50/95 rounded-lg shadow-lg p-6">
          <WebcamCapture
            onImageCapture={handleImageCapture}
          />
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 Test Instructions:</h3>
          <ul className="text-yellow-700 space-y-1">
            <li>1. Check the debug panel above for webcam state</li>
            <li>2. Allow camera permissions when prompted</li>
            <li>3. Watch for console logs in browser DevTools</li>
            <li>4. Verify video preview appears</li>
            <li>5. Test capture and review functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebcamTest;
