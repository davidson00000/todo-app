import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
    name: string;
    progress: number;
    color: string;
}

interface ProjectChartProps {
    data: ChartData[];
    onBarClick?: (projectName: string) => void;
}

export const ProjectChart: React.FC<ProjectChartProps> = ({ data, onBarClick }) => {


    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[350px] transition-colors">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Progress</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current completion status by project</p>
            </div>
            <div className="h-[300px] md:h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            width={110}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        {/* Invisible bar for click detection on 0% progress */}
                        <Bar
                            dataKey="progress"
                            barSize={32}
                            minPointSize={100}
                            fill="transparent"
                            onClick={(data) => {
                                if (onBarClick && data && data.name) {
                                    onBarClick(data.name);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        />
                        {/* Visible bar */}
                        <Bar
                            dataKey="progress"
                            radius={[0, 4, 4, 0]}
                            barSize={32}
                            background={{ fill: '#f3f4f6', radius: 4 }}
                            onClick={(data) => {
                                if (onBarClick && data && data.name) {
                                    onBarClick(data.name);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    style={{ cursor: 'pointer' }}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
