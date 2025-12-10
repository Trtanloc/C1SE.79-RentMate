const bcrypt = require('bcrypt');

const passwords = {
  tenant: 'Tenant@123',
  landlord: 'Landlord@123',
  admin: 'Admin@123'
};

async function taoHash() {
  console.log('Đang tạo hash mật khẩu...\n');
  
  for (const [vaiTro, matKhau] of Object.entries(passwords)) {
    try {
      const hash = await bcrypt.hash(matKhau, 10);
      console.log(`Vai trò: ${vaiTro}`);
      console.log(`Mật khẩu: ${matKhau}`);
      console.log(`Hash: ${hash}`);
      console.log('-------------------\n');
    } catch (loi) {
      console.error(`Lỗi khi hash ${vaiTro}:`, loi);
    }
  }
  
  console.log('Đã tạo xong tất cả hash!');
}

taoHash();