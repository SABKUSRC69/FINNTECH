# FINNTECH — Smart Financial Intelligence Platform 🚀

แพลตฟอร์มการเงินอัจฉริยะครบวงจร ออกแบบและพัฒนาด้วย **React 18**, **Vite**, **Tailwind CSS**, **Recharts** และ **Lucide Icons**

---

## ✨ ฟีเจอร์หลัก (Core Features)

1. 📊 **Financial Overview Dashboard (หน้าภาพรวมการเงิน)**
   - สรุปความมั่งคั่งสุทธิ (Net Worth), รายรับ, รายจ่าย, เงินออมสุทธิ (Cash Flow)
   - กราฟแนวโน้มกระแสเงินสด 6 เดือนย้อนหลัง (Cash Flow Trend Area Chart)
   - กราฟสัดส่วนค่าใช้จ่ายแยกตามหมวดหมู่ (Expense Category Breakdown Donut Chart)
   - ดัชนีวัดสุขภาพทางการเงิน (Financial Health Score) และอัตราการออม (Savings Rate)

2. 📝 **Income & Expense Tracker (ระบบบันทึกรายรับ-รายจ่าย)**
   - บันทึกรายรับ/รายจ่ายแบบ Real-time พร้อมระบุวันที่ หมวดหมู่ และบันทึกช่วยจำ
   - ตัวกรองอัจฉริยะ (แยกประเภท, แยกหมวดหมู่, แยกช่วงเวลาเดือนปัจจุบัน/ก่อนหน้า)
   - ค้นหาแบบทันที (Instant Live Search)
   - **ส่งออกข้อมูลเป็นไฟล์ Excel / CSV** (รองรับภาษาไทย UTF-8 BOM เปิดใน Microsoft Excel ได้ถูกต้อง)

3. 🧮 **Smart Financial Calculators (ศูนย์รวมเครื่องมือคำนวณการเงิน)**
   - **Compound Interest Calculator**: คำนวณดอกเบี้ยทบต้น แผนออมเงินรายเดือน (DCA) พร้อมกราฟแสดงการเติบโตเปรียบเทียบระหว่างเงินต้นสะสม vs ดอกเบี้ยสะสม
   - **Loan & Mortgage EMI Calculator**: คำนวณสินเชื่อบ้าน รถยนต์ และเงินกู้ทั่วไป พร้อมตารางตัดเงินต้นและดอกเบี้ยรายปี (Amortization Schedule)
   - **Retirement Planning**: วางแผนเงินก้อนเพื่อการเกษียณ คำนวณผลกระทบของเงินเฟ้อ และเป้าหมายเงินออมที่ต้องเริ่มเก็บต่อเดือนตั้งแต่วันนี้

4. 📈 **Portfolio Tracker & Asset Allocation (พอร์ตจำลองการลงทุน)**
   - บันทึกและจัดการสินทรัพย์ หุ้น/ETF, กองทุนรวม, ทองคำ, คริปโตเคอร์เรนซี และเงินฝาก
   - คำนวณผลตอบแทน กำไร/ขาดทุนสะสม (Unrealized Profit/Loss)
   - กราฟโดนัทแสดงสัดส่วนการกระจายความเสี่ยง (Asset Allocation)

5. 🎨 **Modern Design & UX**
   - ธีมสี Dark Mode & Light Mode (สลับได้ทันที บันทึกค่าลง LocalStorage)
   - รองรับ Responsive เต็มรูปแบบ ทั้งสมาร์ตโฟน แท็บเล็ต และคอมพิวเตอร์
   - จัดเก็บข้อมูลปลอดภัยในเครื่องผู้ใช้ (LocalStorage Secured) พร้อมปุ่ม Reset คืนค่าตัวอย่างได้ตลอดเวลา

---

## 🛠️ วิธีการรันโครงการ (How to Run)

### 1. ติดตั้ง Dependencies (ทำครั้งแรก)
```bash
npm install
```

### 2. รันโหมด Development สำหรับเปิดใช้งาน
```bash
npm run dev
```
หลังจากรันคำสั่ง ระบบจะเปิดเบราว์เซอร์อัตโนมัติที่ `http://localhost:3000` (หรือพอร์ตที่แสดงใน Terminal)

### 3. คำสั่ง Build สำหรับ Production
```bash
npm run build
```
ไฟล์ผลลัพธ์พร้อมนำไป Deploy จะอยู่ในโฟลเดอร์ `dist/`

---

## 📂 โครงสร้างโฟลเดอร์ (Project Structure)

```text
FINNTECH/
├── index.html                   # HTML Entry Point
├── package.json                 # Dependencies & Scripts
├── tailwind.config.js           # Tailwind CSS Config (Dark theme & Colors)
├── vite.config.js               # Vite Configuration & Chunk Optimization
└── src/
    ├── App.jsx                  # Main App Component & Global State
    ├── main.jsx                 # React DOM Root
    ├── index.css                # Global Styles & Glassmorphism
    ├── data/
    │   └── initialData.js       # Demo Financial Data & Categories
    ├── utils/
    │   └── formatters.js        # THB Currency, Date & Number Formatters
    └── components/
        ├── layout/
        │   ├── Navbar.jsx       # Header, Theme Toggle, Logo, Reset
        │   └── Sidebar.jsx      # Navigation Menu & Mobile Bar
        ├── dashboard/
        │   ├── DashboardView.jsx        # Overview Dashboard & Charts
        │   ├── StatCard.jsx             # Key Metric Cards
        │   ├── FinancialHealthCard.jsx  # Health Score & Savings Rate
        │   └── QuickActionModal.jsx     # Quick Transaction Popup
        ├── transactions/
        │   └── TransactionManager.jsx   # Tracker, Search, Filter & CSV Export
        ├── calculators/
        │   ├── CalculatorsView.jsx      # Hub Switcher
        │   ├── CompoundInterestCalc.jsx # Compound Interest Growth
        │   ├── LoanCalc.jsx             # Loan EMI & Amortization
        │   └── RetirementCalc.jsx       # Retirement Planning
        └── portfolio/
            └── PortfolioView.jsx        # Investment Portfolio & Allocation
```
