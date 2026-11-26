const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_COOKIE = 'dorm_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000;

// Render chạy sau proxy HTTPS.
if (IS_PRODUCTION) app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

function sendError(res, err) {
    console.error(err);
    let message = 'Có lỗi xảy ra khi xử lý dữ liệu.';
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        message = 'Mã khu/phòng/sinh viên/hóa đơn liên kết không tồn tại.';
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        message = 'Không thể xóa vì dữ liệu này đang được bảng khác sử dụng.';
    } else if (err.code === 'ER_DUP_ENTRY') {
        message = 'Mã dữ liệu đã tồn tại. Vui lòng kiểm tra lại.';
    } else if (!IS_PRODUCTION && err.message) {
        message = err.message;
    }
    res.status(500).json({ loi: message });
}

function makeId(prefix) {
    // Ví dụ: DK + 8 ký tự hex, phù hợp VARCHAR(10).
    return prefix + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function getSessionSecret() {
    const secret = process.env.SESSION_SECRET;
    if (IS_PRODUCTION && (!secret || secret.length < 32)) {
        throw new Error('Thiếu SESSION_SECRET hoặc SESSION_SECRET phải có ít nhất 32 ký tự.');
    }
    return secret || 'development-only-secret-change-this-before-deploying';
}

function sign(value) {
    return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

function createSession(username) {
    const payload = Buffer.from(JSON.stringify({
        username,
        role: 'admin',
        exp: Date.now() + SESSION_DURATION
    })).toString('base64url');

    return `${payload}.${sign(payload)}`;
}

function readSession(token) {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!data.username || data.role !== 'admin' || !data.exp || data.exp < Date.now()) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION
    });
}

function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        path: '/'
    });
}

function requireLogin(req, res, next) {
    try {
        const cookieHeader = req.headers.cookie || '';
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(part => {
                const index = part.indexOf('=');
                if (index < 0) return ['', ''];
                return [
                    part.slice(0, index).trim(),
                    decodeURIComponent(part.slice(index + 1).trim())
                ];
            }).filter(([key]) => key)
        );

        const session = readSession(cookies[SESSION_COOKIE]);
        if (!session) {
            clearSessionCookie(res);
            return res.status(401).json({ loi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
        }

        req.user = session;
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ loi: 'Không thể xác thực phiên đăng nhập.' });
    }
}

const activeStatuses = ['Dang o', 'Đang ở', 'Hieu luc', 'Hiệu lực'];

// Đăng nhập: tài khoản/mật khẩu được cấu hình bằng biến môi trường.
app.post('/dang-nhap', (req, res) => {
    const { ten_tai_khoan, mat_khau } = req.body || {};
    const username = process.env.ADMIN_USERNAME || (IS_PRODUCTION ? '' : 'admin');
    const password = process.env.ADMIN_PASSWORD || (IS_PRODUCTION ? '' : 'admin123');

    if (!username || !password) {
        return res.status(500).json({ loi: 'Máy chủ chưa cấu hình ADMIN_USERNAME và ADMIN_PASSWORD.' });
    }
    if (ten_tai_khoan !== username || mat_khau !== password) {
        return res.status(401).json({ loi: 'Sai tài khoản hoặc mật khẩu!' });
    }

    try {
        const token = createSession(username);
        setSessionCookie(res, token);
        return res.json({
            thong_bao: 'Đăng nhập thành công!',
            nguoi_dung: { ma_he_thong: 1, ten_tai_khoan: username, vai_tro: 'admin' }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ loi: 'Máy chủ chưa cấu hình SESSION_SECRET hợp lệ.' });
    }
});

app.post('/dang-xuat', (_req, res) => {
    clearSessionCookie(res);
    res.json({ thong_bao: 'Đã đăng xuất.' });
});

// Health check công khai để Render kiểm tra dịch vụ.
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Từ đây trở xuống, tất cả API dữ liệu đều yêu cầu đăng nhập.
app.use(requireLogin);

