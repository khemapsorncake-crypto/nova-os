# NOVA OS v3 — Free Campaign Studio

เวอร์ชันนี้ไม่ต้องใช้ OpenAI API และไม่มีค่า AI เพิ่ม

## 1. อัปเดต Supabase
เข้า Supabase → SQL Editor → New query แล้วเปิดไฟล์ `supabase_schema_v3.sql` คัดลอกทั้งหมดไป Run

## 2. อัปโหลดขึ้น GitHub
แตก ZIP แล้วอัปโหลดไฟล์ทั้งหมดทับ repository เดิม `nova-os`
Commit message: `Add NOVA Free Campaign Studio v3`
Vercel จะ Deploy อัตโนมัติ

## 3. วิธีใช้งาน
1. เพิ่มสินค้าใน Products
2. เข้า AI Studio
3. เลือกสินค้า กลุ่มเป้าหมาย โทน แพลตฟอร์ม และจำนวนคลิป
4. กด “สร้าง Campaign Prompt”
5. กด “เปิด ChatGPT”
6. วาง Prompt ใน ChatGPT
7. คัดลอก JSON ที่ได้กลับมาใส่ Import Campaign Result
8. กด “ตรวจสอบ JSON”
9. กดบันทึกเข้า Content Queue

Environment Variables ใช้เหมือนเดิม:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

ไม่ต้องมี OPENAI_API_KEY
