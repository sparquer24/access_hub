import React, { useEffect, useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { visitorService } from '../../../services/visitorService';
import { faceService } from '../../../services/faceService';
import WebcamCapture from '../../common/WebcamCapture.jsx';

const VisitorEntryForm = ({ organizationId, organization, onSubmitSuccess }) => {
  const { success, error: showError } = useToast();
  const initialFormData = {
    name: '',
    mobile_number: '',
    email: '',
    gender: '',
    purpose_of_visit: '',
    from_date: '',
    to_date: '',
    allowed_floor: '',
    allowed_towers: '',
    image_base64: '',

    // New fields
    visitor_type: 'guest',
    host_name: '',
    host_phone: '',
    is_recurring: false,
    expected_duration_hours: '',

    // Vehicle specific - RE MOVED to LPR Module
    // has_vehicle: false, ...

  };
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null); // 'visitor' or 'vehicle_front' etc.
  const [imagePreview, setImagePreview] = useState(null);
  const [showVisitorSlip, setShowVisitorSlip] = useState(false);
  const [checkedInVisitor, setCheckedInVisitor] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckedMobile, setLastCheckedMobile] = useState('');
  const [isUsingExistingImage, setIsUsingExistingImage] = useState(false);
  const [isExistingImageConfirmed, setIsExistingImageConfirmed] = useState(false);

  // Form validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Visitor name is required';
    }

    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile_number.trim())) {
      newErrors.mobile_number = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
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

    if (!formData.host_phone.trim()) {
      newErrors.host_phone = 'Host phone is required';
    }

    if (!formData.from_date) {
      newErrors.from_date = 'From date is required';
    }

    if (!formData.to_date) {
      newErrors.to_date = 'To date is required';
    }

    if (!formData.allowed_floor) {
      newErrors.allowed_floor = 'Please select allowed floor';
    }

    if (!formData.image_base64) {
      newErrors.image_base64 = 'Visitor photo is required';
    } else if (isUsingExistingImage && !isExistingImageConfirmed) {
      newErrors.image_base64 = 'Please confirm existing image or click retake';
    }

    setErrors(newErrors);
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
    const mobile = formData.mobile_number.trim();
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
          host_phone: visitor.host_phone || prev.host_phone,
          from_date: visitor.from_date || prev.from_date,
          to_date: visitor.to_date || prev.to_date,
          allowed_floor: visitor.allowed_floor || prev.allowed_floor,
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
  }, [formData.mobile_number, organizationId, lastCheckedMobile]);

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

      // Build API payload with only UI fields and user-entered values
      const sanitizedData = {
        name: formData.name,
        mobile_number: formData.mobile_number,
        email: formData.email,
        gender: formData.gender,
        purpose_of_visit: formData.purpose_of_visit,
        from_date: formData.from_date,
        to_date: formData.to_date || null,
        allowed_floor: formData.allowed_floor,
        allowed_towers: formData.allowed_towers,
        image_base64: formData.image_base64,
        visitor_type: formData.visitor_type,
        host_name: formData.host_name,
        host_phone: formData.host_phone,
        is_recurring: formData.is_recurring,
      };

      const response = await visitorService.createVisitor(organizationId, sanitizedData);

      success('Visitor check-in successful!');

      // Enroll visitor face using unified /api/v1/face/enroll endpoint
      try {
        await faceService.enrollFace(response.data.id, formData.image_base64);
      } catch (enrollmentError) {
        // Non-blocking error - visitor check-in still successful
      }

      // Store visitor data for slip generation
      setCheckedInVisitor({
        ...response.data,
        organization_name: organization?.name || 'Organization',
        check_in_time: new Date().toISOString(),
        visitor_image: formData.image_base64
      });

      // Show visitor slip modal
      setShowVisitorSlip(true);

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

      showError(`Check-in failed: ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Get unique floors from organization (assuming floors are available)
  const floors = ['Ground Floor', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-teal-50/95 rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          ✅ Visitor Check-In
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.mobile_number
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              />
              {errors.mobile_number && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.mobile_number}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visitor Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.name
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="visitor@example.com"
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.email
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.gender
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Visitor Type *
              </label>
              <select
                name="visitor_type"
                value={formData.visitor_type}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.visitor_type
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              >
                <option value="guest">👤 Guest</option>
                <option value="contractor">👷 Contractor</option>
                <option value="vendor">🏢 Vendor</option>
                <option value="interview_candidate">💼 Interview Candidate</option>
                <option value="delivery">📦 Delivery Personnel</option>
                <option value="service_provider">🔧 Service Provider</option>
                <option value="vip">👑 VIP</option>
              </select>
              {errors.visitor_type && (
                <p className="mt-1 text-sm text-red-600">{errors.visitor_type}</p>
              )}
            </div>
          </div>

          {/* Host Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Host Name *
              </label>
              <input
                type="text"
                name="host_name"
                value={formData.host_name}
                onChange={handleInputChange}
                placeholder="Person/Department to visit"
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.host_name
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              />
              {errors.host_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.host_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Host Phone *
              </label>
              <input
                type="tel"
                name="host_phone"
                value={formData.host_phone}
                onChange={handleInputChange}
                placeholder="Host contact number"
                required
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.host_phone
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              />
              {errors.host_phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.host_phone}
                </p>
              )}
            </div>
          </div>

          {/* Purpose of Visit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Purpose of Visit *
            </label>
            <input
              type="text"
              name="purpose_of_visit"
              value={formData.purpose_of_visit}
              onChange={handleInputChange}
              placeholder="e.g., Meeting, Delivery, Service"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.purpose_of_visit
                ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                : 'border-gray-300 focus:ring-teal-500'
                }`}
            />
            {errors.purpose_of_visit && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.purpose_of_visit}
              </p>
            )}
          </div>

          {/* Floor and Tower */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tower
              </label>
              <select
                name="allowed_towers"
                value={formData.allowed_towers || ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.allowed_towers
                  ? 'border-red-500 bg-red-50 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              >
                <option value="">Select a tower</option>
                <option value="Tower A">Tower A</option>
                <option value="Tower B">Tower B</option>
                <option value="Tower C">Tower C</option>
                <option value="Tower D">Tower D</option>
              </select>
              {errors.allowed_towers && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.allowed_towers}
                </p>
              )}
            </div>
            

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Allowed Floor *
              </label>
              <select
                name="allowed_floor"
                value={formData.allowed_floor}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.allowed_floor
                  ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                  : 'border-gray-300 focus:ring-teal-500'
                  }`}
              >
                <option value="">Select a floor</option>
                {floors.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor}
                  </option>
                ))}
              </select>
              {errors.allowed_floor && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.allowed_floor}
                </p>
              )}
            </div>


          </div>

          {/* Duration of Visit */}
          <div className="bg-teal-50 p-6 rounded-lg border-2 border-teal-200">
            <h4 className="font-semibold text-teal-900 mb-4">Duration of Visit</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From Date *
                </label>
                <input
                  type="date"
                  name="from_date"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.from_date
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                    : 'border-gray-300 focus:ring-teal-500'
                    }`}
                />
                {errors.from_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.from_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  To Date *
                </label>
                <input
                  type="date"
                  name="to_date"
                  value={formData.to_date}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${errors.to_date
                    ? 'border-red-500 bg-red-50 focus:ring-red-500 error-field'
                    : 'border-gray-300 focus:ring-teal-500'
                    }`}
                />
                {errors.to_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.to_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex flex-col gap-4 bg-teal-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_recurring"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_recurring: e.target.checked
                }))}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <label htmlFor="is_recurring" className="text-sm font-semibold text-gray-700 cursor-pointer">
                🔄 Mark as Recurring Visitor (for frequent visitors)
              </label>
            </div>
          </div>



          {/* Webcam Capture */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Visitor Photo *
            </label>

            {!showWebcam && !imagePreview && (
              <div className={`${errors.image_base64 ? 'error-field' : ''}`}>
                <button
                  type="button"
                  onClick={() => setShowWebcam(true)}
                  className={`w-full px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 mb-4 ${errors.image_base64
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-2 border-red-500'
                    : 'bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-700 hover:to-teal-700 text-white'
                    }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Capture Visitor Photo
                </button>
                {errors.image_base64 && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.image_base64}
                  </p>
                )}
              </div>
            )}

            {showWebcam && (
              <div className="mb-6">
                <WebcamCapture
                  onImageCapture={handleImageCapture}
                  onBack={handleCloseWebcam}
                />
              </div>
            )}

            {imagePreview && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-700 font-semibold text-lg">
                    {isUsingExistingImage ? 'Existing image loaded from previous visit' : 'Photo captured successfully!'}
                  </p>
                </div>
                <div className="relative inline-block w-full">
                  <img
                    src={imagePreview}
                    alt="Captured visitor"
                    className="w-full h-64 object-cover rounded-xl shadow-lg"
                  />
                  {isUsingExistingImage && !isExistingImageConfirmed ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <button
                        type="button"
                        onClick={handleConfirmExistingImage}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300"
                      >
                        Confirm Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRetakeImage}
                        className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all duration-300"
                      >
                        Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={isUsingExistingImage ? handleRetakeImage : handleClearImage}
                      className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retake Photo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className={`px-8 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg min-w-[200px] ${loading || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
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
                  ✅ Check In Visitor
                </>
              )}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Note:</span> The visitor photo will be stored for identification purposes only. Please ensure the visitor is clearly visible in the photo.
          </p>
        </div>
      </div >

      {/* Visitor Slip Modal */}
      {
        showVisitorSlip && checkedInVisitor && (
          <VisitorSlipModal
            visitor={checkedInVisitor}
            onClose={() => setShowVisitorSlip(false)}
            onPrint={() => {
              window.print();
              setShowVisitorSlip(false);
            }}
          />
        )
      }
    </div >
  );
};

// Visitor Slip Modal Component
const VisitorSlipModal = ({ visitor, onClose, onPrint }) => {
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateVisitorId = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.getTime().toString().slice(-6);
    return `V${dateStr}${timeStr}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-teal-50/95 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            🎫 Visitor Pass Generated
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Visitor Slip Content */}
        <div id="visitor-slip" className="p-6">
          {/* Organization Header */}
          <div className="text-center border-b-2 border-teal-200 pb-4 mb-4">
            <h2 className="text-2xl font-bold text-teal-800">{visitor.organization_name}</h2>
            <p className="text-teal-600 font-semibold">VISITOR PASS</p>
            <p className="text-xs text-gray-600 mt-1">ID: {generateVisitorId()}</p>
          </div>

          {/* Visitor Photo */}
          <div className="flex justify-center mb-4">
            {visitor.visitor_image ? (
              <img
                src={visitor.visitor_image}
                alt="Visitor"
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Photo</span>
              </div>
            )}
          </div>

          {/* Visitor Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Name:</span>
              <span className="text-gray-900 font-bold">{visitor.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Mobile:</span>
              <span className="text-gray-900">{visitor.mobile_number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Purpose:</span>
              <span className="text-gray-900">{visitor.purpose_of_visit}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Allowed Floor:</span>
              <span className="text-green-700 font-bold">{visitor.allowed_floor}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-700">Check-in Time:</span>
              <span className="text-gray-900">{formatDateTime(visitor.check_in_time)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-gray-700">Valid Until:</span>
              <span className="text-red-600 font-bold">End of Day</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-semibold mb-2">📋 INSTRUCTIONS:</p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Keep this pass visible at all times</li>
              <li>• Only access authorized floors</li>
              <li>• Return pass when leaving</li>
              <li>• Contact security for assistance</li>
            </ul>
          </div>

          {/* Security Warning */}
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-xs text-red-800 font-bold">
              ⚠️ UNAUTHORIZED ACCESS PROHIBITED
            </p>
            <p className="text-xs text-red-600">
              This pass must be surrendered upon exit
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onPrint}
            className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            🖨️ Print Visitor Pass
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-teal-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            📋 Done
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #visitor-slip, #visitor-slip * {
            visibility: visible;
          }
          #visitor-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 400px;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .fixed {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VisitorEntryForm;
