
// =============================================
// 1. KHAI BÁO DỮ LIỆU
// =============================================

let students = [];
let rooms = [];
let invoices = [];
let reports = [];

let currentUser = null;
let currentType = '';
let currentId = null;

const $ = id => document.getElementById(id);


// =============================================
// 2. KẾT NỐI API
// =============================================

async function api(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.loi || result.message || 'Có lỗi xảy ra!'
        );
    }

    return result;
}


// =============================================
// 3. HÀM HỖ TRỢ
// =============================================

function money(value) {
    return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function selected(value, currentValue) {
    return String(value) === String(currentValue)
        ? 'selected'
        : '';
}

function getFormData(form) {
    return Object.fromEntries(
        new FormData(form).entries()
    );
}


// =============================================
// 4. ĐĂNG NHẬP
// =============================================

$('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    $('login-error').textContent = '';

    try {
        const result = await api('/dang-nhap', 'POST', {
            ten_tai_khoan: $('username').value.trim(),
            mat_khau: $('password').value
        });

        // Server trả dữ liệu trong result.nguoi_dung
        const user = result.nguoi_dung;

        if (!user) {
            throw new Error('Không nhận được thông tin tài khoản!');
        }

        currentUser = user;

        // Ẩn đăng nhập, hiện giao diện chính
        $('login-screen').classList.add('hidden');
        $('app').classList.remove('hidden');

        // Hiển thị thông tin người dùng
        $('user-name').textContent = user.ten_tai_khoan;
        $('welcome-name').textContent = user.ten_tai_khoan;

        $('avatar').textContent =
            user.ten_tai_khoan.charAt(0).toUpperCase();

        $('user-role').textContent =
            user.vai_tro === 'admin'
                ? 'Quản trị viên'
                : 'Nhân viên';

        // Ẩn nút thêm đối với nhân viên
        document.querySelectorAll('.admin-only').forEach(button => {
            button.classList.toggle(
                'hidden',
                user.vai_tro !== 'admin'
            );
        });

        // Tải dữ liệu
        await loadAll();

    } catch (err) {
        $('login-error').textContent = err.message;
    }
});


// =============================================
// 5. ĐĂNG XUẤT
// =============================================

$('logout-btn').addEventListener('click', function() {
    currentUser = null;

    students = [];
    rooms = [];
    invoices = [];
    reports = [];

    $('app').classList.add('hidden');
    $('login-screen').classList.remove('hidden');

    $('password').value = '';
    $('login-error').textContent = '';
});


// =============================================
// 6. CHUYỂN TRANG
// =============================================

document.querySelectorAll('.nav-link').forEach(button => {
    button.addEventListener('click', function() {
        const page = this.dataset.page;

        document.querySelectorAll('.nav-link').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelectorAll('.page').forEach(item => {
            item.classList.remove('active');
        });

        this.classList.add('active');

        $('page-' + page).classList.add('active');

        const titles = {
            overview: 'Tổng quan',
            students: 'Quản lý sinh viên',
            rooms: 'Quản lý phòng',
            finance: 'Quản lý tài chính',
            reports: 'Báo cáo'
        };

        $('page-title').textContent = titles[page];

        if (page === 'students') loadStudents();
        if (page === 'rooms') loadRooms();
        if (page === 'finance') loadFinance();
        if (page === 'reports') loadReports();
    });
});


// =============================================
// 7. TẢI TOÀN BỘ DỮ LIỆU
// =============================================

async function loadAll() {
    await Promise.allSettled([
        loadStudents(),
        loadRooms(),
        loadFinance(),
        loadReports()
    ]);

    updateOverview();
}


// =============================================
// 8. QUẢN LÝ SINH VIÊN
// =============================================

async function loadStudents() {
    try {
        students = await api('/sinh-vien');

        renderStudents();
        updateOverview();

    } catch (err) {
        $('students-body').innerHTML =
            `<tr><td colspan="7">${escapeHTML(err.message)}</td></tr>`;
    }
}


