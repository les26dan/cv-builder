import { Suspense } from "react";
import Header from "@/components/auth/Header";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <Suspense fallback={
        <main className="flex-1 flex justify-center items-center px-4 py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">Đang tải...</p>
          </div>
        </main>
      }>
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
            <header className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Điều Khoản Dịch Vụ
              </h1>
              <p className="text-gray-600 text-lg">
                Cập nhật lần cuối: Tháng 1, 2025
              </p>
            </header>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Chấp Nhận Điều Khoản</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Bằng việc truy cập và sử dụng dịch vụ OkBuddy, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản và điều kiện này. 
                  Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được sử dụng dịch vụ của chúng tôi.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Mô Tả Dịch Vụ</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  OkBuddy là một nền tảng trực tuyến giúp người dùng tạo, chỉnh sửa và tối ưu hóa CV (Curriculum Vitae) 
                  của họ để phù hợp với các mô tả công việc cụ thể. Dịch vụ bao gồm:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Công cụ chỉnh sửa CV trực tuyến</li>
                  <li>Phân tích và tối ưu hóa CV theo mô tả công việc</li>
                  <li>Đề xuất cải thiện nội dung CV</li>
                  <li>Xuất CV dưới nhiều định dạng khác nhau</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Tài Khoản Người Dùng</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Để sử dụng một số tính năng của dịch vụ, bạn cần tạo tài khoản. Bạn có trách nhiệm:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Cung cấp thông tin chính xác và đầy đủ khi đăng ký</li>
                  <li>Duy trì tính bảo mật của thông tin đăng nhập</li>
                  <li>Thông báo ngay lập tức cho chúng tôi về bất kỳ việc sử dụng trái phép nào</li>
                  <li>Chỉ tạo một tài khoản cho mỗi người</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Quyền Riêng Tư và Dữ Liệu</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Việc thu thập, sử dụng và chia sẻ thông tin của bạn 
                  được quy định trong Chính Sách Quyền Riêng Tư của chúng tôi. Bằng việc sử dụng dịch vụ, 
                  bạn đồng ý với việc xử lý dữ liệu như được mô tả trong chính sách đó.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Sử Dụng Được Chấp Nhận</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Bạn đồng ý sử dụng dịch vụ chỉ cho các mục đích hợp pháp và theo cách không vi phạm quyền của bên thứ ba. 
                  Bạn không được:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Tải lên nội dung vi phạm pháp luật, có hại hoặc không phù hợp</li>
                  <li>Cố gắng truy cập trái phép vào hệ thống hoặc dữ liệu của người khác</li>
                  <li>Sử dụng dịch vụ để spam hoặc quấy rối người khác</li>
                  <li>Sao chép, sửa đổi hoặc phân phối nội dung của dịch vụ mà không có sự cho phép</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Quyền Sở Hữu Trí Tuệ</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dịch vụ OkBuddy và tất cả nội dung, tính năng và chức năng của nó là tài sản của chúng tôi 
                  và được bảo vệ bởi luật bản quyền, nhãn hiệu và các luật sở hữu trí tuệ khác.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Chấm Dứt</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Chúng tôi có thể chấm dứt hoặc đình chỉ tài khoản của bạn ngay lập tức, không cần thông báo trước, 
                  vì bất kỳ lý do gì, bao gồm nhưng không giới hạn ở việc vi phạm các Điều khoản Dịch vụ này.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Tuyên Bố Từ Chối Trách Nhiệm</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Dịch vụ được cung cấp "như hiện tại" và "như có sẵn" mà không có bất kỳ bảo đảm nào. 
                  Chúng tôi không đảm bảo rằng dịch vụ sẽ không bị gián đoạn, an toàn hoặc không có lỗi.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Liên Hệ</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản Dịch vụ này, vui lòng liên hệ với chúng tôi qua:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">
                    <strong>Email:</strong> support@okbuddy.com<br/>
                    <strong>Website:</strong> www.okbuddy.com
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Các điều khoản này có thể được cập nhật theo thời gian. 
                Phiên bản mới nhất sẽ luôn có sẵn trên trang web này.
              </p>
            </div>
          </div>
        </main>
      </Suspense>
    </div>
  );
} 