require('dotenv').config();
const { Pool } = require('pg');

console.log('--- بدء اختبار الاتصال بقاعدة البيانات ---');
console.log('قراءة المتغيرات من ملف .env:');
console.log(`User: ${process.env.DB_USER}`);
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Database: ${process.env.DB_DATABASE}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log('-------------------------------------------');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testConnection() {
    let client;
    try {
        console.log('جاري محاولة الاتصال...');
        client = await pool.connect();
        console.log('✅ نجاح! تم الاتصال بقاعدة البيانات بنجاح.');
        
        console.log('جاري تنفيذ استعلام بسيط (SELECT 1)...');
        const result = await client.query('SELECT 1 AS test_query');
        console.log('✅ نجاح! تم تنفيذ الاستعلام بنجاح.');
        console.log('نتيجة الاستعلام:', result.rows);

    } catch (error) {
        console.error('❌ فشل! حدث خطأ أثناء الاتصال أو تنفيذ الاستعلام.');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! الخطأ هو:', error);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    } finally {
        if (client) {
            client.release();
            console.log('تم تحرير الاتصال.');
        }
        pool.end();
        console.log('تم إغلاق تجمع الاتصالات.');
    }
}

testConnection();