// =================================================================
// 🚀 Backend نهائي - مستقر وبدون مراقبة التقدم على السيرفر
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
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// --- إعداد Tus Server ---
const tusServer = new Server({
    path: '/files',
    datastore: new FileStore({
        directory: path.resolve(process.cwd(), 'uploads'),
    }),
});

// --- ✅ عند بدء الرفع ---
tusServer.on(EVENTS.POST_CREATE, (req, res, upload) => {
    console.log('===================================================');
    console.log(`📤 بدء رفع ملف جديد: ${upload.metadata?.filename || 'unknown'}`);
    console.log(`📊 حجم الملف: ${(upload.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🆔 معرّف الرفع: ${upload.id}`);
    console.log('===================================================');
});

// --- ✨ تم إزالة معالج الحدث EVENTS.POST_RECEIVE المسبب للمشكلة ---

// --- ✅ عند اكتمال الرفع ---
tusServer.on(EVENTS.POST_FINISH, (req, res, file) => {
    console.log('===================================================');
    console.log(`✅ اكتمل رفع الملف: ${file.metadata.filename}`);
    console.log('===================================================');

    setImmediate(async () => {
        try {
            const originalName = file.metadata.filename;
            const extension = path.extname(originalName);
            const description = file.metadata.description || 'بدون وصف';
            
            const oldPath = path.resolve(process.cwd(), 'uploads', file.id);
            const jsonPath = path.resolve(process.cwd(), 'uploads', `${file.id}.json`);
            const newFilenameWithExt = `${file.id}${extension}`;
            const newPath = path.resolve(process.cwd(), 'uploads', newFilenameWithExt);
            
            console.log(`📁 جاري إعادة تسمية الملف...`);
            await fs.rename(oldPath, newPath);
            console.log(`✅ تمت إعادة التسمية: ${newFilenameWithExt}`);

            try {
                await fs.unlink(jsonPath);
                console.log(`🗑️  تم حذف ملف .json`);
            } catch (err) {
                console.log(`⚠️  ملف .json غير موجود`);
            }

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
            console.error('❌ خطأ أثناء معالجة الملف:', error);
            console.error('===================================================\n');
        }
    });
});

// --- 🌐 إعداد Express ---
app.use(cors());

const tusMiddleware = tusServer.handle.bind(tusServer);
app.use('/files', tusMiddleware);

app.get('/', (req, res) => {
    res.send('🚀 مرحباً! سيرفر الرفع يعمل بنجاح');
});

// --- ✅ Graceful Shutdown ---
async function gracefulShutdown() {
    console.log('\n⚠️  Signal received: closing server gracefully...');
    await pool.end();
    console.log('Database pool closed.');
    process.exit(0);
}
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// --- تشغيل السيرفر ---
app.listen(port, host, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 السيرفر يعمل بنجاح!');
    console.log('='.repeat(60));
    console.log(`📍 العنوان: http://${host}:${port}`);
    console.log(`📁 مجلد الرفع: ${path.resolve(process.cwd(), 'uploads')}`);
    console.log(`🔗 Endpoint: http://${host}:${port}/files/`);
    console.log('='.repeat(60) + '\n');
});