app.get('/he-thong', (req, res) => {
    res.json([{
        ma_he_thong: 1,
        ten_tai_khoan: req.user.username,
        vai_tro: req.user.role
    }]);
});
// ==================== KHU ====================
app.get('/khu', async (_req, res) => {
    try {
        const rows = await query(
            'SELECT MaKhu AS ma_khu, TenKhu AS ten_khu, DiaChi AS dia_chi FROM KHU ORDER BY MaKhu'
        );
        res.json(rows);
    } catch (e) { sendError(res, e); }
});

app.post('/khu', async (req, res) => {
    try {
        const { ma_khu, ten_khu, dia_chi } = req.body;
        if (!ma_khu || !ten_khu) {
            return res.status(400).json({ loi: 'Vui lòng nhập mã khu và tên khu.' });
        }
        await query(
            'INSERT INTO KHU (MaKhu, TenKhu, DiaChi) VALUES (?, ?, ?)',
            [ma_khu, ten_khu, dia_chi || null]
        );
        res.json({ thong_bao: 'Thêm khu thành công!' });
    } catch (e) { sendError(res, e); }
});

// ==================== SINH VIÊN + ĐĂNG KÝ ====================
app.get('/sinh-vien', async (_req, res) => {
    try {
        const rows = await query(`
            SELECT s.MaSV AS ma_sinh_vien, s.HoTen AS ho_ten, s.NgaySinh AS ngay_sinh,
                   s.GioiTinh AS gioi_tinh, s.Lop AS lop, s.Khoa AS khoa,
                   s.SDT AS sdt, s.DiaChi AS dia_chi,
                   d.MaPhong AS ma_phong,
                   CASE WHEN d.MaDK IS NULL THEN 'Da roi' ELSE 'Dang o' END AS trang_thai_luu_tru
            FROM SINHVIEN s
            LEFT JOIN DANGKY d
              ON d.MaSV = s.MaSV AND d.TrangThai IN ('Dang o','Đang ở','Hieu luc','Hiệu lực')
            ORDER BY s.MaSV
        `);
        res.json(rows);
    } catch (e) { sendError(res, e); }
});

