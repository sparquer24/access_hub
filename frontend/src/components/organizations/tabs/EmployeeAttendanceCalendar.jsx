import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import moment from 'moment';
import { Brain, Sparkles } from 'lucide-react';
import { attendanceService } from '../../../services/organizationsService';
import Loader from '../../common/Loader';
import { useToast } from '../../../contexts/ToastContext';

const { Option } = Select;

const EmployeeAttendanceCalendar = ({
    employees = [],
    selectedEmployeeId = null,
    calendarRef = null,
    viewMode = 'admin', // 'admin' | 'employee' | 'manager'
    currentEmployee = null, // Optional: Pass full employee object if available, useful for employee view
    organizationId = null
}) => {
    const { error: showError } = useToast();
    const [selectedEmployee, setSelectedEmployee] = useState(selectedEmployeeId);
    const [selectedMonth, setSelectedMonth] = useState(moment());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState(currentEmployee);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        leave: 0,
        late: 0,
        avgHours: 0
    });

    // Update selected employee when prop changes
    useEffect(() => {
        if (selectedEmployeeId) {
            setSelectedEmployee(selectedEmployeeId);
        }
    }, [selectedEmployeeId]);

    // Auto-select first employee if none selected and employees are available
    useEffect(() => {
        if (!selectedEmployee && !selectedEmployeeId && employees.length > 0 && viewMode !== 'employee') {
            setSelectedEmployee(employees[0].id);
        }
    }, [employees, selectedEmployee, selectedEmployeeId, viewMode]);

    // Update employee details when selected employee changes
    useEffect(() => {
        if (selectedEmployee) {
            if (employees.length > 0) {
                const emp = employees.find(e => e.id === selectedEmployee);
                setEmployeeDetails(emp);
            } else if (currentEmployee && currentEmployee.id === selectedEmployee) {
                setEmployeeDetails(currentEmployee);
            }
            // If we don't have details in props, we might need to fetch them, 
            // but for now we'll assume they are provided or we just show "Employee"
        }
    }, [selectedEmployee, employees, currentEmployee]);

    useEffect(() => {
        if (selectedEmployee) {
            fetchAttendanceData();
        }
    }, [selectedEmployee, selectedMonth]);

    const fetchAttendanceData = async () => {
        if (!selectedEmployee) return;

        setLoading(true);
        try {
            const startDate = selectedMonth.clone().startOf('month').format('YYYY-MM-DD');
            const endDate = selectedMonth.clone().endOf('month').format('YYYY-MM-DD');

            const response = await attendanceService.list({
                organization_id: organizationId,
                employee_id: selectedEmployee,
                start_date: startDate,
                end_date: endDate,
                per_page: 100
            });

            const records = response.data?.items || [];
            setAttendanceData(records);
            calculateStats(records);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            showError('Failed to fetch attendance data');
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (records) => {
        let present = 0;
        let absent = 0;
        let leave = 0;
        let late = 0;
        let totalHours = 0;
        let hoursCount = 0;

        records.forEach(record => {
            if (record.status === 'present') {
                present++;
                const checkInTime = moment(record.check_in_time);
                if (checkInTime.hour() > 9 || (checkInTime.hour() === 9 && checkInTime.minute() > 15)) {
                    late++;
                }
                if (record.work_hours) {
                    totalHours += record.work_hours;
                    hoursCount++;
                }
            } else if (record.status === 'absent') {
                absent++;
            } else if (record.status === 'on_leave') {
                leave++;
            }
        });

        setStats({
            present,
            absent,
            leave,
            late,
            avgHours: hoursCount > 0 ? (totalHours / hoursCount).toFixed(1) : 0
        });
    };

    const getAttendanceForDate = (date) => {
        const dateStr = date.format('YYYY-MM-DD');
        return attendanceData.find(record => moment(record.date).format('YYYY-MM-DD') === dateStr);
    };

    const getDayStatus = (date) => {
        const record = getAttendanceForDate(date);
        if (!record) return 'no-data';

        if (record.status === 'present') {
            const checkInTime = moment(record.check_in_time);
            if (checkInTime.hour() > 9 || (checkInTime.hour() === 9 && checkInTime.minute() > 15)) {
                return 'late';
            }
            return 'present';
        }

        if (record.status === 'absent') return 'absent';
        if (record.status === 'on_leave') return 'leave';
        return 'no-data';
    };

    const getDayColor = (status) => {
        switch (status) {
            case 'present': return 'bg-green-100 border-green-400 text-green-800';
            case 'late': return 'bg-orange-100 border-orange-400 text-orange-800';
            case 'absent': return 'bg-red-100 border-red-400 text-red-800';
            case 'leave': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
            default: return 'bg-teal-50 border-gray-200 text-gray-400';
        }
    };

    const renderCalendar = () => {
        const startOfMonth = selectedMonth.clone().startOf('month');
        const endOfMonth = selectedMonth.clone().endOf('month');
        const startDate = startOfMonth.clone().startOf('week');
        const endDate = endOfMonth.clone().endOf('week');

        const calendar = [];
        const day = startDate.clone();

        while (day.isBefore(endDate, 'day')) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                const currentDay = day.clone();
                const isCurrentMonth = currentDay.month() === selectedMonth.month();
                const isFuture = currentDay.isAfter(moment(), 'day');
                const status = isCurrentMonth && !isFuture ? getDayStatus(currentDay) : 'no-data';
                const record = getAttendanceForDate(currentDay);

                week.push(
                    <div
                        key={currentDay.format('YYYY-MM-DD')}
                        className={`min-h-[5rem] h-20 p-1 border ${getDayColor(status)} ${!isCurrentMonth ? 'opacity-30' : ''
                            } ${isFuture ? 'opacity-20' : ''} transition-all hover:shadow-md relative group text-xs`}
                    >
                        <div className="font-bold text-[10px] absolute top-0.5 left-0.5">{currentDay.format('D')}</div>
                        {record && isCurrentMonth && !isFuture && (
                            <div className="text-[10px] mt-3 leading-tight text-center">
                                {record.work_hours ? (
                                    <div className="font-semibold">{record.work_hours}h</div>
                                ) : (
                                    <div>{record.status === 'present' ? 'P' : record.status === 'absent' ? 'A' : 'L'}</div>
                                )}
                            </div>
                        )}

                        {/* Tooltip */}
                        {record && isCurrentMonth && !isFuture && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                    <div className="font-bold mb-1">{currentDay.format('MMM D, YYYY')}</div>
                                    <div>Status: {record.status.replace('_', ' ').toUpperCase()}</div>
                                    {record.check_in_time && (
                                        <div>Check-in: {moment(record.check_in_time).format('HH:mm A')}</div>
                                    )}
                                    {record.check_out_time && (
                                        <div>Check-out: {moment(record.check_out_time).format('HH:mm A')}</div>
                                    )}
                                    {record.work_hours && (
                                        <div>Hours: {record.work_hours}h</div>
                                    )}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            </div>
                        )}
                    </div>
                );
                day.add(1, 'day');
            }
            calendar.push(
                <div key={day.format('YYYY-MM-DD')} className="grid grid-cols-7 gap-1 h-full">
                    {week}
                </div>
            );
        }

        return calendar;
    };

    return (
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-310px)] pb-16">
            {/* Controls */}
            <div className="flex gap-3 items-center justify-end bg-teal-50 p-2 rounded-lg border border-gray-200">
                {viewMode !== 'employee' && (
                    <div className="w-80">
                        <Select
                            showSearch
                            placeholder="Choose Employee"
                            className="w-full text-sm"
                            size="small"
                            onChange={setSelectedEmployee}
                            value={selectedEmployee}
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {employees.map(emp => (
                                <Option key={emp.id} value={emp.id}>
                                    {emp.full_name} ({emp.employee_code})
                                </Option>
                            ))}
                        </Select>
                    </div>
                )}

                <div className="w-48">
                    <Select
                        className="w-full text-sm"
                        size="small"
                        value={selectedMonth.format('YYYY-MM')}
                        onChange={(value) => setSelectedMonth(moment(value, 'YYYY-MM'))}
                        placeholder="Choose Month"
                    >
                        {Array.from({ length: 12 }, (_, i) => {
                            const month = moment().subtract(i, 'months');
                            return (
                                <Option key={month.format('YYYY-MM')} value={month.format('YYYY-MM')}>
                                    {month.format('MMMM YYYY')}
                                </Option>
                            );
                        })}
                    </Select>
                </div>
            </div>

            {!selectedEmployee ? (
                <div className="text-center py-12 bg-teal-50 rounded-xl">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Employee</h3>
                    <p className="text-gray-600">Choose an employee to view their attendance calendar</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-12 min-h-[300px]">
                    <Loader type="ai" size="large" text="Analyzing Attendance Pattern..." />
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Column: Stats (1/3 width) */}
                    <div className="w-full lg:w-1/3 space-y-4">

                        {/* AI Analysis Card - Professional Redesign (Teal/Cyan Theme)
                        <div className="bg-gradient-to-br from-teal-900 to-slate-900 rounded-xl p-5 shadow-xl text-white relative overflow-hidden border border-teal-500/30 group">
                            {/* Abstract Background Shapes }
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-colors duration-700"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl group-hover:bg-teal-500/30 transition-colors duration-700"></div>

                            <div className="flex items-center gap-3 mb-4 relative z-10 border-b border-white/10 pb-3">
                                <div className="p-2 bg-teal-500/20 rounded-lg backdrop-blur-md shadow-inner ring-1 ring-teal-500/40">
                                    <Brain className="w-5 h-5 text-cyan-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-base tracking-tight text-white">AI Attendance Insights</h4>
                                    <p className="text-[10px] text-teal-300 font-medium uppercase tracking-wider">Live Pattern Analysis</p>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-start gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-cyan-300 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider mb-1">Observation</p>
                                            <p className="text-xs leading-relaxed text-slate-200 font-light">
                                                {stats.present > 15 ?
                                                    "Excellent consistency detected. Employee demonstrates high reliability." :
                                                    stats.late > 3 ?
                                                        "Recurring late arrival pattern detected on Monday mornings." :
                                                        "Standard attendance pattern with normal variance."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-teal-200 font-medium">Punctuality Score</span>
                                        <span className="font-bold text-white bg-teal-600/40 px-2 py-0.5 rounded text-[10px] border border-teal-500/30">
                                            {stats.present > 0 ? Math.round(((stats.present - stats.late) / stats.present) * 100) : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-teal-400 to-cyan-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(45,212,191,0.3)]"
                                            style={{ width: `${stats.present > 0 ? Math.round(((stats.present - stats.late) / stats.present) * 100) : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div> */}

                        <div className="bg-teal-50/95 rounded-lg border border-gray-200 p-4 shadow-sm">
                            <h4 className="font-bold text-gray-800 text-sm mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                                Monthly Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded bg-green-50 border border-green-100 text-center">
                                    <div className="w-8 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Present</div>
                                    <div className="text-xl font-bold text-gray-900">{stats.present}</div>
                                    <div className="text-xs text-gray-400">days</div>
                                </div>

                                <div className="p-3 rounded bg-orange-50 border border-orange-100 text-center">
                                    <div className="w-8 h-2 bg-orange-500 rounded-full mx-auto mb-2"></div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Late Arrivals</div>
                                    <div className="text-xl font-bold text-gray-900">{stats.late}</div>
                                    <div className="text-xs text-gray-400">days</div>
                                </div>

                                <div className="p-3 rounded bg-red-50 border border-red-100 text-center">
                                    <div className="w-8 h-2 bg-red-500 rounded-full mx-auto mb-2"></div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Absent</div>
                                    <div className="text-xl font-bold text-gray-900">{stats.absent}</div>
                                    <div className="text-xs text-gray-400">days</div>
                                </div>

                                <div className="p-3 rounded bg-yellow-50 border border-yellow-100 text-center">
                                    <div className="w-8 h-2 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">On Leave</div>
                                    <div className="text-xl font-bold text-gray-900">{stats.leave}</div>
                                    <div className="text-xs text-gray-400">days</div>
                                </div>
                            </div>
                            
                            {/* Avg Hours as separate full-width item below grid */}
                            <div className="mt-3 p-3 rounded bg-blue-50 border border-blue-100 text-center">
                                <div className="w-8 h-2 bg-blue-500 rounded-full mx-auto mb-2"></div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Avg. Hours</div>
                                <div className="text-xl font-bold text-gray-900">{stats.avgHours}<span className="text-sm">h</span></div>
                                <div className="text-xs text-gray-400">/day</div>
                            </div>
                        </div>


                    </div>

                    {/* Right Column: Calendar (2/3 width) */}
                    <div className="w-full lg:w-2/3">
                        <div className="bg-teal-50/95 rounded-lg shadow-sm overflow-hidden border border-gray-200">
                            <div className="bg-teal-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-gray-700 font-bold text-sm">
                                    {selectedMonth.format('MMMM YYYY')}
                                </h3>
                                {employeeDetails && (
                                    <span className="text-xs text-gray-500 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">
                                        {employeeDetails.full_name}
                                    </span>
                                )}
                            </div>

                            <div className="p-2 min-h-[450px] pb-4">
                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center font-bold text-[10px] text-gray-500 py-0.5 uppercase tracking-wide">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                {renderCalendar()}
                            </div>

                            {/* Legend - Below Calendar */}
                            <div className="bg-teal-50 px-3 py-2 border-t border-gray-200 flex flex-wrap gap-4 items-center">
                                <span className="font-bold text-gray-700 text-[10px] uppercase tracking-wider">Legend:</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-green-100 border border-green-400 rounded-sm"></div>
                                    <span className="text-[10px] font-medium text-gray-600">Present</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-orange-100 border border-orange-400 rounded-sm"></div>
                                    <span className="text-[10px] font-medium text-gray-600">Late Arrival</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-red-100 border border-red-400 rounded-sm"></div>
                                    <span className="text-[10px] font-medium text-gray-600">Absent</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-yellow-100 border border-yellow-400 rounded-sm"></div>
                                    <span className="text-[10px] font-medium text-gray-600">On Leave</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeAttendanceCalendar;
