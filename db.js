
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ql_ky_tuc_xa',
    port: Number(process.env.DB_PORT || 3307),
    connectTimeout: 10000,
    charset: 'utf8mb4'
});

connection.connect((err) => {
    if (err) {
        console.error('Kết nối Database thất bại:', err.message);
        return;
    }

    console.log('Kết nối Database thành công!');
});

module.exports = connection;