app.post('/sinh-vien', async (req, res) => {
    try {
        const {
            ma_sinh_vien, ho_ten, ngay_sinh, gioi_tinh,
            lop, khoa, sdt, dia_chi, ma_phong, trang_thai_luu_tru
        } = req.body;

        if (!ma_sinh_vien || !ho_ten) {
            return res.status(400).json({ loi: 'Vui lòng nhập mã sinh viên và họ tên.' });
        }

        await query(
            `INSERT INTO SINHVIEN
             (MaSV, HoTen, NgaySinh, GioiTinh, Lop, Khoa, SDT, DiaChi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ma_sinh_vien, ho_ten, ngay_sinh || null, gioi_tinh || null,
                lop || null, khoa || null, sdt || null, dia_chi || null]
        );

        if (ma_phong) {
            await query(
                `INSERT INTO DANGKY
                 (MaDK, NgayDK, NgayNhanPhong, TrangThai, MaSV, MaPhong)
                 VALUES (?, CURDATE(), CURDATE(), ?, ?, ?)`,
                [makeId('DK'), trang_thai_luu_tru || 'Dang o', ma_sinh_vien, ma_phong]
            );
        }

        res.json({ thong_bao: 'Thêm sinh viên thành công!', ma_sinh_vien });
    } catch (e) { sendError(res, e); }
});

app.put('/sinh-vien/:id', async (req, res) => {
    try {
        const {
            ho_ten, ngay_sinh, gioi_tinh, lop, khoa,
            sdt, dia_chi, ma_phong, trang_thai_luu_tru
        } = req.body;

        await query(
            `UPDATE SINHVIEN
             SET HoTen=?, NgaySinh=?, GioiTinh=?, Lop=?, Khoa=?, SDT=?, DiaChi=?
             WHERE MaSV=?`,
            [ho_ten, ngay_sinh || null, gioi_tinh || null, lop || null,
                khoa || null, sdt || null, dia_chi || null, req.params.id]
        );

        const current = await query(
            `SELECT MaDK FROM DANGKY
             WHERE MaSV=? AND TrangThai IN ('Dang o','Đang ở','Hieu luc','Hiệu lực')
             ORDER BY MaDK DESC LIMIT 1`,
            [req.params.id]
        );

        if (ma_phong) {
            if (current.length) {
                await query(
                    'UPDATE DANGKY SET MaPhong=?, TrangThai=? WHERE MaDK=?',
                    [ma_phong, trang_thai_luu_tru || 'Dang o', current[0].MaDK]
                );
            } else {
                await query(
                    `INSERT INTO DANGKY
                     (MaDK, NgayDK, NgayNhanPhong, TrangThai, MaSV, MaPhong)
                     VALUES (?, CURDATE(), CURDATE(), ?, ?, ?)`,
                    [makeId('DK'), trang_thai_luu_tru || 'Dang o', req.params.id, ma_phong]
                );
            }
        } else if (current.length) {
            await query(
                'UPDATE DANGKY SET TrangThai=?, NgayTraPhong=CURDATE() WHERE MaDK=?',
                [trang_thai_luu_tru || 'Da roi', current[0].MaDK]
            );
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

// ==================== PHÒNG ====================
app.get('/phong', async (_req, res) => {
    try {
        const rows = await query(`
            SELECT p.MaPhong AS ma_phong, p.TenPhong AS ten_phong,
                   p.SucChua AS suc_chua, p.TrangThai AS tinh_trang_phong,
                   p.MaKhu AS ma_khu, k.TenKhu AS ten_khu,
                   (SELECT COUNT(*) FROM DANGKY d
                    WHERE d.MaPhong=p.MaPhong
                      AND d.TrangThai IN ('Dang o','Đang ở','Hieu luc','Hiệu lực')
                   ) AS so_nguoi_hien_tai
            FROM PHONG p
            LEFT JOIN KHU k ON k.MaKhu=p.MaKhu
            ORDER BY p.MaPhong
        `);
        res.json(rows);
    } catch (e) { sendError(res, e); }
});

app.post('/phong', async (req, res) => {
    try {
        const { ma_phong, ten_phong, suc_chua, tinh_trang_phong, ma_khu } = req.body;
        if (!ma_phong || !ten_phong || !ma_khu) {
            return res.status(400).json({ loi: 'Vui lòng nhập mã phòng, tên phòng và mã khu.' });
        }
        await query(
            'INSERT INTO PHONG (MaPhong, TenPhong, SucChua, TrangThai, MaKhu) VALUES (?, ?, ?, ?, ?)',
            [ma_phong, ten_phong, Number(suc_chua || 0), tinh_trang_phong || 'Con cho', ma_khu]
        );
        res.json({ thong_bao: 'Thêm phòng thành công!' });
    } catch (e) { sendError(res, e); }
});

app.put('/phong/:id', async (req, res) => {
    try {
        const { ten_phong, suc_chua, tinh_trang_phong, ma_khu } = req.body;
        await query(
            'UPDATE PHONG SET TenPhong=?, SucChua=?, TrangThai=?, MaKhu=? WHERE MaPhong=?',
            [ten_phong, Number(suc_chua || 0), tinh_trang_phong, ma_khu, req.params.id]
        );
        res.json({ thong_bao: 'Cập nhật phòng thành công!' });
    } catch (e) { sendError(res, e); }
});

app.delete('/phong/:id', async (req, res) => {
    try {
        await query('DELETE FROM PHONG WHERE MaPhong=?', [req.params.id]);
        res.json({ thong_bao: 'Xóa phòng thành công!' });
    } catch (e) { sendError(res, e); }
});
// ==================== HÓA ĐƠN + THANH TOÁN ====================
app.get('/tai-chinh', async (_req, res) => {
    try {
        const rows = await query(`
            SELECT h.MaHD AS ma_hoa_don, h.MaSV AS ma_sinh_vien, s.HoTen AS ho_ten,
                   h.Thang AS thang, h.Nam AS nam, h.TienPhong AS tien_phong,
                   h.TienDien AS tien_dien, h.TienNuoc AS tien_nuoc,
                   h.TongTien AS tong_tien,
                   CASE
                     WHEN COALESCE(t.DaTra,0) >= h.TongTien THEN 'Da thanh toan'
                     WHEN COALESCE(t.DaTra,0) > 0 THEN 'Thanh toan mot phan'
                     ELSE 'Chua thanh toan'
                   END AS trang_thai_thanh_toan,
                   COALESCE(t.DaTra,0) AS da_thanh_toan
            FROM HOADON h
            JOIN SINHVIEN s ON s.MaSV=h.MaSV
            LEFT JOIN (
                SELECT MaHD, SUM(SoTien) AS DaTra
                FROM THANHTOAN GROUP BY MaHD
            ) t ON t.MaHD=h.MaHD
            ORDER BY h.MaHD DESC
        `);
        res.json(rows);
    } catch (e) { sendError(res, e); }
});

app.post('/tai-chinh', async (req, res) => {
    try {
        const { ma_sinh_vien, tien_phong, tien_dien, tien_nuoc, trang_thai_thanh_toan } = req.body;
        if (!ma_sinh_vien) {
            return res.status(400).json({ loi: 'Vui lòng chọn sinh viên.' });
        }

        const tp = Number(tien_phong || 0);
        const td = Number(tien_dien || 0);
        const tn = Number(tien_nuoc || 0);
        if (![tp, td, tn].every(n => Number.isFinite(n) && n >= 0)) {
            return res.status(400).json({ loi: 'Số tiền không hợp lệ.' });
        }

        const total = tp + td + tn;
        const now = new Date();
        const maHoaDon = makeId('HD');

        await query(
            `INSERT INTO HOADON
             (MaHD, Thang, Nam, TienPhong, TienDien, TienNuoc, TongTien, MaSV)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [maHoaDon, now.getMonth() + 1, now.getFullYear(), tp, td, tn, total, ma_sinh_vien]
        );

        if (trang_thai_thanh_toan === 'Da thanh toan' && total > 0) {
            await query(
                'INSERT INTO THANHTOAN (MaTT, NgayTT, SoTien, PhuongThuc, MaHD) VALUES (?, CURDATE(), ?, ?, ?)',
                [makeId('TT'), total, 'Tien mat', maHoaDon]
            );
        }

        res.json({ thong_bao: 'Thêm hóa đơn thành công!', ma_hoa_don: maHoaDon, tong_tien: total });
    } catch (e) { sendError(res, e); }
});

