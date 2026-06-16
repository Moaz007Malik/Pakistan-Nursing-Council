const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const generateRegistrationNumber = (prefix, sequence) => {
  const year = new Date().getFullYear();
  const seq = String(sequence).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
};

const generateInvoiceNumber = () => {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `INV-${ymd}-${uuidv4().slice(0, 8).toUpperCase()}`;
};

const generateResolutionNumber = (sequence) => {
  const year = new Date().getFullYear();
  return `RES/${year}/${String(sequence).padStart(4, '0')}`;
};

const generateQRCode = async (data) => {
  return QRCode.toDataURL(JSON.stringify(data), {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
  });
};

module.exports = {
  generateRegistrationNumber,
  generateInvoiceNumber,
  generateResolutionNumber,
  generateQRCode,
};
