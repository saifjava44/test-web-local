require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');
const http = require('http'); // ✨ 1. استيراد مكتبة http للتحكم في السيرفر

const app = express();
const PORT = 3001;

// السماح بالطلبات من الواجهة الأمامية
app.use(cors());

// ✨ 2. زيادة حدود حجم الطلب لـ Express (مثلاً إلى 10 جيجابايت)
// هذا مهم للبيانات الأخرى التي قد تأتي مع الطلب، على الرغم من أن Multer يعالج الملفات بشكل منفصل
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ✨ 3. تعديل إعدادات Multer لإضافة حدود حجم الملف
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 * 1024 // 10 جيجابايت (10 * 1024 MB * 1024 KB * 1024 Bytes)
    }
});

// نقطة النهاية (Endpoint) الخاصة برفع الملف
app.post('/upload', upload.single('file'), async (req, res) => {
    // التحقق من وجود الملف يتم أولاً
    if (!req.file) {
        return res.status(400).send('لم يتم رفع أي ملف.');
    }

    try {
        const { originalname, filename, path: filePath } = req.file;
        const { description } = req.body;

        const query = `
            INSERT INTO files (original_name, new_filename, file_path, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [originalname, filename, filePath, description];

        const result = await pool.query(query, values);

        console.log('تم حفظ الملف بنجاح:', result.rows[0]);
        res.status(201).json({
            message: 'تم رفع الملف وحفظ البيانات بنجاح!',
            fileInfo: result.rows[0]
        });

    } catch (error) {
        console.error('حدث خطأ:', error);
        // التحقق إذا كان الخطأ بسبب تجاوز حجم الملف
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).send('حجم الملف يتجاوز الحد المسموح به (10 جيجابايت).');
        }
        res.status(500).send('خطأ في السيرفر.');
    }
});

// ✨ 4. إنشاء وتشغيل السيرفر مع زيادة مهلة الانتظار
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`🚀 السيرفر الخلفي يعمل على المنفذ http://192.186.220.63:${PORT}`);
});

// زيادة مهلة الانتظار (مثلاً إلى 30 دقيقة) لتجنب انقطاع الاتصال أثناء رفع الملفات الكبيرة
// 30 دقيقة * 60 ثانية * 1000 ميلي ثانية
server.timeout = 30 * 60 * 1000;