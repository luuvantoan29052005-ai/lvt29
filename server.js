
const express = require('express');
const db = require('./db');

const app = express();

app.use(express.json());

// Trang kiểm tra API
app.get('/', (req, res) => {
    res.send('API Quan ly ky tuc xa dang hoat dong!');
});

// 1. API lấy danh sách tài khoản
app.get('/he-thong', (req, res) => {
    db.query('SELECT * FROM quan_ly_he_thong', (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 2. API lấy danh sách sinh viên
app.get('/sinh-vien', (req, res) => {
    db.query('SELECT * FROM quan_ly_sinh_vien', (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 3. API lấy danh sách phòng
app.get('/phong', (req, res) => {
    db.query('SELECT * FROM quan_ly_phong', (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 4. API lấy danh sách hóa đơn
app.get('/tai-chinh', (req, res) => {
    db.query('SELECT * FROM quan_ly_tai_chinh', (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 5. API lấy danh sách báo cáo
app.get('/bao-cao', (req, res) => {
    db.query('SELECT * FROM thong_ke_bao_cao', (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Khởi chạy Server
app.listen(3000, () => {
    console.log('Server dang chay tai http://localhost:3000');
});
