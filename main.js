// ============================================================================
// HỆ THỐNG QUẢN LÝ LƯU CHUYỂN SÁCH THƯ VIỆN
// ============================================================================

// 1. Khởi tạo mảng lưu trữ nhật ký lưu chuyển (Database giả lập)
let circulationLogs = [];
let nextLogId = 1;

/**
 * [CREATE] Mượn sách mới
 */
const borrowBook = (studentCode, bookIsbn) => {
  if (!studentCode || !bookIsbn) {
    console.log(`[LỖI] Thiếu thông tin sinh viên hoặc mã sách.`);
    return;
  }

  const newLog = {
    logId: `LOG_${nextLogId++}`,
    studentCode: studentCode,
    bookIsbn: bookIsbn,
    status: "BORROWING", // Trạng thái mặc định khi mượn
    fineAmount: 0,
    daysSinceCompletion: 0, // Biến giả lập để tính toán thời gian lưu trữ
  };

  circulationLogs.push(newLog);
  console.log(
    `[MƯỢN SÁCH] Sinh viên ${studentCode} mượn sách ${bookIsbn} thành công. (Mã giao dịch: ${newLog.logId})`,
  );
};

/**
 * [UPDATE] Trả sách & Tính phạt
 */
const processReturn = (logId, returnStatus, overdueDays = 0) => {
  const log = circulationLogs.find((log) => log.logId === logId);

  if (!log) {
    console.log(`[LỖI] Không tìm thấy giao dịch với mã: ${logId}`);
    return;
  }

  if (log.status !== "BORROWING") {
    console.log(`[CẢNH BÁO] Giao dịch ${logId} đã được xử lý trước đó!`);
    return;
  }

  log.status = returnStatus;

  // Quyết toán phí phạt
  if (returnStatus === "LOST") {
    log.fineAmount = 200000; // Phạt mất sách
    console.log(
      `[TRẢ SÁCH - MẤT SÁCH] Giao dịch ${logId}: Phạt đền bù sách 200,000 VNĐ.`,
    );
  } else if (returnStatus === "RETURNED" && overdueDays > 0) {
    log.fineAmount = overdueDays * 5000; // Phạt trễ hạn 5k/ngày
    console.log(
      `[TRẢ SÁCH - TRỄ HẠN] Giao dịch ${logId}: Trễ ${overdueDays} ngày. Phạt ${log.fineAmount.toLocaleString()} VNĐ.`,
    );
  } else {
    console.log(
      `[TRẢ SÁCH - ĐÚNG HẠN] Giao dịch ${logId}: Hoàn tất không phát sinh phí.`,
    );
  }

  // Đặt lại thời gian lưu trữ giả lập (bắt đầu đếm thời gian kể từ khi hoàn tất)
  log.daysSinceCompletion = 1;
};

/**
 * [DELETE] Xóa nhật ký đã hoàn tất quá 30 ngày để tối ưu bộ nhớ
 */
const cleanupOldLogs = () => {
  const initialLength = circulationLogs.length;

  // Dùng filter để giữ lại các bản ghi đang mượn hoặc hoàn tất dưới 30 ngày
  circulationLogs = circulationLogs.filter((log) => {
    const isCompleted = log.status === "RETURNED" || log.status === "LOST";
    const isOld = log.daysSinceCompletion >= 30;
    return !(isCompleted && isOld);
  });

  const deletedCount = initialLength - circulationLogs.length;
  console.log(
    `[DỌN DẸP] Đã xóa ${deletedCount} bản ghi quá 30 ngày khỏi hệ thống.`,
  );
};

/**
 * [READ] Báo cáo tổng kết lưu chuyển cuối ngày
 */
const generateDailyReport = () => {
  // Đếm số lượng sách đang mượn bằng filter
  const activeBorrowings = circulationLogs.filter(
    (log) => log.status === "BORROWING",
  ).length;

  // Tính tổng tiền phạt thu được bằng reduce
  const totalFinesCollected = circulationLogs.reduce(
    (total, log) => total + log.fineAmount,
    0,
  );

  console.log("\n================ BÁO CÁO CUỐI NGÀY ================");
  console.log(`- Tổng số sách đang được mượn: ${activeBorrowings} cuốn`);
  console.log(
    `- Tổng số tiền phạt thu được: ${totalFinesCollected.toLocaleString()} VNĐ`,
  );
  console.log("---------------- CHI TIẾT GIAO DỊCH ---------------");
  console.table(circulationLogs);
  console.log("===================================================");
};

// ============================================================================
// KỊCH BẢN MÔ PHỎNG VẬN HÀNH QUẦY THỦ THƯ (TESTING)
// ============================================================================
console.log("--- BẮT ĐẦU CA LÀM VIỆC ---\n");

// 1. Sinh viên mượn sách
borrowBook("SV001", "ISBN-9780131103627");
borrowBook("SV002", "ISBN-9781491950296");
borrowBook("SV003", "ISBN-9780596517748");

// Giả lập hệ thống có 1 bản ghi cũ từ 35 ngày trước đã hoàn tất
circulationLogs.push({
  logId: "LOG_OLD",
  studentCode: "SV099",
  bookIsbn: "ISBN-OLD",
  status: "RETURNED",
  fineAmount: 0,
  daysSinceCompletion: 35,
});

console.log("\n--- SINH VIÊN ĐẾN QUẦY TRẢ SÁCH ---");
// 2. Trả sách đúng hạn (Không phạt)
processReturn("LOG_1", "RETURNED", 0);

// 3. Trả sách trễ hạn (Trễ 3 ngày -> Phạt 15k)
processReturn("LOG_2", "RETURNED", 3);

// 4. Báo mất sách (Phạt 200k)
processReturn("LOG_3", "LOST");

console.log("\n--- BẢO TRÌ HỆ THỐNG TRƯỚC KHI ĐÓNG CA ---");
// 5. Dọn dẹp dữ liệu rác (Sẽ xóa LOG_OLD vì quá 30 ngày)
cleanupOldLogs();

// 6. In báo cáo
generateDailyReport();
