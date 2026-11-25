const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}
function sendError(res, err) {
    console.error(err);
    const message = err.code === 'ER_NO_REFERENCED_ROW_2'
        ? 'Mã khu/phòng/sinh viên/hóa đơn liên kết không tồn tại.'
        : err.code === 'ER_ROW_IS_REFERENCED_2'
            ? 'Không thể xóa vì dữ liệu này đang được bảng khác sử dụng.'
            : err.message;
    res.status(500).json({ loi: message });
}
const activeStatus = ['Dang o', 'Đang ở', 'Hieu luc', 'Hiệu lực'];

// Đăng nhập dùng biến môi trường, không cần bảng tài khoản thứ bảy.
app.post('/dang-nhap', (req, res) => {
    const { ten_tai_khoan, mat_khau } = req.body;
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    if (ten_tai_khoan !== username || mat_khau !== password) {
        return res.status(401).json({ loi: 'Sai tài khoản hoặc mật khẩu!' });
    }
    res.json({ thong_bao: 'Đăng nhập thành công!', nguoi_dung: {
        ma_he_thong: 1, ten_tai_khoan: username, vai_tro: 'admin'
    }});
});
app.get('/he-thong', (_req, res) => res.json([
    { ma_he_thong: 1, ten_tai_khoan: process.env.ADMIN_USERNAME || 'admin', vai_tro: 'admin' }
]));

// KHU
app.get('/khu', async (_req, res) => {
    try { res.json(await query('SELECT MaKhu AS ma_khu, TenKhu AS ten_khu, DiaChi AS dia_chi FROM `KHU` ORDER BY MaKhu')); }
    catch (e) { sendError(res, e); }
});
app.post('/khu', async (req, res) => {
    try {
        const { ma_khu, ten_khu, dia_chi } = req.body;
        if (!ma_khu || !ten_khu) return res.status(400).json({ loi: 'Vui lòng nhập mã khu và tên khu.' });
        await query('INSERT INTO `KHU` (MaKhu, TenKhu, DiaChi) VALUES (?, ?, ?)', [ma_khu, ten_khu, dia_chi || null]);
        res.json({ thong_bao: 'Thêm khu thành công!' });
    } catch (e) { sendError(res, e); }
});