app.put('/tai-chinh/:id', async (req, res) => {
    try {
        const { ma_sinh_vien, tien_phong, tien_dien, tien_nuoc, trang_thai_thanh_toan } = req.body;
        const tp = Number(tien_phong || 0);
        const td = Number(tien_dien || 0);
        const tn = Number(tien_nuoc || 0);
        if (!ma_sinh_vien || ![tp, td, tn].every(n => Number.isFinite(n) && n >= 0)) {
            return res.status(400).json({ loi: 'Thông tin hóa đơn hoặc số tiền không hợp lệ.' });
        }

        const total = tp + td + tn;
        await query(
            `UPDATE HOADON
             SET MaSV=?, TienPhong=?, TienDien=?, TienNuoc=?, TongTien=?
             WHERE MaHD=?`,
            [ma_sinh_vien, tp, td, tn, total, req.params.id]
        );

        const paidRows = await query(
            'SELECT COALESCE(SUM(SoTien),0) AS da_tra FROM THANHTOAN WHERE MaHD=?',
            [req.params.id]
        );
        const paid = Number(paidRows[0].da_tra);

        if (trang_thai_thanh_toan === 'Da thanh toan' && paid < total) {
            await query(
                'INSERT INTO THANHTOAN (MaTT, NgayTT, SoTien, PhuongThuc, MaHD) VALUES (?, CURDATE(), ?, ?, ?)',
                [makeId('TT'), total - paid, 'Tien mat', req.params.id]
            );
        }

        res.json({ thong_bao: 'Cập nhật hóa đơn thành công!' });
    } catch (e) { sendError(res, e); }
});

