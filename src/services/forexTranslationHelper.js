/**
 * Forex Factory Thai Translation & Real-time Financial Analysis Engine
 * Translates global economic events into professional Thai financial news format
 * and computes market impact scenarios for Forex pairs, Gold (XAU/USD), and Crypto.
 */

// Dictionary of Known Economic Indicators to Thai
const INDICATOR_DICTIONARY = [
  {
    pattern: /federal funds rate/i,
    titleThai: 'อัตราดอกเบี้ยนโยบายธนาคารกลางสหรัฐฯ (Federal Funds Rate)',
    category: 'นโยบายการเงินและดอกเบี้ย',
    description: 'การตัดสินใจกำหนดอัตราดอกเบี้ยระยะสั้นของคณะกรรมการนโยบายการเงินสหรัฐฯ (FOMC) ซึ่งเป็นเครื่องมือกำกับเสถียรภาพเศรษฐกิจที่ทรงอิทธิพลที่สุดในโลก',
    whyItMatters: 'เป็นตัวชี้วัดที่ขับเคลื่อนกระแสเงินทุนทั่วโลก การปรับขึ้นดอกเบี้ยจะดึงดูดเงินทุนเข้าสู่สกุลเงินดอลลาร์ ในขณะที่การลดดอกเบี้ยจะเพิ่มสภาพคล่องและกระตุ้นการลงทุนในทองคำและตลาดหุ้น',
    bullishImpact: 'หากขึ้นดอกเบี้ยหรือคงดอกเบี้ยในระดับสูง (Hawkish) -> ดอลลาร์ (USD) จะแข็งค่าขึ้นอย่างรุนแรงทันที, ส่งผลให้ราคาทองคำ (GOLD) และ EUR/USD ปรับตัวลดลง',
    bearishImpact: 'หากลดดอกเบี้ยหรือส่งสัญญาณผ่อนคลาย (Dovish) -> ดอลลาร์ (USD) จะอ่อนค่าลงอย่างรวดเร็ว, ส่งผลให้ราคาทองคำ (GOLD), หุ้น และ BTC ดีดตัวขึ้นแรง',
    goldImpact: 'ทองคำไม่มีผลตอบแทนในรูปดอกเบี้ย เมื่อดอกเบี้ยดอลลาร์สูง ต้นทุนค่าเสียโอกาสของการถือทองจะเพิ่มขึ้น ทำให้ราคาทองคำมักจะร่วงลง',
    volatilityRange: '80 - 200+ Pips',
  },
  {
    pattern: /fomc (statement|press conference|economic projections)/i,
    titleThai: 'แถลงการณ์นโยบายการเงินและการแถลงข่าวประธานเฟด (FOMC Press Conference)',
    category: 'นโยบายการเงินและดอกเบี้ย',
    description: 'ประธานธนาคารกลางสหรัฐฯ (Jerome Powell) แถลงมุมมองต่อทิศทางเศรษฐกิจ เงินเฟ้อ และส่งสัญญาณแนวโน้มการปรับดอกเบี้ยในอนาคต',
    whyItMatters: 'ถ้อยแถลงทุกคำพูดสามารถสร้างความผันผวนอย่างรุนแรงในตลาด แม้ตัวเลขอัตราดอกเบี้ยจะคงเดิม แต่น้ำเสียง (Tone) ว่าเป็นสายเหยี่ยว (Hawkish) หรือสายพิราบ (Dovish) จะกำหนดเทรนด์ในระยะถัดไป',
    bullishImpact: 'หากประธานเฟดส่งสัญญาณกังวลเงินเฟ้อและอาจขึ้นดอกเบี้ยต่อ -> ดอลลาร์แข็งค่า, ราคาทองคำและคู่เงินฝั่งตรงข้ามจะถูกเทขาย',
    bearishImpact: 'หากประธานเฟดส่งสัญญาณชะลอขึ้นดอกเบี้ยหรือพร้อมปรับลด -> ดอลลาร์อ่อนค่า, สินทรัพย์เสี่ยง ทองคำ และ Bitcoin จะพุ่งขึ้น',
    goldImpact: 'ราคาทองคำมักเหวี่ยงตัวขึ้น-ลงแบบหวือหวา (Whipsaw) ในช่วงการแถลงสด 30-45 นาทีแรก',
    volatilityRange: '100 - 250+ Pips',
  },
  {
    pattern: /(cpi|consumer price index).*m\/m/i,
    titleThai: 'ดัชนีราคาผู้บริโภครายเดือน (CPI Inflation m/m)',
    category: 'เงินเฟ้อและราคาสินค้า',
    description: 'มาตรวัดอัตราเงินเฟ้อหลักที่สะท้อนการเปลี่ยนแปลงราคาสินค้าและบริการที่ผู้บริโภคซื้อจริงในชีวิตประจำวัน',
    whyItMatters: 'ธนาคารกลางทั่วโลกใช้ตัวเลข CPI เป็นเกณฑ์หลักในการตัดสินใจขึ้นหรือลดดอกเบี้ย หากเงินเฟ้อยังสูง ธนาคารกลางจำเป็นต้องคงดอกเบี้ยสูงเพื่อสกัดเงินเฟ้อ',
    bullishImpact: 'หากตัวเลข CPI ออกมา "สูงกว่าคาด" -> ตลาดคาดว่าเฟดต้องคงดอกเบี้ยสูง -> USD แข็งค่าทันที, ราคาทองคำร่วงลง',
    bearishImpact: 'หากตัวเลข CPI ออกมา "ต่ำกว่าคาด" -> สะท้อนเงินเฟ้อชะลอตัว -> USD อ่อนค่า, ราคาทองคำและคู่เงิน EUR/USD พุ่งขึ้น',
    goldImpact: 'ในระยะสั้นทองคำมักปรับตัวสวนทางกับตัวเลข CPI (CPI สูง = ทองลง, CPI ต่ำ = ทองขึ้น) เนื่องจากปัจจัยอัตราผลตอบแทนพันธบัตรที่แท้จริง',
    volatilityRange: '70 - 150+ Pips',
  },
  {
    pattern: /(cpi|consumer price index).*y\/y/i,
    titleThai: 'ดัชนีราคาผู้บริโภคเทียบรายปี (CPI Inflation y/y)',
    category: 'เงินเฟ้อและราคาสินค้า',
    description: 'อัตราเงินเฟ้อทั่วไปเมื่อเทียบกับช่วงเดียวกันของปีก่อนหน้า ตัวเลขมาตรฐานที่ใช้เทียบกับเป้าหมายเงินเฟ้อ 2% ของธนาคารกลาง',
    whyItMatters: 'เป็นดัชนีชี้วัดสุขภาพเศรษฐกิจมหภาคที่นักลงทุนสถาบันและกองทุนระดับโลกใช้ปรับพอร์ตการลงทุน',
    bullishImpact: 'ตัวเลขสูงกว่าคาด = ดอลลาร์แข็งค่า, สินทรัพย์เสี่ยงและทองคำย่อตัว',
    bearishImpact: 'ตัวเลขต่ำกว่าคาด = ดอลลาร์อ่อนค่า, หนุนราคาทองคำและค่าเงินหลัก',
    goldImpact: 'ทองคำเป็นสินทรัพย์ป้องกันความเสี่ยงเงินเฟ้อในระยะยาว แต่ในระยะสั้นปฏิกิริยาของราคาจะขึ้นกับทิศทางดอกเบี้ยของเฟด',
    volatilityRange: '60 - 140 Pips',
  },
  {
    pattern: /non-farm employment change|nonfarm payrolls|nfp/i,
    titleThai: 'ตัวเลขการจ้างงานนอกภาคเกษตร (Non-Farm Payrolls - NFP)',
    category: 'การจ้างงานและแรงงาน',
    description: 'การเปลี่ยนแปลงจำนวนผู้มีงานทำในสหรัฐฯ ตลอดเดือนที่ผ่านมา (ไม่รวมภาคการเกษตร ข้าราชการ และองค์กรไม่แสวงหากำไร)',
    whyItMatters: 'เป็นตัวเลขข่าวเศรษฐกิจที่สร้างความผันผวนสูงที่สุดอันดับต้นๆ ของตลาด Forex ประกาศทุกวันศุกร์แรกของเดือน',
    bullishImpact: 'หากตัวเลขการจ้างงาน "เพิ่มขึ้นมากกว่าคาดมาก" -> เศรษฐกิจแข็งแกร่ง -> USD พุ่งขึ้นแรง, ทองคำและ EUR/USD ร่วงลงทันที',
    bearishImpact: 'หากตัวเลขการจ้างงาน "ต่ำกว่าคาดอย่างมีนัยสำคัญ" -> สะท้อนตลาดแรงงานชะลอตัว -> USD ทรุดตัวลง, ทองคำดีดขึ้นแรง',
    goldImpact: 'ราคาทองคำมักจะเกิดการเคลื่อนไหวฉับพลัน 15 - 30 ดอลลาร์ (150 - 300 Pips) ภายในเวลาไม่กี่นาทีหลังตัวเลขออก',
    volatilityRange: '100 - 300+ Pips',
  },
  {
    pattern: /unemployment claims|initial jobless claims/i,
    titleThai: 'จำนวนผู้ขอรับสวัสดิการว่างงานรายสัปดาห์ (Initial Jobless Claims)',
    category: 'การจ้างงานและแรงงาน',
    description: 'จำนวนผู้ยื่นขอรับเงินชดเชยการว่างงานครั้งแรกในสหรัฐฯ ในรอบสัปดาห์ที่ผ่านมา เป็นข้อมูลเร็วที่บอกสถานะตลาดแรงงานล่าสุด',
    whyItMatters: 'เป็นข้อมูลที่มีความถี่สูงทุกสัปดาห์ (วันพฤหัสบดี) บ่งชี้ว่าตลาดแรงงานกำลังชะลอตัวหรือยังคงตึงตัว',
    bullishImpact: 'หากตัวเลข "ต่ำกว่าคาด" (คนตกงานน้อยลง) -> ส่งผลดีต่อ USD -> USD แข็งค่า, ทองคำชะลอตัว',
    bearishImpact: 'หากตัวเลข "สูงกว่าคาด" (คนตกงานเพิ่มขึ้น) -> สะท้อนแรงงานเริ่มเปราะบาง -> USD อ่อนค่า, หนุนราคาทองคำ',
    goldImpact: 'มักทำให้ทองคำวิ่งสั้นๆ 30 - 60 Pips เหมาะกับเทรดเดอร์ประเภท Scalper',
    volatilityRange: '30 - 70 Pips',
  },
  {
    pattern: /unemployment rate/i,
    titleThai: 'อัตราการว่างงาน (Unemployment Rate)',
    category: 'การจ้างงานและแรงงาน',
    description: 'สัดส่วนร้อยละของประชากรวัยแรงงานที่ไม่มีงานทำแต่กำลังหางานทำอย่างต่อเนื่อง',
    whyItMatters: 'หนึ่งในสองเป้าหมายหลักของธนาคารกลาง (Dual Mandate) คือการรักษาระดับการจ้างงานให้เต็มศักยภาพควบคู่กับเสถียรภาพราคา',
    bullishImpact: 'อัตราว่างงานลดลงต่ำกว่าคาด -> เศรษฐกิจแข็งแรง -> หนุนค่าเงินในประเทศนั้นๆ',
    bearishImpact: 'อัตราว่างงานพุ่งขึ้นสูงกว่าคาด -> เศรษฐกิจเริ่มถดถอย -> กดดันค่าเงินให้อ่อนค่า',
    goldImpact: 'หากอัตราว่างงานสหรัฐฯ สูงขึ้น จะเป็นแรงหนุนสำคัญให้ทองคำพุ่งขึ้น',
    volatilityRange: '40 - 90 Pips',
  },
  {
    pattern: /gdp.*q\/q|gross domestic product/i,
    titleThai: 'ผลิตภัณฑ์มวลรวมในประเทศรายไตรมาส (GDP Growth Rate q/q)',
    category: 'การเติบโตทางเศรษฐกิจ',
    description: 'มูลค่ารวมของสินค้าและบริการขั้นสุดท้ายทั้งหมดที่ผลิตขึ้นภายในประเทศ วัดการเติบโตหรือหดตัวของขนาดเศรษฐกิจ',
    whyItMatters: 'ดัชนีชี้วัดความแข็งแกร่งสูงสุดของเศรษฐกิจมหภาค หากติดลบ 2 ไตรมาสติดต่อกันจะเข้าสู่ภาวะเศรษฐกิจถดถอยทางเทคนิค (Technical Recession)',
    bullishImpact: 'GDP ขยายตัวเกินคาด -> ความเชื่อมั่นนักลงทุนพุ่ง -> เงินทุนไหลเข้าสกุลเงินนั้น',
    bearishImpact: 'GDP ชะลอตัวหรือติดลบ -> ความเสี่ยงเศรษฐกิจถดถอย -> เงินทุนไหลออก',
    goldImpact: 'หาก GDP สหรัฐฯ ออกมาอ่อนแอ นักลงทุนจะโยกเงินเข้าหลบภัยในทองคำ (Safe Haven Demand)',
    volatilityRange: '50 - 120 Pips',
  },
  {
    pattern: /retail sales/i,
    titleThai: 'ยอดค้าปลีก (Retail Sales m/m)',
    category: 'การบริโภคและการค้า',
    description: 'การวัดการเปลี่ยนแปลงมูลค่ารวมของการขายในระดับค้าปลีก สะท้อนกำลังซื้อของผู้บริโภคซึ่งคิดเป็น 70% ของเศรษฐกิจสหรัฐฯ',
    whyItMatters: 'เป็นมาตรวัดหลักของการใช้จ่ายของผู้บริโภค ซึ่งเป็นเครื่องยนต์หลักในการขับเคลื่อน GDP',
    bullishImpact: 'ยอดค้าปลีกเติบโตดีกว่าคาด -> ผู้บริโภคยังใช้จ่ายสูง -> หนุนค่าเงินให้แข็งแกร่ง',
    bearishImpact: 'ยอดค้าปลีกหดตัว -> ผู้บริโภครัดเข็มขัด -> บ่งชี้เศรษฐกิจเริ่มชะลอตัว -> ค่าเงินอ่อนค่า',
    goldImpact: 'ส่งผลให้ทองคำเคลื่อนไหวเฉลี่ย 40 - 80 Pips ตามทิศทางดอลลาร์',
    volatilityRange: '40 - 80 Pips',
  },
  {
    pattern: /boj policy rate|monetary policy statement/i,
    titleThai: 'อัตราดอกเบี้ยนโยบายและการแถลงของธนาคารกลางญี่ปุ่น (BOJ Interest Rate)',
    category: 'นโยบายการเงินและดอกเบี้ย',
    description: 'การตัดสินใจทิศทางอัตราดอกเบี้ยของธนาคารกลางญี่ปุ่น (Bank of Japan) และการควบคุมเส้นอัตราผลตอบแทนพันธบัตร (YCC)',
    whyItMatters: 'เงินเยน (JPY) เป็นสกุลเงินที่มีอัตราดอกเบี้ยต่ำที่สุดในกลุ่ม G10 มายาวนาน การปรับขึ้นดอกเบี้ยของ BOJ จะส่งผลให้เกิดการปิดสถานะ Yen Carry Trade ทั่วโลก',
    bullishImpact: 'BOJ ขึ้นดอกเบี้ย หรือส่งสัญญาณ Hawkish -> เงินเยน (JPY) จะแข็งค่าขึ้นอย่างรุนแรง ส่งผลให้คู่เงิน USD/JPY ร่วงลงดิ่งเหว',
    bearishImpact: 'BOJ คงดอกเบี้ย หรือเน้นย้ำนโยบายผ่อนคลาย -> JPY อ่อนค่าลงต่อเนื่อง, USD/JPY ดีดตัวขึ้นต่อ',
    goldImpact: 'ความผันผวนของเงินเยนและอัตราผลตอบแทนพันธบัตรญี่ปุ่นมีผลทางอ้อมต่อการไหลเวียนของสภาพคล่องทองคำ',
    volatilityRange: '100 - 250+ Pips',
  },
  {
    pattern: /official bank rate|monetary policy summary/i,
    titleThai: 'อัตราดอกเบี้ยนโยบายธนาคารกลางอังกฤษ (BOE Official Bank Rate)',
    category: 'นโยบายการเงินและดอกเบี้ย',
    description: 'การลงมติอัตราดอกเบี้ยของคณะกรรมการนโยบายการเงินธนาคารกลางอังกฤษ (MPC Bank of England)',
    whyItMatters: 'ส่งผลกระทบโดยตรงและรุนแรงที่สุดต่อค่าเงินปอนด์สเตอร์ลิง (GBP) และคู่เงิน GBP/USD',
    bullishImpact: 'ขึ้นดอกเบี้ย หรือเสียงโหวต Hawkish -> GBP/USD พุ่งขึ้นอย่างรวดเร็ว',
    bearishImpact: 'ลดดอกเบี้ย หรือส่งสัญญาณระมัดระวังเศรษฐกิจ -> GBP/USD ปรับตัวลดลงแรง',
    goldImpact: 'มีผลต่อราคาทองคำในสกุลเงินปอนด์และสร้างแรงกระเพื่อมในตลาดยุโรป',
    volatilityRange: '80 - 180 Pips',
  },
  {
    pattern: /ecb (president|monetary policy|main refinancing rate|lagarde)/i,
    titleThai: 'อัตราดอกเบี้ยและการแถลงการณ์ธนาคารกลางยุโรป (ECB Rate Decision)',
    category: 'นโยบายการเงินและดอกเบี้ย',
    description: 'การตัดสินใจอัตราดอกเบี้ยรีไฟแนนซ์ของธนาคารกลางยุโรป และการแถลงข่าวของประธาน ECB (Christine Lagarde)',
    whyItMatters: 'กำหนดทิศทางของสกุลเงินยูโร (EUR) ซึ่งมีสัดส่วนใหญ่ที่สุดในดัชนีดอลลาร์ (US Dollar Index ~57.6%)',
    bullishImpact: 'ECB ปรับขึ้นดอกเบี้ย หรือส่งสัญญาณเข้มงวด -> สกุลเงินยูโร (EUR) แข็งค่า, EUR/USD ปรับตัวขึ้น',
    bearishImpact: 'ECB ผ่อนคลายนโยบาย หรือกังวลการเติบโต -> ยูโรอ่อนค่า, EUR/USD ปรับตัวลง',
    goldImpact: 'เมื่อ EUR/USD ปรับขึ้น มักจะกดดันให้ Dollar Index ย่อตัว ซึ่งส่งผลทางอ้อมให้ราคาทองคำโลก (XAU/USD) ปรับขึ้นตาม',
    volatilityRange: '70 - 150 Pips',
  },
  {
    pattern: /crude oil inventories/i,
    titleThai: 'รายงานสต็อกน้ำมันดิบคงคลังสหรัฐฯ (EIA Crude Oil Inventories)',
    category: 'สินค้าโภคภัณฑ์และพลังงาน',
    description: 'การวัดการเปลี่ยนแปลงจำนวนบาร์เรลของน้ำมันดิบเชิงพาณิชย์ที่กักเก็บไว้โดยบริษัทในสหรัฐฯ รายงานโดย EIA ทุกวันพุธ',
    whyItMatters: 'มีผลต่อราคาน้ำมันดิบ WTI และ Brent รวมถึงค่าเงินดอลลาร์แคนาดา (CAD) เนื่องจากแคนาดาเป็นผู้ส่งออกน้ำมันรายใหญ่',
    bullishImpact: 'สต็อกน้ำมันลดลงมากกว่าคาด (อุปสงค์สูง) -> หนุนราคาน้ำมันพุ่ง -> สกุลเงิน CAD แข็งค่า, USD/CAD ปรับลดลง',
    bearishImpact: 'สต็อกน้ำมันเพิ่มขึ้นมากกว่าคาด (อุปทานล้น) -> ราคาน้ำมันร่วง -> CAD อ่อนค่า, USD/CAD ดีดตัวขึ้น',
    goldImpact: 'ราคาน้ำมันที่สูงขึ้นอาจกระตุ้นความกังวลเรื่องเงินเฟ้อ ซึ่งส่งผลบวกต่อทองคำในระยะกลาง',
    volatilityRange: '40 - 90 Pips',
  },
  {
    pattern: /philly fed|empire state/i,
    titleThai: 'ดัชนีสภาวะธุรกิจและภาคการผลิต (Manufacturing Index)',
    category: 'ภาคการผลิตและธุรกิจ',
    description: 'การสำรวจผู้บริหารภาคการผลิตในเขตพื้นที่เศรษฐกิจสำคัญ สะท้อนคำสั่งซื้อใหม่ การจ้างงาน และต้นทุนวัตถุดิบ',
    whyItMatters: 'เป็นดัชนีชี้นำล่วงหน้า (Leading Indicator) ของดัชนี ISM ภาคการผลิตระดับประเทศ',
    bullishImpact: 'ดัชนีเป็นบวกสูงกว่าคาด -> ภาคธุรกิจเติบโตแข็งแรง -> หนุน USD',
    bearishImpact: 'ดัชนีติดลบหรือต่ำกว่าคาด -> กิจกรรมการผลิตหดตัว -> กดดัน USD',
    goldImpact: 'สร้างความผันผวนระยะสั้น 20 - 45 Pips',
    volatilityRange: '25 - 55 Pips',
  },
  {
    pattern: /building permits|housing starts/i,
    titleThai: 'ใบอนุญาตก่อสร้างและยอดเริ่มสร้างบ้าน (Building Permits / Housing Starts)',
    category: 'ภาคอสังหาริมทรัพย์',
    description: 'จำนวนใบอนุญาตสำหรับโครงการก่อสร้างที่อยู่อาศัยใหม่ที่ออกโดยรัฐบาล สะท้อนสุขภาพของภาคอสังหาริมทรัพย์',
    whyItMatters: 'ภาคที่อยู่อาศัยมีความอ่อนไหวสูงต่ออัตราดอกเบี้ยเงินกู้จำนอง (Mortgage Rate)',
    bullishImpact: 'ยอดขออนุญาตสูงขึ้น -> ตลาดที่อยู่อาศัยยังเติบโต -> บวกต่อค่าเงิน',
    bearishImpact: 'ยอดขออนุญาตลดลง -> ตลาดอสังหาฯ ชะลอตัวจากดอกเบี้ยสูง -> ลบต่อค่าเงิน',
    goldImpact: 'ผลกระทบต่ำถึงปานกลาง (20 - 40 Pips)',
    volatilityRange: '15 - 40 Pips',
  },
  {
    pattern: /trade balance/i,
    titleThai: 'ดุลการค้า (Trade Balance)',
    category: 'การค้าระหว่างประเทศ',
    description: 'ส่วนต่างระหว่างมูลค่าสินค้าและบริการที่ส่งออกและนำเข้าของประเทศในรอบเดือน',
    whyItMatters: 'ดุลการค้าเกินดุลแสดงถึงความต้องการสกุลเงินของประเทศนั้นจากคู่ค้าต่างชาติเพื่อชำระค่าสินค้า',
    bullishImpact: 'เกินดุลการค้าเพิ่มขึ้น หรือขาดดุลลดลง -> บวกต่อค่าเงิน',
    bearishImpact: 'ขาดดุลการค้าเพิ่มขึ้น -> เงินทุนไหลออก -> ลบต่อค่าเงิน',
    goldImpact: 'ผลกระทบจำกัด ยกเว้นดุลการค้าของประเทศผู้บริโภคทองคำรายใหญ่อย่างจีนหรืออินเดีย',
    volatilityRange: '20 - 50 Pips',
  },
]