function renderStudents() {
    const q = $('student-search').value.toLowerCase();

    const list = students.filter(s =>
        `${s.ma_sinh_vien} ${s.ho_ten}`
            .toLowerCase()
            .includes(q)
    );

    if (list.length === 0) {
        $('students-body').innerHTML =
            '<tr><td colspan="7">Không có sinh viên nào!</td></tr>';
        return;
    }

    $('students-body').innerHTML = list.map(s => `
        <tr>
            <td>${escapeHTML(s.ma_sinh_vien)}</td>
            <td>${escapeHTML(s.ho_ten)}</td>
            <td>${escapeHTML(s.ngay_sinh)}</td>
            <td>${escapeHTML(s.gioi_tinh)}</td>
            <td>${escapeHTML(s.ma_phong)}</td>
            <td>${escapeHTML(s.trang_thai_luu_tru)}</td>
            <td>${actionButtons('student', s.ma_sinh_vien)}</td>
        </tr>
    `).join('');
}


// =============================================
// 9. QUẢN LÝ PHÒNG
// =============================================

async function loadRooms() {
    try {
        rooms = await api('/phong');

        renderRooms();
        updateOverview();

    } catch (err) {
        $('rooms-body').innerHTML =
            `<tr><td colspan="7">${escapeHTML(err.message)}</td></tr>`;
    }
}


function renderRooms() {
    const q = $('room-search').value.toLowerCase();

    const list = rooms.filter(r =>
        `${r.ma_phong} ${r.ten_phong}`
            .toLowerCase()
            .includes(q)
    );

    if (list.length === 0) {
        $('rooms-body').innerHTML =
            '<tr><td colspan="7">Không có phòng nào!</td></tr>';
        return;
    }

    $('rooms-body').innerHTML = list.map(r => {
        const empty = Math.max(
            0,
            Number(r.suc_chua || 0) -
            Number(r.so_nguoi_hien_tai || 0)
        );

        return `
            <tr>
                <td>${escapeHTML(r.ma_phong)}</td>
                <td>${escapeHTML(r.ten_phong)}</td>
                <td>${escapeHTML(r.suc_chua)}</td>
                <td>${escapeHTML(r.so_nguoi_hien_tai)}</td>
                <td>${empty}</td>
                <td>${escapeHTML(r.tinh_trang_phong)}</td>
                <td>${actionButtons('room', r.ma_phong)}</td>
            </tr>
        `;
    }).join('');
}


// =============================================
// 10. QUẢN LÝ TÀI CHÍNH
// =============================================

async function loadFinance() {
    try {
        invoices = await api('/tai-chinh');

        renderFinance();
        updateOverview();

    } catch (err) {
        $('finance-body').innerHTML =
            `<tr><td colspan="8">${escapeHTML(err.message)}</td></tr>`;
    }
}


function renderFinance() {
    const q = $('finance-search').value.toLowerCase();

    const list = invoices.filter(i =>
        `${i.ma_hoa_don} ${i.ma_sinh_vien} ${i.ho_ten || ''}`
            .toLowerCase()
            .includes(q)
    );

    $('invoice-count').textContent = invoices.length;

    $('paid-count').textContent = invoices.filter(i =>
        String(i.trang_thai_thanh_toan)
            .toLowerCase()
            .includes('da')
    ).length;

    $('unpaid-count').textContent = invoices.filter(i =>
        String(i.trang_thai_thanh_toan)
            .toLowerCase()
            .includes('chua')
    ).length;

    if (list.length === 0) {
        $('finance-body').innerHTML =
            '<tr><td colspan="8">Không có hóa đơn nào!</td></tr>';
        return;
    }

    $('finance-body').innerHTML = list.map(i => `
        <tr>
            <td>${escapeHTML(i.ma_hoa_don)}</td>
            <td>${escapeHTML(i.ma_sinh_vien)}</td>
            <td>${money(i.tien_phong)}</td>
            <td>${money(i.tien_dien)}</td>
            <td>${money(i.tien_nuoc)}</td>
            <td>${money(i.tong_tien)}</td>
            <td>${escapeHTML(i.trang_thai_thanh_toan)}</td>
            <td>${actionButtons('invoice', i.ma_hoa_don)}</td>
        </tr>
    `).join('');
}


