import React, { useState, useEffect } from 'react';
import { visitorService } from '../../../services/visitorService';
import { useToast } from '../../../contexts/ToastContext';
import { Clock, User, Building, MapPin, Phone, Mail, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Loader from '../../common/Loader';
import moment from 'moment';

const VisitorHistoryDetail = ({ organizationId, visitorId, visitorName, onClose }) => {
  const { error: showError } = useToast();
  const [history, setHistory] = useState(null);
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVisit, setExpandedVisit] = useState(null);

  useEffect(() => {
    fetchVisitorHistory();
  }, [organizationId, visitorId]);

  const fetchVisitorHistory = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching visitor history:', { organizationId, visitorId });

      const response = await visitorService.getVisitorHistoryNew(
        organizationId,
        visitorId
      );

      if (response.success) {
        setVisitor(response.data.visitor);
        setHistory(response.data.history);
        console.log('✅ History loaded:', { visits: response.data.total_visits });
      } else {
        showError(response.message || 'Failed to fetch visitor history');
      }
    } catch (error) {
      console.error('❌ Failed to fetch history:', error);
      showError(
        error.response?.data?.message || 'Failed to load visitor history'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen={false} text="Loading visitor history..." />;
  }

  if (!visitor || !history) {
    return (
      <div className="p-6 text-center bg-slate-50 rounded-lg">
        <p className="text-slate-600">No visitor history available</p>
      </div>
    );
  }

  const calculateDuration = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return 'Ongoing';
    
    const start = moment(checkInTime);
    const end = moment(checkOutTime);
    const duration = end.diff(start, 'minutes');
    
    if (duration < 60) {
      return `${duration} minutes`;
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const getVisitStatus = (visit) => {
    if (visit.check_out_time) {
      return { label: 'Completed', color: 'green' };
    } else if (visit.is_checked_in) {
      return { label: 'Checked In', color: 'blue' };
    } else {
      return { label: 'No Show', color: 'gray' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Visitor Info Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-600 text-sm font-medium flex items-center gap-1">
              <User className="w-4 h-4" /> Name
            </p>
            <p className="text-slate-900 font-semibold mt-1">{visitor.name}</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm font-medium flex items-center gap-1">
              <Phone className="w-4 h-4" /> Phone
            </p>
            <p className="text-slate-900 font-semibold mt-1">{visitor.phone}</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm font-medium flex items-center gap-1">
              <Mail className="w-4 h-4" /> Email
            </p>
            <p className="text-slate-900 text-sm mt-1 truncate">{visitor.email}</p>
          </div>
          <div>
            <p className="text-slate-600 text-sm font-medium">Gender</p>
            <p className="text-slate-900 font-semibold mt-1">{visitor.gender || '-'}</p>
          </div>
        </div>
      </div>

      {/* Visit History */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Visit History ({history.length} visits)
        </h3>

        {history.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg">
            <p className="text-slate-600">No visits recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((visit, index) => {
              const isExpanded = expandedVisit === index;
              const status = getVisitStatus(visit);
              const statusColor = {
                green: 'bg-green-50 border-green-200',
                blue: 'bg-blue-50 border-blue-200',
                gray: 'bg-gray-50 border-gray-200',
              }[status.color];

              const statusBadgeColor = {
                green: 'bg-green-100 text-green-700',
                blue: 'bg-blue-100 text-blue-700',
                gray: 'bg-gray-100 text-gray-700',
              }[status.color];

              return (
                <div
                  key={visit.id}
                  className={`border rounded-lg overflow-hidden transition-all ${statusColor}`}
                >
                  {/* Summary */}
                  <button
                    onClick={() =>
                      setExpandedVisit(isExpanded ? null : index)
                    }
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-opacity-60 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div>
                        <p className="font-semibold text-slate-900 flex items-center gap-2">
                          Visit #{history.length - index}
                          <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeColor}`}>
                            {status.label}
                          </span>
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {visit.purpose_of_visit}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {moment(visit.check_in_time).format('DD MMM YYYY, HH:mm')} -{' '}
                          {visit.check_out_time
                            ? moment(visit.check_out_time).format('HH:mm')
                            : 'Still checked in'}
                          {' '}({calculateDuration(visit.check_in_time, visit.check_out_time)})
                        </p>
                      </div>
                    </div>

                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-current border-opacity-20 px-4 py-4 bg-white bg-opacity-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Visit Type */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">
                            Visit Type
                          </p>
                          <p className="text-sm text-slate-900 mt-1 capitalize">
                            {visit.visitor_type}
                          </p>
                        </div>

                        {/* Host */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">
                            Host
                          </p>
                          <p className="text-sm text-slate-900 mt-1">
                            {visit.host_name}
                          </p>
                          {visit.host_number && (
                            <p className="text-xs text-slate-500">{visit.host_number}</p>
                          )}
                        </div>

                        {/* Purpose */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">
                            Purpose
                          </p>
                          <p className="text-sm text-slate-900 mt-1">
                            {visit.purpose_of_visit}
                          </p>
                        </div>

                        {/* Floor Access */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">
                            Allowed Floor
                          </p>
                          <p className="text-sm text-slate-900 mt-1">
                            {visit.allowed_floor}
                          </p>
                        </div>

                        {/* Tower */}
                        {visit.allowed_tower && (
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase">
                              Tower
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {visit.allowed_tower}
                            </p>
                          </div>
                        )}

                        {/* Duration */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase">
                            Duration
                          </p>
                          <p className="text-sm text-slate-900 mt-1">
                            {calculateDuration(visit.check_in_time, visit.check_out_time)}
                          </p>
                        </div>

                        {/* Check-in Time */}
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Check-in
                          </p>
                          <p className="text-sm text-slate-900 mt-1">
                            {moment(visit.check_in_time).format('DD MMM YYYY')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {moment(visit.check_in_time).format('HH:mm:ss')}
                          </p>
                        </div>

                        {/* Check-out Time */}
                        {visit.check_out_time && (
                          <div className="col-span-2 md:col-span-1">
                            <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Check-out
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {moment(visit.check_out_time).format('DD MMM YYYY')}
                            </p>
                            <p className="text-xs text-slate-500">
                              {moment(visit.check_out_time).format('HH:mm:ss')}
                            </p>
                          </div>
                        )}

                        {/* Current Floor */}
                        {visit.current_floor && (
                          <div className="col-span-2 md:col-span-1">
                            <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Current Floor
                            </p>
                            <p className="text-sm text-slate-900 mt-1">
                              {visit.current_floor}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 transition-colors"
        >
          Close
        </button>
        <button
          onClick={fetchVisitorHistory}
          className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default VisitorHistoryDetail;
