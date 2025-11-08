"use client"; // ضروري في Next.js 13+ لاستخدام hooks مثل useState

import { useState } from 'react';
import axios from 'axios';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('الرجاء اختيار ملف أولاً.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    try {
      // عنوان URL الخاص بالواجهة الخلفية
      const response = await axios.post('http://192.186.220.122:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(response.data.message); // عرض رسالة النجاح من السيرفر
    } catch (error) {
      setMessage('فشل رفع الملف. تأكد من أن السيرفر يعمل.');
      console.error('خطأ في الرفع:', error);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '500px', margin: 'auto' }}>
      <h1>اختبار رفع الملفات</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="description">وصف الملف:</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
            required
          />
        </div>
        <div>
          <label htmlFor="file">اختر الملف:</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '8px', marginBottom: '20px' }}
            required
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>
          رفع الملف
        </button>
      </form>
      {message && <p style={{ marginTop: '20px', color: 'green' }}>{message}</p>}
    </div>
  );
}