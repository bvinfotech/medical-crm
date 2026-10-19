import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 
    | 'primary' 
    | 'success' 
    | 'warning' 
    | 'danger' 
    | 'info' 
    | 'neutral' 
    | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${variantStyles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const s = status.toLowerCase();
  if (['won', 'awarded', 'active', 'paid', 'accepted', 'compliant', 'in stock', 'resolved', 'present', 'valid'].includes(s)) {
    return 'success';
  }
  if (['lost', 'disqualified', 'cancelled', 'rejected', 'forfeited', 'out of stock', 'absent', 'expired'].includes(s)) {
    return 'danger';
  }
  if (['expiring soon', 'refund requested', 'low stock', 'negotiation', 'under review', 'documents pending', 'half-day', 'rework required', 'unpaid', 'partially paid'].includes(s)) {
    return 'warning';
  }
  if (['quotation sent', 'qualified', 'bid submitted', 'l1', 'financial evaluation', 'on-duty', 'in transit'].includes(s)) {
    return 'primary';
  }
  if (['new', 'draft', 'pending', 'identified'].includes(s)) {
    return 'info';
  }
  return 'neutral';
}
