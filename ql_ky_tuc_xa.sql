-- 1. Tạo Database
CREATE DATABASE IF NOT EXISTS ql_ky_tuc_xa
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ql_ky_tuc_xa;

-- 2. Bảng quản lý hệ thống
CREATE TABLE quan_ly_he_thong (
    ma_he_thong INT PRIMARY KEY AUTO_INCREMENT,
    ten_tai_khoan VARCHAR(50) NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    vai_tro VARCHAR(50)
);

-- 3. Bảng quản lý sinh viên và lưu trú
CREATE TABLE quan_ly_sinh_vien (
    ma_sinh_vien VARCHAR(20) PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    ngay_sinh DATE,
    gioi_tinh VARCHAR(10),
    ma_phong VARCHAR(20),
    trang_thai_luu_tru VARCHAR(50)
);

-- 4. Bảng quản lý phòng và cơ sở vật chất
CREATE TABLE quan_ly_phong (
    ma_phong VARCHAR(20) PRIMARY KEY,
    ten_phong VARCHAR(50),
    suc_chua INT,
    so_nguoi_hien_tai INT,
    tinh_trang_phong VARCHAR(50)
);

-- 5. Bảng quản lý tài chính và dịch vụ
CREATE TABLE quan_ly_tai_chinh (
    ma_hoa_don INT PRIMARY KEY AUTO_INCREMENT,
    ma_sinh_vien VARCHAR(20),
    tien_phong DECIMAL(12,2),
    tien_dien DECIMAL(12,2),
    tien_nuoc DECIMAL(12,2),
    tong_tien DECIMAL(12,2),
    trang_thai_thanh_toan VARCHAR(50)
);

-- 6. Bảng thống kê và báo cáo
CREATE TABLE thong_ke_bao_cao (
    ma_bao_cao INT PRIMARY KEY AUTO_INCREMENT,
    ten_bao_cao VARCHAR(100),
    ngay_lap DATE,
    noi_dung TEXT,
    nguoi_lap VARCHAR(100)
);
USE ql_ky_tuc_xa;

-- 7. Sinh viên thuộc một phòng
ALTER TABLE quan_ly_sinh_vien
ADD CONSTRAINT fk_sv_phong
FOREIGN KEY (ma_phong)
REFERENCES quan_ly_phong(ma_phong);

-- 8. Hóa đơn thuộc một sinh viên
ALTER TABLE quan_ly_tai_chinh
ADD CONSTRAINT fk_tc_sv
FOREIGN KEY (ma_sinh_vien)
REFERENCES quan_ly_sinh_vien(ma_sinh_vien);

-- 9. Tài khoản quản lý tạo hóa đơn
ALTER TABLE quan_ly_tai_chinh
ADD ma_nguoi_tao INT,
ADD CONSTRAINT fk_tc_ht
FOREIGN KEY (ma_nguoi_tao)
REFERENCES quan_ly_he_thong(ma_he_thong);

-- 10. Tài khoản quản lý lập báo cáo
ALTER TABLE thong_ke_bao_cao
ADD ma_nguoi_lap INT,
ADD CONSTRAINT fk_bc_ht
FOREIGN KEY (ma_nguoi_lap)
REFERENCES quan_ly_he_thong(ma_he_thong);