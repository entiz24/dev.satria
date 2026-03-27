export const getRiskLevelColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical':
      return 'bg-red-500/10 text-red-500 border border-red-500/20';
    case 'high':
      return 'bg-red-500/10 text-red-500 border border-red-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    case 'low':
      return 'bg-green-500/10 text-green-500 border border-green-500/20';
    default:
      return 'bg-white/5 text-muted-foreground border border-white/10';
  }
};

export const formatCurrency = (amount, currency = 'IDR') => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export const getRoleDisplayName = (role) => {
  const roleNames = {
    admin: 'Administrator',
    analyst: 'Analyst',
    regulator: 'Regulator',
    auditor: 'Auditor',
  };
  return roleNames[role] || role;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
