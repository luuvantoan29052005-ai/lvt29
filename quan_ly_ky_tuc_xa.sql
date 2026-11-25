-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Máy chủ: mysql:3306
-- Thời gian đã tạo: Th10 25, 2026 lúc 07:28 AM
-- Phiên bản máy phục vụ: 8.0.46
-- Phiên bản PHP: 8.3.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `ql_ky_tuc_xa`
--
CREATE DATABASE IF NOT EXISTS `ql_ky_tuc_xa` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ql_ky_tuc_xa`;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `DANGKY`
--

CREATE TABLE `DANGKY` (
  `MaDK` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayDK` date DEFAULT NULL,
  `NgayNhanPhong` date DEFAULT NULL,
  `NgayTraPhong` date DEFAULT NULL,
  `TrangThai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaSV` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaPhong` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `HOADON`
--

CREATE TABLE `HOADON` (
  `MaHD` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Thang` int DEFAULT NULL,
  `Nam` int DEFAULT NULL,
  `TienPhong` decimal(10,2) DEFAULT NULL,
  `TienDien` decimal(10,2) DEFAULT NULL,
  `TienNuoc` decimal(10,2) DEFAULT NULL,
  `TongTien` decimal(10,2) DEFAULT NULL,
  `MaSV` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `KHU`
--

CREATE TABLE `KHU` (
  `MaKhu` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenKhu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiaChi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `PHONG`
--

CREATE TABLE `PHONG` (
  `MaPhong` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenPhong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SucChua` int DEFAULT NULL,
  `TrangThai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaKhu` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `SINHVIEN`
--

CREATE TABLE `SINHVIEN` (
  `MaSV` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HoTen` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgaySinh` date DEFAULT NULL,
  `GioiTinh` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Lop` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Khoa` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SDT` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DiaChi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `THANHTOAN`
--

CREATE TABLE `THANHTOAN` (
  `MaTT` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayTT` date DEFAULT NULL,
  `SoTien` decimal(10,2) DEFAULT NULL,
  `PhuongThuc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MaHD` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `DANGKY`
--
ALTER TABLE `DANGKY`
  ADD PRIMARY KEY (`MaDK`),
  ADD KEY `MaSV` (`MaSV`),
  ADD KEY `MaPhong` (`MaPhong`);

--
-- Chỉ mục cho bảng `HOADON`
--
ALTER TABLE `HOADON`
  ADD PRIMARY KEY (`MaHD`),
  ADD KEY `MaSV` (`MaSV`);

--
-- Chỉ mục cho bảng `KHU`
--
ALTER TABLE `KHU`
  ADD PRIMARY KEY (`MaKhu`);

--
-- Chỉ mục cho bảng `PHONG`
--
ALTER TABLE `PHONG`
  ADD PRIMARY KEY (`MaPhong`),
  ADD KEY `MaKhu` (`MaKhu`);

--
-- Chỉ mục cho bảng `SINHVIEN`
--
ALTER TABLE `SINHVIEN`
  ADD PRIMARY KEY (`MaSV`);

--
-- Chỉ mục cho bảng `THANHTOAN`
--
ALTER TABLE `THANHTOAN`
  ADD PRIMARY KEY (`MaTT`),
  ADD KEY `MaHD` (`MaHD`);

--
-- Ràng buộc đối với các bảng kết xuất
--

--
-- Ràng buộc cho bảng `DANGKY`
--
ALTER TABLE `DANGKY`
  ADD CONSTRAINT `DANGKY_ibfk_1` FOREIGN KEY (`MaSV`) REFERENCES `SINHVIEN` (`MaSV`),
  ADD CONSTRAINT `DANGKY_ibfk_2` FOREIGN KEY (`MaPhong`) REFERENCES `PHONG` (`MaPhong`);

--
-- Ràng buộc cho bảng `HOADON`
--
ALTER TABLE `HOADON`
  ADD CONSTRAINT `HOADON_ibfk_1` FOREIGN KEY (`MaSV`) REFERENCES `SINHVIEN` (`MaSV`);

--
-- Ràng buộc cho bảng `PHONG`
--
ALTER TABLE `PHONG`
  ADD CONSTRAINT `PHONG_ibfk_1` FOREIGN KEY (`MaKhu`) REFERENCES `KHU` (`MaKhu`);

--
-- Ràng buộc cho bảng `THANHTOAN`
--
ALTER TABLE `THANHTOAN`
  ADD CONSTRAINT `THANHTOAN_ibfk_1` FOREIGN KEY (`MaHD`) REFERENCES `HOADON` (`MaHD`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
