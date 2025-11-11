// =================================================================
// الكود النهائي - نظيف وبدون ملفات .info
// =================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Server, EVENTS } = require('@tus/server'); 
const { FileStore } = require('@tus/file-store');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const port = 3001;
const host = '0.0.0.0';

// --- إعداد قاعدة البيانات ---
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// --- إعداد سيرفر Tus ---
const tusServer = new Server({
    path: '/files',
    datastore: new FileStore({
        directory: path.resolve(process.cwd(), 'uploads'),
    }),
});

// --- معالجة ما بعد اكتمال الرفع ---
tusServer.on(EVENTS.POST_FINISH, async (req, res, file) => {
    console.log('===================================================');
    console.log(`✅ اكتمل رفع الملف: ${file.metadata.filename}`);
    console.log('===================================================');

    try {
        const originalName = file.metadata.filename;
        const extension = path.extname(originalName);
        const description = file.metadata.description || 'لا يوجد وصف';
        
        // المسارات
        const oldPath = path.resolve(process.cwd(), 'uploads', file.id);
        const jsonPath = path.resolve(process.cwd(), 'uploads', `${file.id}.json`);
        const newFilenameWithExt = `${file.id}${extension}`;
        const newPath = path.resolve(process.cwd(), 'uploads', newFilenameWithExt);
        
        console.log(`📁 جاري إعادة تسمية الملف...`);
        
        // إعادة تسمية الملف
        await fs.rename(oldPath, newPath);
        console.log(`✅ تمت إعادة التسمية: ${newFilenameWithExt}`);

        // 🔥 حذف ملف .json (التنظيف)
        try {
            await fs.unlink(jsonPath);
            console.log(`🗑️  تم حذف ملف .json`);
        } catch (err) {
            console.log(`⚠️  ملف .json غير موجود أو محذوف مسبقاً`);
        }

        // الحفظ في قاعدة البيانات
        console.log(`💾 جاري الحفظ في قاعدة البيانات...`);
        const filePathInDb = `uploads/${newFilenameWithExt}`;
        const query = `
            INSERT INTO files (original_name, new_filename, file_path, description)
            VALUES ($1, $2, $3, $4) RETURNING *;`;
        const values = [originalName, newFilenameWithExt, filePathInDb, description];

        const result = await pool.query(query, values);
        console.log('✅ تم الحفظ في قاعدة البيانات:', result.rows[0]);
        console.log('===================================================\n');

    } catch (error) {
        console.error('❌ خطأ أثناء معالجة الملف:');
        console.error(error);
        console.error('===================================================\n');
    }
});

// --- ربط Express مع Tus ---
app.use(cors());

const tusMiddleware = tusServer.handle.bind(tusServer);
app.use('/files', tusMiddleware);

app.get('/', (req, res) => {
    res.send('🚀 مرحباً! سيرفر الرفع يعمل بنجاح');
});

// --- تشغيل السيرفر ---
app.listen(port, host, () => {
    console.log(`🚀 السيرفر يعمل على http://${host}:${port}`);
    console.log(`📁 المجلد: ${path.resolve(process.cwd(), 'uploads')}`);
});