"use client";

import { useState } from 'react';
import axios from 'axios';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // إعادة تعيين الرسائل والتقدم عند اختيار ملف جديد
    setMessage('');
    setStatus('');
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('الرجاء اختيار ملف أولاً.');
      setStatus('error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);

    // ✨ تأكد من أن هذا هو عنوان IP الثابت الصحيح لجهازك ✨
    const API_URL = 'http://192.186.220.63:3001/upload';

    try {
      // بدء عملية الرفع وتعيين التقدم إلى 0 (لكن ليس 0 تماماً ليبدأ الشريط بالظهور)
      setUploadProgress(1);

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      setMessage(response.data.message);
      setStatus('success');
      setFile(null);
      setDescription('');
      document.getElementById('file-input').value = null;

      // إخفاء شريط التقدم بعد فترة قصيرة من النجاح
      setTimeout(() => {
        setUploadProgress(0);
      }, 1500);

    } catch (error) {
      if (error.response && error.response.status === 413) {
        setMessage(error.response.data || 'حجم الملف يتجاوز الحد المسموح به.');
      } else if (error.code === "ERR_NETWORK") {
        setMessage('خطأ في الشبكة. لا يمكن الوصول للسيرفر. تأكد من أن السيرفر يعمل وأن عنوان IP صحيح.');
      } else {
        setMessage('فشل رفع الملف. حدث خطأ في السيرفر.');
      }
      setStatus('error');
      console.error('خطأ في الرفع:', error);
      
      // إخفاء شريط التقدم عند حدوث خطأ
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            نظام أرشفة الملفات
          </h1>
          <p className="text-gray-500 mt-2">ارفع ملفاتك وقم بتوصيفها بسهولة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              وصف الملف
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="مثال: فيديو اجتماع المشروع"
              required
            />
          </div>
          
          <div>
            <label htmlFor="file-input" className="block text-sm font-semibold text-gray-700 mb-2">
              اختر الملف (فيديو أو أي ملف آخر)
            </label>
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              required
            />
          </div>
          
          {/* شريط التقدم */}
          {uploadProgress > 0 && (
            <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-150 ease-linear"
                    style={{ width: `${uploadProgress}%` }}
                ></div>
                </div>
                <p className="text-center text-xs font-medium text-gray-600">{`%${uploadProgress}`}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploadProgress > 0 && uploadProgress < 100}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploadProgress > 0 && uploadProgress < 100 ? 'جاري الرفع...' : 'رفع وحفظ الملف'}
          </button>
        </form>

        {/* رسائل الحالة */}
        {message && (
            <div
                className={`mt-6 text-center p-3 rounded-lg text-sm font-medium ${
                status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
            >
                {message}
            </div>
        )}
      </div>
    </main>
  );
}