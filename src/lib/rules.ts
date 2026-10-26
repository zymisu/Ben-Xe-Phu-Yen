/** Quy tắc định dạng dùng chung cho nhiều chức năng */

/** Số điện thoại Việt Nam, cho phép khoảng trắng và đầu số +84 */
export const PHONE = /^(0|\+84)(\s?\d){9,10}$/;

/** Biển số xe, viết hoa trước khi kiểm tra, ví dụ 78B-012.34 */
export const PLATE = /^\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}$/;

export const normalizePlate = (s: string) => s.trim().toUpperCase();