// =============================================
// 11. BÁO CÁO
// =============================================

async function loadReports() {
    try {
        reports = await api('/bao-cao');

        $('reports-body').innerHTML = reports.map(r => `
            <tr>
                <td>${escapeHTML(r.ma_bao_cao)}</td>
                <td>${escapeHTML(r.ten_bao_cao)}</td>
                <td>${escapeHTML(r.ngay_lap)}</td>
                <td>${escapeHTML(r.noi_dung)}</td>
                <td>${escapeHTML(r.nguoi_lap || r.ma_nguoi_lap || '')}</td>
            </tr>
        `).join('');

        if (reports.length === 0) {
            $('reports-body').innerHTML =
                '<tr><td colspan="5">Chưa có báo cáo!</td></tr>';
        }

    } catch (err) {
        $('reports-body').innerHTML =
            `<tr><td colspan="5">${escapeHTML(err.message)}</td></tr>`;
    }
}


// =============================================
// 12. TỔNG QUAN
// =============================================

function updateOverview() {
    $('stat-students').textContent = students.length;
    $('stat-rooms').textContent = rooms.length;

    const capacity = rooms.reduce(
        (sum, r) => sum + Number(r.suc_chua || 0),
        0
    );

    const occupied = rooms.reduce(
        (sum, r) => sum + Number(r.so_nguoi_hien_tai || 0),
        0
    );

    $('stat-empty').textContent = Math.max(
        0,
        capacity - occupied
    );

    const unpaid = invoices
        .filter(i =>
            String(i.trang_thai_thanh_toan)
                .toLowerCase()
                .includes('chua')
        )
        .reduce((sum, i) =>
            sum + Number(i.tong_tien || 0),
            0
        );

    $('stat-unpaid').textContent = money(unpaid);

    $('room-summary').innerHTML = rooms.map(r => `
        <p>
            Phòng ${escapeHTML(r.ma_phong)}:
            ${escapeHTML(r.so_nguoi_hien_tai)}/
            ${escapeHTML(r.suc_chua)} người
        </p>
    `).join('');

    if (rooms.length === 0) {
        $('room-summary').textContent = 'Chưa có dữ liệu phòng!';
    }
}


// =============================================
// 13. NÚT SỬA VÀ XÓA
// =============================================

function actionButtons(type, id) {
    if (currentUser?.vai_tro !== 'admin') {
        return '';
    }

    return `
        <button class="action"
            data-action="edit"
            data-type="${type}"
            data-id="${escapeHTML(id)}">
            Sửa
        </button>

        <button class="action delete"
            data-action="delete"
            data-type="${type}"
            data-id="${escapeHTML(id)}">
            Xóa
        </button>
    `;
}


// Xử lý nút sửa và xóa bằng sự kiện
document.addEventListener('click', function(e) {
    const button = e.target.closest('[data-action]');

    if (!button) return;

    const type = button.dataset.type;
    const id = button.dataset.id;

    if (button.dataset.action === 'edit') {
        editData(type, id);
    }

    if (button.dataset.action === 'delete') {
        deleteData(type, id);
    }
});


// =============================================
// 14. TẠO FORM THÊM VÀ SỬA
// =============================================

function openModal(title, html, type, id = null) {
    currentType = type;
    currentId = id;

    $('modal-title').textContent = title;
    $('form-fields').innerHTML = html;

    $('modal').classList.remove('hidden');
}


function closeModal() {
    $('modal').classList.add('hidden');
    $('data-form').reset();

    currentType = '';
    currentId = null;
}


$('close-modal').addEventListener('click', closeModal);


function inputField(name, label, value = '', type = 'text', required = true) {
    return `
        <label>${label}</label>
        <input
            name="${name}"
            type="${type}"
            value="${escapeHTML(value)}"
            ${required ? 'required' : ''}
        >
    `;
}


// =============================================
// 15. THÊM SINH VIÊN
// =============================================