app.delete('/tai-chinh/:id', async (req, res) => {
    try {
        await query('DELETE FROM THANHTOAN WHERE MaHD=?', [req.params.id]);
        await query('DELETE FROM HOADON WHERE MaHD=?', [req.params.id]);
        res.json({ thong_bao: 'Xóa hóa đơn thành công!' });
    } catch (e) { sendError(res, e); }
});

app.post('/thanh-toan', async (req, res) => {
    try {
        const { ma_hoa_don, so_tien, phuong_thuc } = req.body;
        const amount = Number(so_tien);

        if (!ma_hoa_don || !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ loi: 'Mã hóa đơn và số tiền thanh toán không hợp lệ.' });
        }

        await query(
            'INSERT INTO THANHTOAN (MaTT, NgayTT, SoTien, PhuongThuc, MaHD) VALUES (?, CURDATE(), ?, ?, ?)',
            [makeId('TT'), amount, phuong_thuc || 'Tien mat', ma_hoa_don]
        );
        res.json({ thong_bao: 'Ghi nhận thanh toán thành công!' });
    } catch (e) { sendError(res, e); }
});

app.get('/thanh-toan/:maHD', async (req, res) => {
    try {
        const rows = await query(
            `SELECT MaTT AS ma_thanh_toan, NgayTT AS ngay_thanh_toan,
                    SoTien AS so_tien, PhuongThuc AS phuong_thuc, MaHD AS ma_hoa_don
             FROM THANHTOAN WHERE MaHD=? ORDER BY MaTT DESC`,
            [req.params.maHD]
        );
        res.json(rows);
    } catch (e) { sendError(res, e); }
});
// ==================== BÁO CÁO ====================
app.get('/bao-cao', async (_req, res) => {
    try {
        const [sv] = await query('SELECT COUNT(*) AS n FROM SINHVIEN');
        const [ph] = await query('SELECT COUNT(*) AS n FROM PHONG');
        const [hd] = await query(
            'SELECT COUNT(*) AS n, COALESCE(SUM(TongTien),0) AS total FROM HOADON'
        );

        const today = new Date().toISOString().slice(0, 10);
        res.json([
            {
                ma_bao_cao: 'BC01',
                ten_bao_cao: 'Tổng số sinh viên',
                ngay_lap: today,
                noi_dung: `Hiện có ${sv.n} sinh viên trong hệ thống.`,
                nguoi_lap: 'Hệ thống'
            },
            {
                ma_bao_cao: 'BC02',
                ten_bao_cao: 'Tổng số phòng',
                ngay_lap: today,
                noi_dung: `Hiện có ${ph.n} phòng ký túc xá.`,
                nguoi_lap: 'Hệ thống'
            },
            {
                ma_bao_cao: 'BC03',
                ten_bao_cao: 'Tổng hợp hóa đơn',
                ngay_lap: today,
                noi_dung: `${hd.n} hóa đơn, tổng giá trị ${Number(hd.total).toLocaleString('vi-VN')} đồng.`,
                nguoi_lap: 'Hệ thống'
            }
        ]);
    } catch (e) { sendError(res, e); }
});

app.use((req, res) => {
    res.status(404).json({ loi: 'Không tìm thấy đường dẫn API!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Website quản lý ký túc xá đang chạy tại cổng ${PORT}`);
});