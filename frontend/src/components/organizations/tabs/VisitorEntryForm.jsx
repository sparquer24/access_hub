import React, { useEffect, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { visitorService } from '../../../services/visitorService';
import { faceService } from '../../../services/faceService';
import { visitorsAPI } from '../../../services/apiServices';
import WebcamCapture from '../../common/WebcamCapture.jsx';
import Loader from '../../common/Loader';
import {
  User,
  Building2,
  Calendar,
  ClipboardList,
  UserCheck,
  Camera
} from 'lucide-react';

const VisitorEntryForm = ({ organizationId, organization, onSubmitSuccess }) => {
  const { success, error: showError } = useToast();
  
  // Get today's date in YYYY-MM-DD format for form defaults
  const today = new Date().toISOString().split('T')[0];
  
  const initialFormData = {
    name: '',
    phone: '',
    email: '',
    gender: '',
    purpose_of_visit: '',
    from_date: today,     // Auto-set to today
    to_date: today,       // Auto-set to today (same day visit)
    allowed_location_id: '',  // Replaced tower/floor with location_id
    image_base64: '',

    // New fields
    visitor_type: 'guest',
    host_name: '',
    host_number: '',
    is_recurring: false,
    expected_duration_hours: '',

    // Vehicle specific - REMOVED to LPR Module
    // has_vehicle: false, ...

  };
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckedMobile, setLastCheckedMobile] = useState('');
  const [isUsingExistingImage, setIsUsingExistingImage] = useState(false);
  const [isExistingImageConfirmed, setIsExistingImageConfirmed] = useState(false);
  const [locations, setLocations] = useState([]);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsResp = await visitorsAPI.getLocations(organizationId);
        const locations = locationsResp.data?.data?.items || [];
        setLocations(locations);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        // Fallback to legacy endpoints if new endpoint fails
        try {
          const [fl, tw] = await Promise.all([
            visitorsAPI.floors(),
            visitorsAPI.towers(),
          ]);
          // Convert legacy format to flat location list
          const legacyLocations = [];
          (tw.data || []).forEach(tower => {
            (fl.data || []).forEach(floor => {
              legacyLocations.push({
                id: `legacy-${tower}-${floor}`,
                name: `${tower} - ${floor}`,
                building: tower,
                floor: floor,
                description: `${tower} building, ${floor} floor`
              });
            });
          });
          setLocations(legacyLocations);
        } catch {
          console.error("Failed to fetch legacy floor/tower data");
        }
      }
    };

    if (organizationId) {
      fetchLocations();
    }
  }, [organizationId]);

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Visitor name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number (starts with 6-9)';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.visitor_type) {
      newErrors.visitor_type = 'Visitor type is required';
    }

    if (!formData.purpose_of_visit.trim()) {
      newErrors.purpose_of_visit = 'Purpose of visit is required';
    }

    if (!formData.host_name.trim()) {
      newErrors.host_name = 'Host name is required';
    }

    if (!formData.host_number.trim()) {
      newErrors.host_number = 'Host number is required';
    }

    if (!formData.allowed_location_id) {
      newErrors.allowed_location_id = 'Please select a location';
    }

    if (!formData.image_base64) {
      newErrors.image_base64 = 'Visitor photo is required';
    } else if (isUsingExistingImage && !isExistingImageConfirmed) {
      newErrors.image_base64 = 'Please confirm existing image or click retake';
    }

    setErrors(newErrors);
    
    // Log validation errors for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Form validation failed with errors:', newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Auto-scroll to first error
  const scrollToFirstError = () => {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.error-field');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        firstErrorElement.focus();
      }
    }, 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  useEffect(() => {
    const mobile = formData.phone.trim();
    const isValidMobile = /^[6-9]\d{9}$/.test(mobile);

    if (!isValidMobile) {
      setLastCheckedMobile('');
      setIsUsingExistingImage(false);
      setIsExistingImageConfirmed(false);
      return;
    }

    if (mobile === lastCheckedMobile) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const visitor = await visitorService.getExistingVisitorByMobile(organizationId, mobile);
        setLastCheckedMobile(mobile);

        if (!visitor) {
          setIsUsingExistingImage(false);
          setIsExistingImageConfirmed(false);
          return;
        }

        setFormData(prev => ({
          ...prev,
          name: visitor.name || prev.name,
          email: visitor.email || prev.email,
          gender: visitor.gender || prev.gender,
          visitor_type: visitor.visitor_type || prev.visitor_type,
          purpose_of_visit: visitor.purpose_of_visit || prev.purpose_of_visit,
          host_name: visitor.host_name || prev.host_name,
          host_number: visitor.host_number || prev.host_number,
          from_date: visitor.from_date || prev.from_date,
          to_date: visitor.to_date || prev.to_date,
          allowed_location_id: visitor.allowed_location_id || prev.allowed_location_id,
          image_base64: visitor.image_base64 || prev.image_base64
        }));

        if (visitor.image_base64) {
          setImagePreview(visitor.image_base64);
          setIsUsingExistingImage(true);
          setIsExistingImageConfirmed(false);
          setShowWebcam(false);
        }
      } catch (lookupError) {
        // Keep silent - no extra UI section for lookup state/errors.
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.phone, organizationId, lastCheckedMobile]);

  const handleImageCapture = (base64Image) => {
    console.log('🎯 handleImageCapture CALLED!', {
      called: true,
      timestamp: new Date().toISOString(),
      hasImageData: !!base64Image,
      caller: 'WebcamCapture component'
    });
    console.log('📸 Image captured, stopping webcam automatically...');
    console.log('🖼️ Base64 image details:', {
      length: base64Image?.length || 0,
      format: base64Image?.substring(0, 30) + '...' || 'No image data',
      isValidBase64: base64Image?.startsWith('data:image/') || false,
      imageExists: !!base64Image
    });

    if (!base64Image) {
      console.error('❌ No base64 image data received!');
      showError('Failed to capture image. Please try again.');
      return;
    }

    // 🔴 LAYER 1: IMMEDIATE AGGRESSIVE CAMERA SHUTDOWN - BEFORE STATE UPDATE
    console.log('🔴 LAYER 1: AGGRESSIVE IMMEDIATE SHUTDOWN STARTING');
    const videoElements = document.querySelectorAll('video');
    let stoppedTrackCount = 0;
    videoElements.forEach((video, idx) => {
      console.log(`Processing video element ${idx}:`, video.id || 'no-id');
      
      // Get and stop all tracks
      const tracks = video.srcObject?.getTracks() || [];
      tracks.forEach(track => {
        console.log(`  🛑 Stopping ${track.kind} track (enabled: ${track.enabled}, readyState: ${track.readyState})`);
        track.enabled = false;
        track.stop();
        stoppedTrackCount++;
      });
      
      // Clear video element completely
      if (video.srcObject) {
        video.srcObject = null;
      }
      video.src = '';
      video.pause();
      video.muted = true;
      video.autoplay = false;
      video.controls = false;
      video.style.display = 'none';
      video.style.visibility = 'hidden';
      video.style.opacity = '0';
      
      console.log(`  ✅ Video element ${idx} cleared (stopped ${tracks.length} tracks)`);
    });
    console.log(`🔴 LAYER 1 COMPLETE: Stopped ${stoppedTrackCount} total tracks`);

    // Update form data with the captured image based on active slot
    if (activePhotoSlot === 'visitor' || !activePhotoSlot) {
      setFormData(prev => ({
        ...prev,
        image_base64: base64Image
      }));
      setImagePreview(base64Image);
      setIsUsingExistingImage(false);
      setIsExistingImageConfirmed(true);
      if (errors.image_base64) {
        setErrors(prev => ({ ...prev, image_base64: '' }));
      }
    }

    // 🔴 CRITICAL: DELAY UNMOUNT to allow OS to release camera device
    // The WebcamCapture component needs time to fully release hardware BEFORE unmounting
    console.log('⏲️ Scheduling delayed unmount to allow device release...');
    setTimeout(() => {
      console.log('⏲️ 250ms elapsed: NOW safe to hide webcam and unmount component');
      setShowWebcam(false);
      setActivePhotoSlot(null);
    }, 250);

    // 🟠 LAYER 2: DELAYED CLEANUP - Catch any streams that survived layer 1
    setTimeout(() => {
      console.log('🟠 LAYER 2: Running delayed camera cleanup (100ms)');
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video, idx) => {
        if (video.srcObject) {
          console.log(`  ⚠️ Video ${idx} STILL HAS STREAM! Force stopping...`);
          const stream = video.srcObject;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
              console.log(`    🔴 Force stopping ${track.kind} track`);
              track.stop();
            });
          }
          video.srcObject = null;
        }
      });
      console.log('🟠 LAYER 2 COMPLETE');
    }, 100);

    // 🟡 LAYER 3: FINAL VERIFICATION - Check if camera is really dead
    setTimeout(() => {
      console.log('🟡 LAYER 3: Running tertiary camera cleanup (200ms)');
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video, idx) => {
        const tracks = video.srcObject?.getTracks() || [];
        if (tracks.length > 0) {
          console.log(`  ⚠️ Video ${idx} FOUND ${tracks.length} ACTIVE TRACKS! FINAL SHUTDOWN...`);
          tracks.forEach(track => {
            console.log(`    🔴 FINAL: Stopping ${track.kind}`);
            track.stop();
          });
          video.srcObject = null;
        } else {
          console.log(`  ✅ Video ${idx}: No active tracks - camera is OFF`);
        }
      });
      console.log('🟡 LAYER 3 COMPLETE - CAMERA SHOULD NOW BE COMPLETELY OFF');
    }, 200);

    console.log('🎬 ✅ CAMERA SHUTDOWN HANDLERS QUEUED - Image capture complete');
  };

  const handleClearImage = () => {
    console.log('🗑️ Clearing captured image');
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_base64: '' }));
    setIsUsingExistingImage(false);
    setIsExistingImageConfirmed(false);
  };

  const handleConfirmExistingImage = () => {
    setIsExistingImageConfirmed(true);
    if (errors.image_base64) {
      setErrors(prev => ({ ...prev, image_base64: '' }));
    }
  };

  const handleRetakeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_base64: '' }));
    setIsUsingExistingImage(false);
    setIsExistingImageConfirmed(false);
    setShowWebcam(true);
  };

  const handleCloseWebcam = () => {
    console.log('❌ Closing webcam manually');
    setShowWebcam(false);

    // Stop all active camera streams
    setTimeout(() => {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach(video => {
        if (video.srcObject) {
          const stream = video.srcObject;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
              console.log('🛑 Stopping camera track on manual close:', track.kind);
              track.stop();
            });
          }
          video.srcObject = null;
        }
      });
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    // Validate form
    if (!validateForm()) {
      showError('Please fix the errors below and try again');
      scrollToFirstError();
      setIsSubmitting(false);
      return;
    }

    if (!organizationId) {
      showError('Organization ID is missing. Please refresh and try again.');
      setIsSubmitting(false);
      return;
    }

    try {
      setLoading(true);

      // Find the selected location to extract floor information
      const selectedLocation = locations.find(loc => loc.id === formData.allowed_location_id);
      
      // Build API payload with only UI fields and user-entered values
      const sanitizedData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        purpose_of_visit: formData.purpose_of_visit,
        from_date: formData.from_date,
        to_date: formData.to_date || null,
        allowed_location_id: formData.allowed_location_id,
        // Extract floor and tower from location for backend processing
        allowed_floor: selectedLocation?.floor || null,
        allowed_tower: selectedLocation?.building || null,
        image_base64: formData.image_base64,
        visitor_type: formData.visitor_type,
        host_name: formData.host_name,
        host_number: formData.host_number,
        is_recurring: formData.is_recurring,
      };

      console.log('📝 Submitting check-in form with data:', sanitizedData);
      const response = await visitorService.checkInNewVisitor(organizationId, sanitizedData);
      console.log('✅ Check-in API response:', response);

      // Handle response structure - response comes directly from api.post
      // The actual data is nested in response structure
      if (response.success === false || !response.success) {
        showError(response.message || 'Check-in failed');
        setIsSubmitting(false);
        return;
      }

      success('Visitor check-in successful!');

      // Extract visitor_id and history_id from response
      // Response structure: { success: true, data: {...}, message: "..." } OR { visitor_id: "...", ... }
      const responseData = response.data || response;
      const { visitor_id, history_id, check_in_time } = responseData;
      
      if (!visitor_id || !history_id) {
        console.error('❌ Missing visitor_id or history_id:', { visitor_id, history_id, responseData });
        showError('Check-in succeeded but missing visitor information');
        setIsSubmitting(false);
        return;
      }
      
      console.log('📋 Check-in data:', { visitor_id, history_id, check_in_time });

      // Enroll visitor face using VMS endpoint /api/v1/face/enroll_VMS
      try {
        await faceService.enrollFaceVms(visitor_id, formData.image_base64);
        console.log('✅ Face enrollment successful');
      } catch (enrollmentError) {
        // Non-blocking error - visitor check-in still successful
        console.warn('⚠️ Face enrollment failed (non-blocking):', enrollmentError);
      }

      // Reset form
      setFormData(initialFormData);
      setImagePreview(null);
      setShowWebcam(false);
      setErrors({});
      setLastCheckedMobile('');
      setIsUsingExistingImage(false);
      setIsExistingImageConfirmed(false);

      // Call parent callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('❌ Error creating visitor:', error);

      let errorMessage = 'Failed to check-in visitor';

      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to check-in visitors.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Organization not found or API endpoint missing.';
      } else if (error.response?.status === 413) {
        errorMessage = 'Image file too large. Please use a smaller image.';
      } else if (error.response?.status === 400 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const firstErrorEntry = Object.entries(validationErrors)[0];
        if (firstErrorEntry) {
          const [fieldName, fieldMessages] = firstErrorEntry;
          const firstMessage = Array.isArray(fieldMessages) ? fieldMessages[0] : fieldMessages;
          errorMessage = `${fieldName}: ${firstMessage}`;
        } else {
          errorMessage = error.response?.data?.message || 'Validation failed.';
        }
      } else if (error.response?.status === 422) {
        errorMessage = error.response?.data?.message || 'Invalid data provided.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Log detailed error info for debugging
      console.error('🔍 Detailed error info:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: errorMessage,
        responseData: error.response?.data,
        requestData: error.config?.data?.substring ? error.config.data.substring(0, 200) + '...' : error.config?.data,
        isNetworkError: !error.response
      });

      showError(`Check-in failed: ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="large" text="Loading check-in form..." />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .visitor-form-container {
          height: calc(100vh - 310px);
          min-height: 600px;
          overflow-y: scroll !important;
        }
        .visitor-form-container::-webkit-scrollbar {
          width: 12px;
          background: #f3f4f6;
        }
        .visitor-form-container::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 6px;
        }
        .visitor-form-container::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .visitor-form-container::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }
        .visitor-form-container {
          scrollbar-width: auto;
          scrollbar-color: #6b7280 #e5e7eb;
        }
        
        .visitor-form-card {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        .visitor-form-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-color: #0d9488;
        }
        
        .form-field-group {
          margin-bottom: 12px;
        }
        
        .form-field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
        }
        
        .form-field-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: #ffffff;
        }
        
        .form-field-input:focus {
          outline: none;
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
          background: #f0fdf4;
        }
        
        .form-field-input.error {
          border-color: #dc2626;
          background: #fef2f2;
        }
        
        .form-error-message {
          margin-top: 4px;
          font-size: 12px;
          color: #dc2626;
          font-weight: 500;
        }
        
        .photo-capture-bg {
          background: linear-gradient(135deg, rgba(15, 118, 110, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%),
                      url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="camera-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="%23d1fae5" opacity="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23camera-pattern)"/></svg>');
          background-size: 20px 20px, cover;
          position: relative;
        }
        .photo-capture-bg::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="%23059669" viewBox="0 0 24 24"><path d="M12 9a3 3 0 110 6 3 3 0 010-6z"/><path d="M17 5h1a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h1l1-2h8l1 2z" fill="none" stroke="%23059669" stroke-width="1.5"/></svg>') no-repeat center;
          opacity: 0.3;
          pointer-events: none;
        }
        
        .form-section-title {
          font-size: 14px;
          font-weight: 700;
          color: #0d9488;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #d1fae5;
          letter-spacing: 0.5px;
        }
        
        .form-section-spacing {
          margin-bottom: 20px;
        }
        
        @media (max-width: 1023px) {
          .visitor-form-container {
            height: auto !important;
            min-height: 100vh;
          }
        }
      `}</style>
      <div className="w-full h-full bg-teal-50">
        <div 
          className="visitor-form-container bg-gradient-to-b from-white to-teal-50 border border-teal-200 shadow-lg overflow-y-auto w-full"
          style={{
            maxHeight: 'calc(100vh - 310px)',
            minHeight: '600px',
            height: '100%'
          }}>

          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-6 pb-48" style={{ minHeight: '700px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 form-section-spacing">
              {/* Visitor Information */}
              <div className="col-span-1 visitor-form-card">
                <h4 className="form-section-title flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  Visitor Information
                </h4>
                <div className="space-y-3">
                  <div className="form-field-group">
                    <label className="form-field-label">Visitor Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full name of visitor"
                      required
                      className={`form-field-input ${errors.name ? 'error' : ''}`}
                    />
                    {errors.name && <p className="form-error-message">{errors.name}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Mobile Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      required
                      className={`form-field-input ${errors.phone ? 'error' : ''}`}
                    />
                    {errors.phone && <p className="form-error-message">{errors.phone}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="visitor@example.com"
                      required
                      className={`form-field-input ${errors.email ? 'error' : ''}`}
                    />
                    {errors.email && <p className="form-error-message">{errors.email}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className={`form-field-input ${errors.gender ? 'error' : ''}`}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="form-error-message">{errors.gender}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Visitor Type *</label>
                    <select
                      name="visitor_type"
                      value={formData.visitor_type}
                      onChange={handleInputChange}
                      required
                      className={`form-field-input ${errors.visitor_type ? 'error' : ''}`}
                    >
                      <option value="guest">Guest</option>
                      <option value="contractor">Contractor</option>
                      <option value="vendor">Vendor</option>
                      <option value="interview_candidate">Interview Candidate</option>
                      <option value="delivery">Delivery Personnel</option>
                      <option value="service_provider">Service Provider</option>
                      <option value="vip">VIP</option>
                    </select>
                    {errors.visitor_type && <p className="form-error-message">{errors.visitor_type}</p>}
                  </div>
                </div>
              </div>
              {/* Capture Visitor Photo */}
              <div className="col-span-1 visitor-form-card photo-capture-bg">
                <div className="flex flex-col items-center justify-center h-full min-h-48">
                  {!showWebcam && !imagePreview && (
                    <div className={`${errors.image_base64 ? 'error-field' : ''} w-full flex flex-col items-center`}>
                      <div className="mb-4">
                        <Camera className="w-12 h-12 text-blue-600 mx-auto" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWebcam(true)}
                        className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${errors.image_base64 ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}`}
                      >
                        <Camera className="w-4 h-4" />
                        Capture Visitor Photo
                      </button>
                      {errors.image_base64 && <p className="mt-2 text-xs text-red-600 text-center">{errors.image_base64}</p>}
                    </div>
                  )}
                  {showWebcam && (
                    <div className="w-full">
                      <WebcamCapture onImageCapture={handleImageCapture} onBack={handleCloseWebcam} />
                    </div>
                  )}
                  {imagePreview && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200 w-full">
                      <img src={imagePreview} alt="Captured visitor" className="w-full h-32 object-cover rounded-md border border-gray-200" />
                      <div className="mt-3 flex gap-2">
                        {isUsingExistingImage && !isExistingImageConfirmed ? (
                          <>
                            <button type="button" onClick={handleConfirmExistingImage} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                              <UserCheck className="w-4 h-4" />
                              Confirm
                            </button>
                            <button type="button" onClick={handleRetakeImage} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1">
                              <Camera className="w-4 h-4" />
                              Retake
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={isUsingExistingImage ? handleRetakeImage : handleClearImage} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1">
                            <Camera className="w-4 h-4" />
                            Retake Photo
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Host Details */}
              <div className="col-span-1 visitor-form-card">
                <h4 className="form-section-title flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Host Details
                </h4>
                <div className="space-y-3">
                  <div className="form-field-group">
                    <label className="form-field-label">Host Name *</label>
                    <input
                      type="text"
                      name="host_name"
                      value={formData.host_name}
                      onChange={handleInputChange}
                      placeholder="Person/Department to visit"
                      required
                      className={`form-field-input ${errors.host_name ? 'error' : ''}`}
                    />
                    {errors.host_name && <p className="form-error-message">{errors.host_name}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Host Phone *</label>
                    <input
                      type="tel"
                      name="host_number"
                      value={formData.host_number}
                      onChange={handleInputChange}
                      placeholder="Host contact number"
                      required
                      className={`form-field-input ${errors.host_number ? 'error' : ''}`}
                    />
                    {errors.host_number && <p className="form-error-message">{errors.host_number}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Purpose of Visit *</label>
                    <input
                      type="text"
                      name="purpose_of_visit"
                      value={formData.purpose_of_visit}
                      onChange={handleInputChange}
                      placeholder="e.g., Meeting, Delivery, Service"
                      className={`form-field-input ${errors.purpose_of_visit ? 'error' : ''}`}
                    />
                    {errors.purpose_of_visit && <p className="form-error-message">{errors.purpose_of_visit}</p>}
                  </div>
                  <div className="form-field-group">
                    <label className="form-field-label">Location *</label>
                    <select
                      name="allowed_location_id"
                      value={formData.allowed_location_id || ''}
                      onChange={handleInputChange}
                      className={`form-field-input ${errors.allowed_location_id ? 'error' : ''}`}
                    >
                      <option value="">Select a location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                          {location.description && ` (${location.description})`}
                        </option>
                      ))}
                    </select>
                    {errors.allowed_location_id && <p className="form-error-message">{errors.allowed_location_id}</p>}
                  </div>
                  <div className="form-field-group flex items-center gap-3 mt-4 pt-2 border-t border-teal-100">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      name="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <label htmlFor="is_recurring" className="form-field-label mb-0 cursor-pointer">
                      Mark as Recurring Visitor
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Visit Dates Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 visitor-form-card form-section-spacing">
              <h4 className="col-span-2 form-section-title mb-0 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                Visit Dates
              </h4>
              <div className="form-field-group">
                <label className="form-field-label">From Date *</label>
                <input
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  required
                  className={`form-field-input ${errors.from_date ? 'error' : ''}`}
                />
                {errors.from_date && <p className="form-error-message">{errors.from_date}</p>}
              </div>
              <div className="form-field-group">
                <label className="form-field-label">To Date</label>
                <input
                  type="date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleInputChange}
                  className={`form-field-input ${errors.to_date ? 'error' : ''}`}
                />
                {errors.to_date && <p className="form-error-message">{errors.to_date}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center gap-4 mt-10 mb-8 px-2 sm:px-0">
              <button
                type="submit"
                disabled={loading || isSubmitting}
                className={`px-6 sm:px-8 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base whitespace-nowrap w-full sm:w-auto sm:min-w-64 ${loading || isSubmitting ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white'}`}
              >
                {loading || isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ✓ Check In Visitor
                  </>
                )}
              </button>
            </div>
            
            {/* Scroll Helper - Extra spacing to ensure scrolling */}
            <div className="text-center text-gray-400 text-xs pb-8 mt-4">
              <div className="flex items-center justify-center gap-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="flex items-center gap-1">
                  <ClipboardList className="w-3 h-3" />
                  End of Form
                </span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default VisitorEntryForm;
