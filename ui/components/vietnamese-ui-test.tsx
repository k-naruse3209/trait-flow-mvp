'use client';

import { useState } from 'react';

export function VietnameseUITest() {
  const [inputValue, setInputValue] = useState('Nhập văn bản tiếng Việt...');
  const [textareaValue, setTextareaValue] = useState('Đây là một đoạn văn dài để test font rendering trong textarea với nhiều dấu thanh phức tạp như: àáảãạ ăằắẳẵặ âầấẩẫậ êềếểễệ ôồốổỗộ ơờớởỡợ ưừứửữự.');

  return (
    <div className="space-y-6">
      {/* Headings Test */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Vietnamese Headings Test</h2>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">H1: Tiêu đề chính với dấu thanh</h1>
          <h2 className="text-3xl font-semibold">H2: Phụ đề quan trọng</h2>
          <h3 className="text-2xl font-medium">H3: Tiêu đề cấp ba</h3>
          <h4 className="text-xl">H4: Tiêu đề nhỏ hơn</h4>
          <h5 className="text-lg">H5: Tiêu đề rất nhỏ</h5>
          <h6 className="text-base font-semibold">H6: Tiêu đề nhỏ nhất</h6>
        </div>
      </div>

      {/* Buttons Test */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Vietnamese Buttons Test</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Đăng nhập
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90">
            Đăng ký tài khoản
          </button>
          <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90">
            Xóa dữ liệu
          </button>
          <button className="px-4 py-2 border border-input rounded hover:bg-accent">
            Hủy bỏ thao tác
          </button>
        </div>
      </div>

      {/* Form Elements Test */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Vietnamese Form Elements Test</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nhập tên đầy đủ:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nguyễn Văn A"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Mô tả chi tiết:
            </label>
            <textarea
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Nhập mô tả với các dấu thanh..."
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Tôi đồng ý với điều khoản sử dụng</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Chọn tỉnh thành:
            </label>
            <select className="w-full px-3 py-2 border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring">
              <option>Hà Nội</option>
              <option>Thành phố Hồ Chí Minh</option>
              <option>Đà Nẵng</option>
              <option>Hải Phòng</option>
              <option>Cần Thơ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards and Content Test */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Vietnamese Content Cards Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Thông báo quan trọng</h3>
            <p className="text-sm text-muted-foreground">
              Hệ thống sẽ được bảo trì vào ngày mai từ 2:00 đến 4:00 sáng. 
              Trong thời gian này, các tính năng có thể bị gián đoạn.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Cập nhật mới</h3>
            <p className="text-sm text-muted-foreground">
              Phiên bản mới đã được phát hành với nhiều tính năng cải tiến 
              và sửa lỗi để mang lại trải nghiệm tốt hơn.
            </p>
          </div>
        </div>
      </div>

      {/* Lists Test */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Vietnamese Lists Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Danh sách có thứ tự:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Đăng nhập vào hệ thống</li>
              <li>Chọn chức năng cần sử dụng</li>
              <li>Điền thông tin cần thiết</li>
              <li>Kiểm tra và xác nhận</li>
              <li>Hoàn thành quy trình</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Danh sách không thứ tự:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Giao diện thân thiện với người dùng</li>
              <li>Tốc độ xử lý nhanh chóng</li>
              <li>Bảo mật thông tin cao</li>
              <li>Hỗ trợ đa ngôn ngữ</li>
              <li>Tương thích nhiều thiết bị</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Table Test */}
      <div className="p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Vietnamese Table Test</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Tên sản phẩm</th>
                <th className="border border-border px-4 py-2 text-left">Mô tả</th>
                <th className="border border-border px-4 py-2 text-left">Giá tiền</th>
                <th className="border border-border px-4 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">Điện thoại thông minh</td>
                <td className="border border-border px-4 py-2">Màn hình lớn, camera chất lượng cao</td>
                <td className="border border-border px-4 py-2">15.000.000 VNĐ</td>
                <td className="border border-border px-4 py-2">Còn hàng</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">Máy tính xách tay</td>
                <td className="border border-border px-4 py-2">Hiệu năng cao, thiết kế mỏng nhẹ</td>
                <td className="border border-border px-4 py-2">25.000.000 VNĐ</td>
                <td className="border border-border px-4 py-2">Hết hàng</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}