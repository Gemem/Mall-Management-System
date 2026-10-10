import React from 'react';

export const OccupancyBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'OCCUPIED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Occupied</span>;
    case 'VACANT':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">Vacant</span>;
    case 'RESERVED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Reserved</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
  }
};

export const OperationalBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">● Open</span>;
    case 'TEMPORARILY_CLOSED':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300">▲ Closed (Temp)</span>;
    case 'UNDER_MAINTENANCE':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-300">⚙ Maintenance</span>;
    case 'SUSPENDED':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-300">✕ Suspended</span>;
    case 'NOT_YET_OPENED':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-300">⏳ Opening Soon</span>;
    case 'NOT_APPLICABLE':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">— N/A</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
  }
};

export const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'PAID':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">PAID</span>;
    case 'PARTIALLY_PAID':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">PARTIAL</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">OVERDUE</span>;
    case 'DUE_TODAY':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">DUE TODAY</span>;
    case 'UPCOMING':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">UPCOMING</span>;
    case 'VOID':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">VOID</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
  }
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  switch (priority) {
    case 'URGENT':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-extrabold bg-rose-600 text-white shadow-sm">URGENT</span>;
    case 'HIGH':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-white">HIGH</span>;
    case 'MEDIUM':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">MEDIUM</span>;
    case 'LOW':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{priority}</span>;
  }
};

export const MaintenanceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Open</span>;
    case 'ASSIGNED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">Assigned</span>;
    case 'IN_PROGRESS':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">In Progress</span>;
    case 'WAITING':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Waiting</span>;
    case 'RESOLVED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Resolved</span>;
    case 'CLOSED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Closed</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
  }
};
