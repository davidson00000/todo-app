import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
    date: string;
    ideal: number;
    actual: number;
}

interface ProjectChartProps {
    data: ChartData[];
    title?: string;
}

export const ProjectChart: React.FC<ProjectChartProps> = ({ data, title = "Project Burn-down" }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[350px] transition-colors">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remaining tasks over time</p>
            </div>
            <div className="h-[300px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#e5e7eb' }}
                            labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="ideal"
                            stroke="#9ca3af"
                            strokeDasharray="5 5"
                            fill="none"
                            strokeWidth={2}
                            name="Ideal"
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#06b6d4"
                            fillOpacity={1}
                            fill="url(#colorActual)"
                            strokeWidth={3}
                            name="Remaining"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
