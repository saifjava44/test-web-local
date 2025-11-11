
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3001; // منفذ للواجهة الخلفية

// السماح بالطلبات من الواجهة الأمامية
app.use(cors());
app.use(express.json());

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
        cb(null, 'uploads/'); // المجلد الذي سيتم حفظ الملفات فيه
    },
    filename: function (req, file, cb) {
        // إنشاء اسم فريد للملف لتجنب التكرار
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// نقطة النهاية (Endpoint) الخاصة برفع الملف
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { originalname, filename, path: filePath } = req.file;
        const { description } = req.body; // الحصول على الوصف من الفورمة

        // التحقق من وجود الملف
        if (!req.file) {
            return res.status(400).send('لم يتم رفع أي ملف.');
        }

        // تخزين معلومات الملف في قاعدة البيانات
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
        res.status(500).send('خطأ في السيرفر.');
    }
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر الخلفي يعمل على المنفذ http://192.186.220.63:${PORT}`);
});