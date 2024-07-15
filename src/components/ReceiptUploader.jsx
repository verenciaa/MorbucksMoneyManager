// src/components/ReceiptUploader.jsx
import React, { useState } from 'react';
import { processReceipt } from '../helpers';

const ReceiptUploader = () => {
  const [receiptText, setReceiptText] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const text = await processReceipt(file);
    setReceiptText(text);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <pre>{receiptText}</pre>
    </div>
  );
};

export default ReceiptUploader;
