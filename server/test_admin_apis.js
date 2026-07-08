import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'tranbinhvuong12345@gmail.com';
const ADMIN_PASSWORD = 'password123';

async function test() {
  try {
    console.log('=== KHỞI ĐỘNG HỆ THỐNG KIỂM THỬ API ADMIN ===');

    // 1. Đăng nhập để lấy Token JWT
    console.log('\n[1/5] Đang đăng nhập tài khoản Admin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = loginRes.data.token;
    console.log('✓ Đăng nhập thành công! Token:', token.substring(0, 30) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Lấy danh sách lớp học hệ thống
    console.log('\n[2/5] Đang kiểm tra API GET /api/classes/admin (Danh sách lớp)...');
    const listRes = await axios.get(`${API_URL}/classes/admin`, { headers });
    const classes = listRes.data.data;
    console.log(`✓ Lấy danh sách lớp thành công! Phát hiện ${classes.length} lớp học.`);
    if (classes.length === 0) {
      console.log('⚠ Không có lớp học nào trên hệ thống. Hãy tạo một lớp học để tiếp tục.');
      return;
    }
    
    // Chọn lớp học và học sinh để chạy thử nghiệm
    const testClass = classes[0];
    console.log(`-> Sử dụng lớp: "${testClass.name}" (ID: ${testClass._id})`);

    // Tìm một học sinh trên hệ thống (Sử dụng API get-student hoặc tìm từ lớp học hiện tại)
    const testStudentId = '6a49973a2f565a5da85ac3dd'; // Học sinh Tran Binh Vuong
    console.log(`-> Sử dụng học sinh ID: ${testStudentId}`);

    // 3. Kiểm tra Force Enroll (Buộc gia nhập lớp)
    console.log(`\n[3/5] Đang kiểm tra API POST /api/classes/admin/${testClass._id}/enroll...`);
    try {
      const enrollRes = await axios.post(`${API_URL}/classes/admin/${testClass._id}/enroll`, {
        studentId: testStudentId
      }, { headers });
      console.log('✓ Học sinh gia nhập lớp thành công! Danh sách học sinh mới:', enrollRes.data.data.students);
    } catch (err) {
      if (err.response?.data?.message?.includes('already in this class')) {
        console.log('✓ Học sinh đã ở sẵn trong lớp (Bỏ qua bước này).');
      } else {
        throw err;
      }
    }

    // 4. Kiểm tra Transfer Student (Điều chuyển học sinh)
    if (classes.length >= 2) {
      const classB = classes[1];
      console.log(`\n[4/5] Đang kiểm tra API POST /api/classes/admin/transfer (Chuyển sang lớp "${classB.name}")...`);
      const transferRes = await axios.post(`${API_URL}/classes/admin/transfer`, {
        studentId: testStudentId,
        fromClassId: testClass._id,
        toClassId: classB._id
      }, { headers });
      console.log('✓ Điều chuyển thành công! Kết quả:', transferRes.data.message);

      // Chuyển ngược lại về lớp cũ để bảo toàn dữ liệu ban đầu
      console.log(`-> Đang điều chuyển học sinh ngược lại về lớp cũ...`);
      await axios.post(`${API_URL}/classes/admin/transfer`, {
        studentId: testStudentId,
        fromClassId: classB._id,
        toClassId: testClass._id
      }, { headers });
      console.log('✓ Trả học sinh về lớp ban đầu thành công!');
    } else {
      console.log('\n[4/5] Bỏ qua kiểm tra chuyển lớp (Hệ thống cần ít nhất 2 lớp để test chuyển lớp).');
    }

    // 5. Kiểm tra Force Unenroll (Hủy gia nhập)
    console.log(`\n[5/5] Đang kiểm tra API POST /api/classes/admin/${testClass._id}/unenroll...`);
    const unenrollRes = await axios.post(`${API_URL}/classes/admin/${testClass._id}/unenroll`, {
      studentId: testStudentId
    }, { headers });
    console.log('✓ Trục xuất học sinh khỏi lớp thành công! Sĩ số lớp hiện tại:', unenrollRes.data.data.students.length);

    // Điền lại học sinh vào lớp ban đầu để giữ tính nguyên vẹn dữ liệu
    console.log('-> Đang thêm học sinh lại vào lớp ban đầu...');
    await axios.post(`${API_URL}/classes/admin/${testClass._id}/enroll`, {
      studentId: testStudentId
    }, { headers });
    console.log('✓ Đã khôi phục trạng thái ban đầu của học sinh!');

    console.log('\n=== TẤT CẢ KIỂM THỬ API ADMIN ĐỀU ĐẠT CHUẨN THÀNH CÔNG ===');
  } catch (err) {
    console.error('\n✗ Kiểm thử thất bại. Chi tiết lỗi:', err.response?.data?.message || err.message);
  }
}

test();