// Fallback generic generator for any other economic event
function generateGenericThaiAnalysis(title, country) {
  return {
    titleThai: `รายงานข้อมูลเศรษฐกิจ: ${title} (${country})`,
    category: 'ตัวชี้วัดเศรษฐกิจมหภาค',
    description: `รายงานตัวเลขเศรษฐกิจ ${title} ของประเทศ ${country} ติดตามเพื่อประเมินแนวโน้มและโมเมนตัมของภาคเศรษฐกิจที่เกี่ยวข้อง`,
    whyItMatters: 'ตัวเลขเศรษฐกิจที่เป็นทางการช่วยให้นักลงทุนและธนาคารกลางประเมินทิศทางนโยบายการเงินในอนาคต',
    bullishImpact: `หากตัวเลขออกมา "ดีกว่าคาดการณ์" มักจะส่งผลบวกต่อสกุลเงิน ${country} ในระยะสั้น`,
    bearishImpact: `หากตัวเลขออกมา "แย่กว่าคาดการณ์" อาจทำให้สกุลเงิน ${country} เผชิญแรงขายทำกำไร`,
    goldImpact: country === 'USD' ? 'ส่งผลให้ราคาทองคำแกว่งตัวตามความแข็งอ่อนของดอลลาร์' : 'ส่งผลทางอ้อมต่อราคาทองคำผ่านการเคลื่อนไหวของคู่เงินหลัก',
    volatilityRange: '20 - 50 Pips',
  }
}

