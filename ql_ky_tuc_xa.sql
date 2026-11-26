
-- ==========================================
-- DATABASE QUAN LY KY TUC XA
-- ==========================================

CREATE DATABASE IF NOT EXISTS ql_ky_tuc_xa
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ql_ky_tuc_xa;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. BANG KHU
-- ==========================================

CREATE TABLE IF NOT EXISTS KHU (
    MaKhu VARCHAR(10) NOT NULL,
    TenKhu VARCHAR(50) DEFAULT NULL,
    DiaChi VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (MaKhu)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. BANG PHONG
-- ==========================================

CREATE TABLE IF NOT EXISTS PHONG (
    MaPhong VARCHAR(10) NOT NULL,
    TenPhong VARCHAR(50) DEFAULT NULL,
    SucChua INT DEFAULT NULL,
    TrangThai VARCHAR(20) DEFAULT NULL,
    MaKhu VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (MaPhong),
    KEY idx_phong_makhu (MaKhu),
    CONSTRAINT fk_phong_khu
        FOREIGN KEY (MaKhu)
        REFERENCES KHU(MaKhu)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. BANG SINH VIEN
-- ==========================================

CREATE TABLE IF NOT EXISTS SINHVIEN (
    MaSV VARCHAR(10) NOT NULL,
    HoTen VARCHAR(50) DEFAULT NULL,
    NgaySinh DATE DEFAULT NULL,
    GioiTinh VARCHAR(10) DEFAULT NULL,
    Lop VARCHAR(20) DEFAULT NULL,
    Khoa VARCHAR(50) DEFAULT NULL,
    SDT VARCHAR(15) DEFAULT NULL,
    DiaChi VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (MaSV)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. BANG DANG KY
-- ==========================================

CREATE TABLE IF NOT EXISTS DANGKY (
    MaDK VARCHAR(10) NOT NULL,
    NgayDK DATE DEFAULT NULL,
    NgayNhanPhong DATE DEFAULT NULL,
    NgayTraPhong DATE DEFAULT NULL,
    TrangThai VARCHAR(20) DEFAULT NULL,
    MaSV VARCHAR(10) DEFAULT NULL,
    MaPhong VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (MaDK),
    KEY idx_dangky_masv (MaSV),
    KEY idx_dangky_maphong (MaPhong),
    CONSTRAINT fk_dangky_sinhvien
        FOREIGN KEY (MaSV)
        REFERENCES SINHVIEN(MaSV),
    CONSTRAINT fk_dangky_phong
        FOREIGN KEY (MaPhong)
        REFERENCES PHONG(MaPhong)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. BANG HOA DON
-- ==========================================

CREATE TABLE IF NOT EXISTS HOADON (
    MaHD VARCHAR(10) NOT NULL,
    Thang INT DEFAULT NULL,
    Nam INT DEFAULT NULL,
    TienPhong DECIMAL(10,2) DEFAULT NULL,
    TienDien DECIMAL(10,2) DEFAULT NULL,
    TienNuoc DECIMAL(10,2) DEFAULT NULL,
    TongTien DECIMAL(10,2) DEFAULT NULL,
    MaSV VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (MaHD),
    KEY idx_hoadon_masv (MaSV),
    CONSTRAINT fk_hoadon_sinhvien
        FOREIGN KEY (MaSV)
        REFERENCES SINHVIEN(MaSV)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. BANG THANH TOAN
-- ==========================================

CREATE TABLE IF NOT EXISTS THANHTOAN (
    MaTT VARCHAR(10) NOT NULL,
    NgayTT DATE DEFAULT NULL,
    SoTien DECIMAL(10,2) DEFAULT NULL,
    PhuongThuc VARCHAR(20) DEFAULT NULL,
    MaHD VARCHAR(10) DEFAULT NULL,
    PRIMARY KEY (MaTT),
    KEY idx_thanhtoan_mahd (MaHD),
    CONSTRAINT fk_thanhtoan_hoadon
        FOREIGN KEY (MaHD)
        REFERENCES HOADON(MaHD)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- KET THUC DATABASE
-- ==========================================
