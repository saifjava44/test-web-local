"use client";

import { useState, useRef } from 'react';
import * as tus from 'tus-js-client';

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const tusUploadRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setStatus('');
      setUploadProgress(0);
    }
  };

  const startUpload = () => {
    if (!file) {
      setMessage('الرجاء اختيار ملف أولاً.');
      setStatus('error');
      return;
    }

    const upload = new tus.Upload(file, {
        // ✨ تأكد من أن هذا هو عنوان IP الثابت الصحيح + المسار الجديد
        endpoint: "http://192.168.0.103:3001/files/",
        retryDelays: [0, 3000, 5000, 10000, 20000], // محاولة إعادة الاتصال عند الفشل
        metadata: {
            filename: file.name,
            filetype: file.type,
            description: description || "N/A", // إرسال الوصف مع بيانات الملف
        },
        onError: function (error) {
            console.error("فشل الرفع:", error);
            setMessage(`فشل الرفع: ${error}`);
            setStatus('error');
            setIsUploading(false);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
            const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
            setUploadProgress(Number(percentage));
        },
        onSuccess: function () {
            console.log("اكتمل الرفع بنجاح لملف:", upload.file.name);
            setMessage(`تم رفع الملف "${upload.file.name}" بنجاح!`);
            setStatus('success');
            setIsUploading(false);
            // إعادة تعيين الحقول
            setFile(null);
            setDescription('');
            document.getElementById('file-input').value = null;
            setTimeout(() => setUploadProgress(0), 2000);
        }
    });

    tusUploadRef.current = upload;
    setIsUploading(true);
    setIsPaused(false);
    setMessage('');
    upload.start();
  };

  const pauseUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort(false);
      setIsPaused(true);
      setMessage('تم إيقاف الرفع مؤقتاً.');
      setStatus('warning');
    }
  };

  const resumeUpload = () => {
    if (tusUploadRef.current) {
      setIsPaused(false);
      setMessage('جاري الاستئناف...');
      tusUploadRef.current.start();
    }
  };

  const cancelUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort(true);
      setIsUploading(false);
      setIsPaused(false);
      setUploadProgress(0);
      setMessage('تم إلغاء الرفع.');
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ⚡ نظام رفع الملفات
          </h1>
          <p className="text-gray-600">يدعم الملفات الكبيرة مع الاستئناف</p>
        </div>

        <div className="space-y-6">
          {/* وصف الملف */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              وصف الملف
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100"
              placeholder="مثال: فيديو المشروع"
            />
          </div>
          
          {/* اختيار الملف */}
          <div>
            <label htmlFor="file-input" className="block text-sm font-semibold text-gray-700 mb-2">
              اختر الملف
            </label>
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
            />
          </div>
          
          {/* شريط التقدم */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>التقدم</span>
                <span className="font-bold text-blue-600">{uploadProgress}%</span>
              </div>
              
              <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-600 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-white text-sm font-bold"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {uploadProgress > 5 && `${uploadProgress}%`}
                </div>
              </div>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="grid grid-cols-2 gap-3">
            {!isUploading || isPaused ? (
              <button
                onClick={isPaused ? resumeUpload : startUpload}
                disabled={!file && !isPaused}
                className="col-span-2 bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isPaused ? '▶️ استئناف' : '🚀 بدء الرفع'}
              </button>
            ) : (
              <>
                <button
                  onClick={pauseUpload}
                  className="bg-yellow-500 text-white py-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all duration-300 font-bold text-lg"
                >
                  ⏸️ إيقاف
                </button>
                <button
                  onClick={cancelUpload}
                  className="bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 font-bold text-lg"
                >
                  ❌ إلغاء
                </button>
              </>
            )}
          </div>
        </div>

        {/* رسائل الحالة */}
        {message && (
          <div
            className={`mt-6 text-center p-4 rounded-lg text-sm font-medium ${
              status === 'success'
                ? 'bg-green-100 text-green-800'
                : status === 'warning'
                ? 'bg-yellow-100 text-yellow-800'
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