// SINHVIEN + DANGKY: giữ tên thuộc tính cũ để giao diện hiện tại tiếp tục hoạt động.
app.get('/sinh-vien', async (_req, res) => {
    try {
        const rows = await query(`
            SELECT s.MaSV AS ma_sinh_vien, s.HoTen AS ho_ten, s.NgaySinh AS ngay_sinh,
                   s.GioiTinh AS gioi_tinh, s.Lop AS lop, s.Khoa AS khoa,
                   s.SDT AS sdt, s.DiaChi AS dia_chi,
                   d.MaPhong AS ma_phong,
                   CASE WHEN d.MaDK IS NULL THEN 'Da roi' ELSE 'Dang o' END AS trang_thai_luu_tru
            FROM SINHVIEN s
            LEFT JOIN DANGKY d ON d.MaSV = s.MaSV AND d.TrangThai IN ('Dang o','Đang ở','Hieu luc','Hiệu lực')
            ORDER BY s.MaSV`);
        res.json(rows);
    } catch (e) { sendError(res, e); }
});
app.post('/sinh-vien', async (req, res) => {
    try {
        const { ma_sinh_vien, ho_ten, ngay_sinh, gioi_tinh, lop, khoa, sdt, dia_chi, ma_phong, trang_thai_luu_tru } = req.body;
        if (!ma_sinh_vien || !ho_ten) return res.status(400).json({ loi: 'Vui lòng nhập mã sinh viên và họ tên.' });
        await query('INSERT INTO SINHVIEN (MaSV, HoTen, NgaySinh, GioiTinh, Lop, Khoa, SDT, DiaChi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [ma_sinh_vien, ho_ten, ngay_sinh || null, gioi_tinh || null, lop || null, khoa || null, sdt || null, dia_chi || null]);
        if (ma_phong) {
            await query(`INSERT INTO DANGKY (NgayDK, NgayNhanPhong, TrangThai, MaSV, MaPhong)
                VALUES (CURDATE(), CURDATE(), ?, ?, ?)`, [trang_thai_luu_tru || 'Dang o', ma_sinh_vien, ma_phong]);
        }
        res.json({ thong_bao: 'Thêm sinh viên thành công!', ma_sinh_vien });
    } catch (e) { sendError(res, e); }
});
app.put('/sinh-vien/:id', async (req, res) => {
    try {
        const { ho_ten, ngay_sinh, gioi_tinh, lop, khoa, sdt, dia_chi, ma_phong, trang_thai_luu_tru } = req.body;
        await query('UPDATE SINHVIEN SET HoTen=?, NgaySinh=?, GioiTinh=?, Lop=?, Khoa=?, SDT=?, DiaChi=? WHERE MaSV=?',
            [ho_ten, ngay_sinh || null, gioi_tinh || null, lop || null, khoa || null, sdt || null, dia_chi || null, req.params.id]);
        const current = await query(`SELECT MaDK FROM DANGKY WHERE MaSV=? AND TrangThai IN ('Dang o','Đang ở','Hieu luc','Hiệu lực') ORDER BY MaDK DESC LIMIT 1`, [req.params.id]);
        if (ma_phong) {
            if (current.length) await query('UPDATE DANGKY SET MaPhong=?, TrangThai=? WHERE MaDK=?', [ma_phong, trang_thai_luu_tru || 'Dang o', current[0].MaDK]);
            else await query('INSERT INTO DANGKY (NgayDK, NgayNhanPhong, TrangThai, MaSV, MaPhong) VALUES (CURDATE(), CURDATE(), ?, ?, ?)', [trang_thai_luu_tru || 'Dang o', req.params.id, ma_phong]);
        } else if (current.length) {
            await query('UPDATE DANGKY SET TrangThai=?, NgayTraPhong=CURDATE() WHERE MaDK=?', [trang_thai_luu_tru || 'Da roi', current[0].MaDK]);
        }
        res.json({ thong_bao: 'Cập nhật sinh viên thành công!' });
    } catch (e) { sendError(res, e); }
});
app.delete('/sinh-vien/:id', async (req, res) => {
    try {
        await query('DELETE FROM DANGKY WHERE MaSV=?', [req.params.id]);
        await query('DELETE FROM SINHVIEN WHERE MaSV=?', [req.params.id]);
        res.json({ thong_bao: 'Xóa sinh viên thành công!' });
    } catch (e) { sendError(res, e); }
});

// PHONG: số người hiện tại được tính từ các đăng ký còn hiệu lực.
app.get('/phong', async (_req, res) => {
    try {
        res.json(await query(`SELECT p.MaPhong AS ma_phong, p.TenPhong AS ten_phong, p.SucChua AS suc_chua,
            p.TrangThai AS tinh_trang_phong, p.MaKhu AS ma_khu, k.TenKhu AS ten_khu,
            (SELECT COUNT(*) FROM DANGKY d WHERE d.MaPhong=p.MaPhong AND d.TrangThai IN ('Dang o','Đang ở','Hieu luc','Hiệu lực')) AS so_nguoi_hien_tai
            FROM PHONG p LEFT JOIN KHU k ON k.MaKhu=p.MaKhu ORDER BY p.MaPhong`));
    } catch (e) { sendError(res, e); }
});
app.post('/phong', async (req, res) => {
    try {
        const { ma_phong, ten_phong, suc_chua, tinh_trang_phong, ma_khu } = req.body;
        if (!ma_phong || !ten_phong || !ma_khu) return res.status(400).json({ loi: 'Vui lòng nhập mã phòng, tên phòng và mã khu.' });
        await query('INSERT INTO PHONG (MaPhong, TenPhong, SucChua, TrangThai, MaKhu) VALUES (?, ?, ?, ?, ?)',
            [ma_phong, ten_phong, Number(suc_chua || 0), tinh_trang_phong || 'Con cho', ma_khu]);
        res.json({ thong_bao: 'Thêm phòng thành công!' });
    } catch (e) { sendError(res, e); }
});
app.put('/phong/:id', async (req, res) => {
    try {
        const { ten_phong, suc_chua, tinh_trang_phong, ma_khu } = req.body;
        await query('UPDATE PHONG SET TenPhong=?, SucChua=?, TrangThai=?, MaKhu=? WHERE MaPhong=?',
            [ten_phong, Number(suc_chua || 0), tinh_trang_phong, ma_khu, req.params.id]);
        res.json({ thong_bao: 'Cập nhật phòng thành công!' });
    } catch (e) { sendError(res, e); }
});
app.delete('/phong/:id', async (req, res) => {
    try { await query('DELETE FROM PHONG WHERE MaPhong=?', [req.params.id]); res.json({ thong_bao: 'Xóa phòng thành công!' }); }
    catch (e) { sendError(res, e); }
});

// HOADON + THANHTOAN
app.get('/tai-chinh', async (_req, res) => {
    try {
        res.json(await query(`SELECT h.MaHD AS ma_hoa_don, h.MaSV AS ma_sinh_vien, s.HoTen AS ho_ten,
            h.Thang AS thang, h.Nam AS nam, h.TienPhong AS tien_phong, h.TienDien AS tien_dien,
            h.TienNuoc AS tien_nuoc, h.TongTien AS tong_tien,
            CASE WHEN COALESCE(t.DaTra,0) >= h.TongTien THEN 'Da thanh toan'
                 WHEN COALESCE(t.DaTra,0) > 0 THEN 'Thanh toan mot phan' ELSE 'Chua thanh toan' END AS trang_thai_thanh_toan,
            COALESCE(t.DaTra,0) AS da_thanh_toan
            FROM HOADON h JOIN SINHVIEN s ON s.MaSV=h.MaSV
            LEFT JOIN (SELECT MaHD, SUM(SoTien) AS DaTra FROM THANHTOAN GROUP BY MaHD) t ON t.MaHD=h.MaHD
            ORDER BY h.MaHD DESC`));
    } catch (e) { sendError(res, e); }
});
app.post('/tai-chinh', async (req, res) => {
    try {
        const { ma_sinh_vien, tien_phong, tien_dien, tien_nuoc, trang_thai_thanh_toan } = req.body;
        const tp = Number(tien_phong || 0), td = Number(tien_dien || 0), tn = Number(tien_nuoc || 0);
        const total = tp + td + tn;
        const now = new Date();
        const result = await query('INSERT INTO HOADON (Thang, Nam, TienPhong, TienDien, TienNuoc, TongTien, MaSV) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [now.getMonth() + 1, now.getFullYear(), tp, td, tn, total, ma_sinh_vien]);
        if (trang_thai_thanh_toan === 'Da thanh toan' && total > 0) {
            await query('INSERT INTO THANHTOAN (NgayTT, SoTien, PhuongThuc, MaHD) VALUES (CURDATE(), ?, ?, ?)', [total, 'Tien mat', result.insertId]);
        }
        res.json({ thong_bao: 'Thêm hóa đơn thành công!', ma_hoa_don: result.insertId, tong_tien: total });
    } catch (e) { sendError(res, e); }
});
app.put('/tai-chinh/:id', async (req, res) => {
    try {
        const { ma_sinh_vien, tien_phong, tien_dien, tien_nuoc, trang_thai_thanh_toan } = req.body;
        const tp = Number(tien_phong || 0), td = Number(tien_dien || 0), tn = Number(tien_nuoc || 0), total = tp + td + tn;
        await query('UPDATE HOADON SET MaSV=?, TienPhong=?, TienDien=?, TienNuoc=?, TongTien=? WHERE MaHD=?',
            [ma_sinh_vien, tp, td, tn, total, req.params.id]);
        const paid = await query('SELECT COALESCE(SUM(SoTien),0) AS da_tra FROM THANHTOAN WHERE MaHD=?', [req.params.id]);
        if (trang_thai_thanh_toan === 'Da thanh toan' && Number(paid[0].da_tra) < total) {
            await query('INSERT INTO THANHTOAN (NgayTT, SoTien, PhuongThuc, MaHD) VALUES (CURDATE(), ?, ?, ?)', [total - Number(paid[0].da_tra), 'Tien mat', req.params.id]);
        }
        res.json({ thong_bao: 'Cập nhật hóa đơn thành công!' });
    } catch (e) { sendError(res, e); }
});
app.delete('/tai-chinh/:id', async (req, res) => {
    try { await query('DELETE FROM THANHTOAN WHERE MaHD=?', [req.params.id]); await query('DELETE FROM HOADON WHERE MaHD=?', [req.params.id]); res.json({ thong_bao: 'Xóa hóa đơn thành công!' }); }
    catch (e) { sendError(res, e); }
});
app.post('/thanh-toan', async (req, res) => {
    try {
        const { ma_hoa_don, so_tien, phuong_thuc } = req.body;
        if (!ma_hoa_don || Number(so_tien) <= 0) return res.status(400).json({ loi: 'Mã hóa đơn và số tiền thanh toán không hợp lệ.' });
        await query('INSERT INTO THANHTOAN (NgayTT, SoTien, PhuongThuc, MaHD) VALUES (CURDATE(), ?, ?, ?)', [Number(so_tien), phuong_thuc || 'Tien mat', ma_hoa_don]);
        res.json({ thong_bao: 'Ghi nhận thanh toán thành công!' });
    } catch (e) { sendError(res, e); }
});
app.get('/thanh-toan/:maHD', async (req, res) => {
    try { res.json(await query('SELECT MaTT AS ma_thanh_toan, NgayTT AS ngay_thanh_toan, SoTien AS so_tien, PhuongThuc AS phuong_thuc, MaHD AS ma_hoa_don FROM THANHTOAN WHERE MaHD=? ORDER BY MaTT DESC', [req.params.maHD])); }
    catch (e) { sendError(res, e); }
});

// Báo cáo được tổng hợp trực tiếp, không cần bảng thứ bảy.
app.get('/bao-cao', async (_req, res) => {
    try {
        const [sv] = await query('SELECT COUNT(*) AS n FROM SINHVIEN');
        const [ph] = await query('SELECT COUNT(*) AS n FROM PHONG');
        const [hd] = await query('SELECT COUNT(*) AS n, COALESCE(SUM(TongTien),0) AS total FROM HOADON');
        const today = new Date().toISOString().slice(0, 10);
        res.json([
            { ma_bao_cao: 'BC01', ten_bao_cao: 'Tổng số sinh viên', ngay_lap: today, noi_dung: `Hiện có ${sv.n} sinh viên trong hệ thống.`, nguoi_lap: 'Hệ thống' },
            { ma_bao_cao: 'BC02', ten_bao_cao: 'Tổng số phòng', ngay_lap: today, noi_dung: `Hiện có ${ph.n} phòng ký túc xá.`, nguoi_lap: 'Hệ thống' },
            { ma_bao_cao: 'BC03', ten_bao_cao: 'Tổng hợp hóa đơn', ngay_lap: today, noi_dung: `${hd.n} hóa đơn, tổng giá trị ${Number(hd.total).toLocaleString('vi-VN')} đồng.`, nguoi_lap: 'Hệ thống' }
        ]);
    } catch (e) { sendError(res, e); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ loi: 'Không tìm thấy đường dẫn API!' }));
app.listen(PORT, '0.0.0.0', () => console.log(`Website quản lý ký túc xá đang chạy tại cổng ${PORT}`));
