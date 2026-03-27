export const getRiskLevelColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'critical':
      return 'bg-[#E63946] text-white';
    case 'high':
      return 'bg-[#FFB703] text-black';
    case 'medium':
      return 'bg-[#0A0A0A] text-white';
    case 'low':
      return 'bg-[#2A9D8F] text-white';
    default:
      return 'bg-gray-200 text-black';
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
