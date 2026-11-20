const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root123',
    database: 'ql_ky_tuc_xa',
    port: 3307
});

connection.connect((err) => {
    if (err) {
        console.log('Kết nối thất bại:', err.message);
        return;
    }

    console.log('Kết nối Database thành công!');
});

module.exports = connection;