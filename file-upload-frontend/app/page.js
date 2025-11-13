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
  
  // useRef للاحتفاظ بكائن الرفع للتحكم فيه (إيقاف مؤقت/استئناف)
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

  const handleUpload = () => {
    if (!file) {
      setMessage('الرجاء اختيار ملف أولاً.');
      setStatus('error');
      return;
    }

    // إذا كان هناك رفع حالي، لا تبدأ رفعاً جديداً
    if (isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);

    const upload = new tus.Upload(file, {
        // ✨ تأكد من أن هذا هو عنوان IP الثابت الصحيح + المسار الجديد
        endpoint: "http://192.186.220.29:3001/files/",
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
    upload.start();
  };

  // دالة لإلغاء الرفع
  const cancelUpload = () => {
    if (tusUploadRef.current) {
        tusUploadRef.current.abort(true).then(() => {
            console.log('تم إلغاء الرفع');
            setIsUploading(false);
            setUploadProgress(0);
            setMessage('تم إلغاء عملية الرفع.');
            setStatus('error');
        });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            نظام رفع ملفات قوي
          </h1>
          <p className="text-gray-500 mt-2">يدعم الملفات الضخمة والرفع القابل للاستئناف</p>
        </div>

        <div className="space-y-6">
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
              placeholder="مثال: النسخة النهائية من فيديو المشروع"
            />
          </div>
          
          <div>
            <label htmlFor="file-input" className="block text-sm font-semibold text-gray-700 mb-2">
              اختر الملف (حتى 20GB+)
            </label>
            <input
              type="file"
              id="file-input"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          
          {/* شريط التقدم */}
          {isUploading && (
            <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-4 relative">
                    <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-150 ease-linear flex items-center justify-center text-white text-xs"
                        style={{ width: `${uploadProgress}%` }}
                    >
                       {`${uploadProgress}%`}
                    </div>
                </div>
            </div>
          )}

          <div className="flex space-x-4 space-x-reverse">
            <button
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isUploading ? 'جاري الرفع...' : 'بدء الرفع'}
            </button>
            {isUploading && (
                <button
                    onClick={cancelUpload}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 font-semibold text-lg"
                >
                    إلغاء
                </button>
            )}
          </div>
        </div>

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