$('add-student').addEventListener('click', function() {
    openModal('Thêm sinh viên', `
        ${inputField('ma_sinh_vien', 'Mã sinh viên')}
        ${inputField('ho_ten', 'Họ tên')}
        ${inputField('ngay_sinh', 'Ngày sinh', '', 'date')}

        <label>Giới tính</label>
        <select name="gioi_tinh" required>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
        </select>

        ${inputField('lop', 'Lớp', '', 'text', false)}
        ${inputField('khoa', 'Khoa', '', 'text', false)}
        ${inputField('sdt', 'Số điện thoại', '', 'tel', false)}
        ${inputField('dia_chi', 'Địa chỉ', '', 'text', false)}
        ${inputField('ma_phong', 'Mã phòng đăng ký', '', 'text', false)}

        <label>Trạng thái</label>
        <select name="trang_thai_luu_tru">
            <option value="Dang o">Đang ở</option>
            <option value="Da roi">Đã rời</option>
        </select>
    `, 'student');
});


// =============================================
// 16. THÊM PHÒNG
// =============================================

$('add-room').addEventListener('click', function() {
    openModal('Thêm phòng', `
        ${inputField('ma_phong', 'Mã phòng')}
        ${inputField('ten_phong', 'Tên phòng')}
        ${inputField('suc_chua', 'Sức chứa', '4', 'number')}
        ${inputField('ma_khu', 'Mã khu (mặc định KHU01)', 'KHU01')}
        <label>Lưu ý: Mã khu phải tồn tại trong bảng KHU.</label>

        <label>Tình trạng</label>
        <select name="tinh_trang_phong">
            <option value="Con cho">Còn chỗ</option>
            <option value="Trong">Trống</option>
            <option value="Day">Đầy</option>
        </select>
    `, 'room');
});


// =============================================
// 17. THÊM HÓA ĐƠN
// =============================================

$('add-invoice').addEventListener('click', function() {
    openModal('Tạo hóa đơn', `
        ${inputField('ma_sinh_vien', 'Mã sinh viên')}
        ${inputField('tien_phong', 'Tiền phòng', '0', 'number')}
        ${inputField('tien_dien', 'Tiền điện', '0', 'number')}
        ${inputField('tien_nuoc', 'Tiền nước', '0', 'number')}

        <label>Trạng thái thanh toán</label>
        <select name="trang_thai_thanh_toan">
            <option value="Chua thanh toan">Chưa thanh toán</option>
            <option value="Da thanh toan">Đã thanh toán</option>
        </select>
    `, 'invoice');
});


// =============================================
// 18. SỬA DỮ LIỆU
// =============================================

