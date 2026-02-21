import React, { useState, useEffect } from 'react';
import { organizationsService } from '../../../services/organizationsService';
import { Trophy, Zap, Users, Award } from 'lucide-react';
import Loader from '../../common/Loader';

const TopPerformers = ({ organizationId }) => {
    const [data, setData] = useState({
        punctual_employees: [],
        low_leave_employees: [],
        month: new Date().toISOString().slice(0, 7),
        total_employees: 0
    });
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchTopPerformers();
    }, [organizationId, selectedMonth]);

    const fetchTopPerformers = async () => {
        try {
            setLoading(true);
            const response = await organizationsService.getTopPerformers(organizationId, {
                month: selectedMonth,
                limit: 10
            });
            setData(response.data);
        } catch (error) {
            console.error('Error fetching top performers:', error);
            setData({
                punctual_employees: [],
                low_leave_employees: [],
                month: selectedMonth,
                total_employees: 0
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader size="large" />
                    <p className="text-slate-600 font-semibold">Loading top performers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Empty - All sections removed as requested */}
            <div className="text-center py-12">
                <p className="text-gray-600">No additional data to display</p>
            </div>
        </div>
    );
};

export default TopPerformers;
