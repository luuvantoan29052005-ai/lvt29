-- DATABASE QUAN LY KY TUC XA - DUNG CHINH XAC 6 BANG
-- CANH BAO: Script se xoa 5 bang cu quan_ly_* va du lieu trong cac bang do.
-- Cac bang KHU/PHONG/SINHVIEN/DANGKY/HOADON/THANHTOAN da ton tai se duoc giu nguyen.
CREATE DATABASE IF NOT EXISTS ql_ky_tuc_xa
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ql_ky_tuc_xa;

-- Xoa cac bang cu cua phien ban truoc de database con dung 6 bang moi.
-- CANH BAO: cac bang cu va du lieu ben trong se bi xoa.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `quan_ly_tai_chinh`;
DROP TABLE IF EXISTS `thong_ke_bao_cao`;
DROP TABLE IF EXISTS `quan_ly_sinh_vien`;
DROP TABLE IF EXISTS `quan_ly_phong`;
DROP TABLE IF EXISTS `quan_ly_he_thong`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS `KHU` (
  `MaKhu` VARCHAR(20) PRIMARY KEY,
  `TenKhu` VARCHAR(100) NOT NULL,
  `DiaChi` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PHONG` (
  `MaPhong` VARCHAR(20) PRIMARY KEY,
  `TenPhong` VARCHAR(100) NOT NULL,
  `SucChua` INT NOT NULL DEFAULT 0,
  `TrangThai` VARCHAR(50) NOT NULL DEFAULT 'Con cho',
  `MaKhu` VARCHAR(20) NOT NULL,
  CONSTRAINT `fk_phong_khu` FOREIGN KEY (`MaKhu`) REFERENCES `KHU` (`MaKhu`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SINHVIEN` (
  `MaSV` VARCHAR(20) PRIMARY KEY,
  `HoTen` VARCHAR(100) NOT NULL,
  `NgaySinh` DATE NULL,
  `GioiTinh` VARCHAR(20) NULL,
  `Lop` VARCHAR(50) NULL,
  `Khoa` VARCHAR(100) NULL,
  `SDT` VARCHAR(20) NULL,
  `DiaChi` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DANGKY` (
  `MaDK` INT AUTO_INCREMENT PRIMARY KEY,
  `NgayDK` DATE NOT NULL,
  `NgayNhanPhong` DATE NULL,
  `NgayTraPhong` DATE NULL,
  `TrangThai` VARCHAR(50) NOT NULL DEFAULT 'Dang o',
  `MaSV` VARCHAR(20) NOT NULL,
  `MaPhong` VARCHAR(20) NOT NULL,
  CONSTRAINT `fk_dangky_sinhvien` FOREIGN KEY (`MaSV`) REFERENCES `SINHVIEN` (`MaSV`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_dangky_phong` FOREIGN KEY (`MaPhong`) REFERENCES `PHONG` (`MaPhong`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_dangky_phong_trangthai` (`MaPhong`, `TrangThai`),
  INDEX `idx_dangky_sinhvien` (`MaSV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HOADON` (
  `MaHD` INT AUTO_INCREMENT PRIMARY KEY,
  `Thang` TINYINT NOT NULL,
  `Nam` SMALLINT NOT NULL,
  `TienPhong` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `TienDien` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `TienNuoc` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `TongTien` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `MaSV` VARCHAR(20) NOT NULL,
  CONSTRAINT `fk_hoadon_sinhvien` FOREIGN KEY (`MaSV`) REFERENCES `SINHVIEN` (`MaSV`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_hoadon_sinhvien` (`MaSV`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `THANHTOAN` (
  `MaTT` INT AUTO_INCREMENT PRIMARY KEY,
  `NgayTT` DATE NOT NULL,
  `SoTien` DECIMAL(12,2) NOT NULL,
  `PhuongThuc` VARCHAR(50) NULL,
  `MaHD` INT NOT NULL,
  CONSTRAINT `fk_thanhtoan_hoadon` FOREIGN KEY (`MaHD`) REFERENCES `HOADON` (`MaHD`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_thanhtoan_hoadon` (`MaHD`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tao khu mau de co the them phong ngay. Co the sua ten/dia chi sau.
INSERT IGNORE INTO `KHU` (`MaKhu`, `TenKhu`, `DiaChi`) VALUES ('KHU01', 'Khu A', NULL);

SHOW TABLES;