function editData(type, id) {
    if (currentUser?.vai_tro !== 'admin') return;

    let record;
    let html = '';

    // Sửa sinh viên
    if (type === 'student') {
        record = students.find(s =>
            String(s.ma_sinh_vien) === String(id)
        );

        if (!record) return;

        html = `
            ${inputField('ho_ten', 'Họ tên', record.ho_ten)}
            ${inputField(
                'ngay_sinh',
                'Ngày sinh',
                String(record.ngay_sinh || '').slice(0, 10),
                'date'
            )}

            <label>Giới tính</label>
            <select name="gioi_tinh">
                <option value="Nam" ${selected('Nam', record.gioi_tinh)}>Nam</option>
                <option value="Nữ" ${selected('Nữ', record.gioi_tinh)}>Nữ</option>
                <option value="Khác" ${selected('Khác', record.gioi_tinh)}>Khác</option>
            </select>

            ${inputField('lop', 'Lớp', record.lop || '', 'text', false)}
            ${inputField('khoa', 'Khoa', record.khoa || '', 'text', false)}
            ${inputField('sdt', 'Số điện thoại', record.sdt || '', 'tel', false)}
            ${inputField('dia_chi', 'Địa chỉ', record.dia_chi || '', 'text', false)}
            ${inputField('ma_phong', 'Mã phòng đăng ký', record.ma_phong || '', 'text', false)}

            <label>Trạng thái</label>
            <select name="trang_thai_luu_tru">
                <option value="Dang o" ${selected('Dang o', record.trang_thai_luu_tru)}>Đang ở</option>
                <option value="Da roi" ${selected('Da roi', record.trang_thai_luu_tru)}>Đã rời</option>
            </select>
        `;
    }

    // Sửa phòng
    if (type === 'room') {
        record = rooms.find(r =>
            String(r.ma_phong) === String(id)
        );

        if (!record) return;

        html = `
            ${inputField('ten_phong', 'Tên phòng', record.ten_phong)}
            ${inputField('suc_chua', 'Sức chứa', record.suc_chua, 'number')}
            ${inputField('ma_khu', 'Mã khu', record.ma_khu || 'KHU01')}

            <label>Tình trạng</label>
            <select name="tinh_trang_phong">
                <option value="Con cho" ${selected('Con cho', record.tinh_trang_phong)}>Còn chỗ</option>
                <option value="Trong" ${selected('Trong', record.tinh_trang_phong)}>Trống</option>
                <option value="Day" ${selected('Day', record.tinh_trang_phong)}>Đầy</option>
            </select>
        `;
    }

    // Sửa hóa đơn
    if (type === 'invoice') {
        record = invoices.find(i =>
            String(i.ma_hoa_don) === String(id)
        );

        if (!record) return;

        html = `
            ${inputField('ma_sinh_vien', 'Mã sinh viên', record.ma_sinh_vien)}
            ${inputField('tien_phong', 'Tiền phòng', record.tien_phong, 'number')}
            ${inputField('tien_dien', 'Tiền điện', record.tien_dien, 'number')}
            ${inputField('tien_nuoc', 'Tiền nước', record.tien_nuoc, 'number')}

            <label>Trạng thái thanh toán</label>
            <select name="trang_thai_thanh_toan">
                <option value="Chua thanh toan" ${selected('Chua thanh toan', record.trang_thai_thanh_toan)}>Chưa thanh toán</option>
                <option value="Da thanh toan" ${selected('Da thanh toan', record.trang_thai_thanh_toan)}>Đã thanh toán</option>
            </select>
        `;
    }

    if (!record) return;

    openModal('Cập nhật dữ liệu', html, type, id);
}


// =============================================
// 19. LƯU DỮ LIỆU
// =============================================

$('data-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = getFormData(e.target);

    const config = {
        student: '/sinh-vien',
        room: '/phong',
        invoice: '/tai-chinh'
    };

    const basePath = config[currentType];

    if (!basePath) {
        alert('Không xác định được loại dữ liệu!');
        return;
    }

    const url = basePath +
        (currentId !== null
            ? '/' + encodeURIComponent(currentId)
            : '');

    const method = currentId !== null ? 'PUT' : 'POST';

    try {
        await api(url, method, data);

        alert('Lưu dữ liệu thành công!');

        closeModal();

        if (currentType === 'student') {
            await loadStudents();
        }

        if (currentType === 'room') {
            await loadRooms();
        }

        if (currentType === 'invoice') {
            await loadFinance();
        }

        updateOverview();

    } catch (err) {
        alert('Lỗi: ' + err.message);
    }
});


// =============================================
// 20. XÓA DỮ LIỆU
// =============================================

async function deleteData(type, id) {
    if (currentUser?.vai_tro !== 'admin') return;

    const confirmDelete = confirm(
        'Bạn có chắc chắn muốn xóa dữ liệu này không?'
    );

    if (!confirmDelete) return;

    const paths = {
        student: '/sinh-vien/',
        room: '/phong/',
        invoice: '/tai-chinh/'
    };

    try {
        await api(
            paths[type] + encodeURIComponent(id),
            'DELETE'
        );

        alert('Xóa dữ liệu thành công!');

        if (type === 'student') await loadStudents();
        if (type === 'room') await loadRooms();
        if (type === 'invoice') await loadFinance();

        updateOverview();

    } catch (err) {
        alert('Không thể xóa: ' + err.message);
    }
}


// =============================================
// 21. TÌM KIẾM
// =============================================

$('student-search').addEventListener('input', renderStudents);

$('room-search').addEventListener('input', renderRooms);

$('finance-search').addEventListener('input', renderFinance);


// =============================================
// 22. KẾT THÚC
// =============================================

console.log('JavaScript quản lý ký túc xá đã tải thành công!');
