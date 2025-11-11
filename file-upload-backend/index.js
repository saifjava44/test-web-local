// =================================================================
// الكود النهائي مع نظام تشخيصي قوي للأخطاء
// =================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
// ✨ 1. استيراد EVENTS للتعامل مع الأحداث بشكل صريح
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
// ✨ 2. لقد قمنا بإزالة onUploadFinish من هنا لتعريفه بشكل منفصل
const tusServer = new Server({
    path: '/files',
    datastore: new FileStore({
        directory: path.resolve(process.cwd(), 'uploads'),
    }),
});

// ✨ 3. تعريف الحدث بشكل منفصل وصريح (الطريقة الأكثر ضماناً)
tusServer.on(EVENTS.POST_FINISH, async (req, res, file) => {
    console.log('===================================================');
    console.log(`[EVENT: POST_FINISH] اكتمل رفع الملف بنجاح!`);
    console.log(`تفاصيل الملف المستلم:`, file);
    console.log('===================================================');

    try {
        // --- خطوة إعادة تسمية الملف ---
        const originalName = file.metadata.filename;
        const extension = path.extname(originalName);
        
        const oldPath = path.resolve(process.cwd(), 'uploads', file.id);
        const newFilenameWithExt = `${file.id}${extension}`;
        const newPath = path.resolve(process.cwd(), 'uploads', newFilenameWithExt);
        
        console.log(`[FS] جاري إعادة تسمية الملف...`);
        console.log(`   - من: ${oldPath}`);
        console.log(`   - إلى: ${newPath}`);

        // التحقق من وجود الملف قبل إعادة التسمية
        await fs.access(oldPath);
        console.log(`[FS] تم العثور على الملف المصدر.`);

        await fs.rename(oldPath, newPath);
        console.log('[FS] نجحت إعادة تسمية الملف!');

        // --- خطوة الحفظ في قاعدة البيانات ---
        const description = file.metadata.description || 'لا يوجد وصف';
        const filePathInDb = `uploads/${newFilenameWithExt}`;

        console.log(`[DB] جاري الحفظ في قاعدة البيانات...`);
        const query = `
            INSERT INTO files (original_name, new_filename, file_path, description)
            VALUES ($1, $2, $3, $4) RETURNING *;`;
        const values = [originalName, newFilenameWithExt, filePathInDb, description];

        const result = await pool.query(query, values);
        console.log('[DB] نجاح! تم حفظ السجل:', result.rows[0]);

    } catch (error) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! فشل حاسم أثناء معالجة ما بعد الرفع !!!');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('الخطأ هو:', error);
    }
});


// --- ربط Express مع Tus (Middleware) ---
// ✨ 4. يجب وضع CORS قبل أي مسارات أخرى
app.use(cors());

const tusMiddleware = tusServer.handle.bind(tusServer);
app.use('/files', tusMiddleware);

app.get('/', (req, res) => {
    res.send('مرحباً! سيرفر الرفع يعمل.');
});

// --- تشغيل السيرفر ---
app.listen(port, host, () => {
    console.log(`🚀 السيرفر الخلفي يعمل على http://${host}:${port}`);
});