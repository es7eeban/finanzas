import React from 'react';
import { Card } from '../../../components/common/Card';

export const DashboardKpiSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-7 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </Card>
      ))}
    </div>
  );
};

export const DashboardChartsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      {/* Donut Chart Skeleton */}
      <Card className="lg:col-span-5 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="w-48 h-48 rounded-full border-12 border-slate-200 dark:border-slate-800" />
        </div>
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </Card>

      {/* Bar Chart Skeleton */}
      <Card className="lg:col-span-7 p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-end justify-around p-4 gap-2">
          {[40, 65, 80, 50, 90, 75].map((h, i) => (
            <div key={i} className="w-10 bg-slate-200 dark:bg-slate-700 rounded-t-lg" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-center gap-6 pt-2">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      </Card>
    </div>
  );
};