/**
 * Main translation and analysis builder
 */
export function getThaiAnalysis(event) {
  const title = event.title || ''
  const country = event.country || event.currency || 'USD'

  const matched = INDICATOR_DICTIONARY.find((item) => item.pattern.test(title))
  const baseInfo = matched || generateGenericThaiAnalysis(title, country)

  // Determine actual vs forecast outcome
  let outcomeType = 'pending' // 'beat' | 'miss' | 'match' | 'pending'
  let outcomeSummaryThai = 'กำลังรอผลการประกาศตัวเลขอย่างเป็นทางการ'

  if (event.actual && event.actual !== '-' && event.forecast && event.forecast !== '-') {
    const actNum = parseFloat(event.actual.replace(/[^0-9.-]/g, ''))
    const forNum = parseFloat(event.forecast.replace(/[^0-9.-]/g, ''))

    if (!isNaN(actNum) && !isNaN(forNum)) {
      if (actNum > forNum) {
        outcomeType = 'beat'
        outcomeSummaryThai = `ตัวเลขจริง (${event.actual}) ออกมา "สูงกว่าคาดการณ์" (${event.forecast})`
      } else if (actNum < forNum) {
        outcomeType = 'miss'
        outcomeSummaryThai = `ตัวเลขจริง (${event.actual}) ออกมา "ต่ำกว่าคาดการณ์" (${event.forecast})`
      } else {
        outcomeType = 'match'
        outcomeSummaryThai = `ตัวเลขจริง (${event.actual}) ออกมา "ตรงกับคาดการณ์" (${event.forecast})`
      }
    } else {
      outcomeType = 'announced'
      outcomeSummaryThai = `ประกาศผลแล้ว: ${event.actual}`
    }
  } else if (event.isPast) {
    outcomeType = 'announced'
    outcomeSummaryThai = event.actual && event.actual !== '-' ? `ประกาศผลแล้ว: ${event.actual}` : 'สิ้นสุดการรายงานแล้ว'
  }

  // Strategic trading tip
  let strategicTip = ''
  if (event.impact === 'High') {
    strategicTip = '⚠️ คำแนะนำเชิงกลยุทธ์: ข่าวกล่องแดงมีความผันผวนสูงมากและสเปรดอาจถ่างกว้าง (Spread Widening) ในช่วง 1-3 นาทีแรก แนะนำให้หลีกเลี่ยงการเปิดคำสั่ง Market Order ทันที แต่ควรรอให้แท่งเทียน 5 นาที หรือ 15 นาที ปิดตัวเพื่อดูโครงสร้างราคา (Price Action) และแนวรับ-แนวต้านก่อนเข้าเทรด'
  } else if (event.impact === 'Medium') {
    strategicTip = '💡 คำแนะนำเชิงกลยุทธ์: ข่าวกล่องส้มมักสร้างระยะวิ่ง 20-50 Pips เหมาะกับการเทรดตามเทรนด์ (Trend Following) หรือการตั้ง Pending Order ดักตามกรอบแนวรับแนวต้าน'
  } else {
    strategicTip = 'ℹ️ คำแนะนำเชิงกลยุทธ์: ข่าวกล่องเหลืองส่งผลกระทบต่อราคาน้อย เหมาะกับการบริหารออเดอร์ตามแผนเทรดปกติ โดยไม่จำเป็นต้องกังวลเรื่องการกระชากของราคา'
  }

  return {
    ...baseInfo,
    outcomeType,
    outcomeSummaryThai,
    strategicTip,
  }
}
