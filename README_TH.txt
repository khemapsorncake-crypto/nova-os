NOVA OS — Supabase Version

สิ่งที่มีในระบบ
- Dashboard อ่านข้อมูลจากฐานข้อมูลจริง
- เพิ่ม/ลบสินค้า
- เพิ่มคอนเทนต์
- ย้ายสถานะ Content Pipeline
- KPI คำนวณจากข้อมูลจริง
- เก็บ Supabase URL และ Publishable/Anon Key ในเบราว์เซอร์เครื่องนี้

ติดตั้ง
1) สมัคร/เข้า Supabase และสร้าง Project
2) เปิด SQL Editor
3) เปิดไฟล์ supabase_schema.sql จากโฟลเดอร์นี้
4) คัดลอกทั้งหมดไปวางใน SQL Editor แล้วกด Run
5) ใน Supabase เปิด Project Settings / API
6) คัดลอก Project URL และ Publishable Key หรือ anon key
7) ดับเบิลคลิก index.html
8) ไปเมนู Connection แล้ววาง URL และ Key
9) กด เชื่อมต่อและทดสอบ

ข้อควรระวัง
- ห้ามใช้ service_role key ในหน้าเว็บ
- Policy ในไฟล์นี้เปิดสิทธิ์ anon สำหรับ MVP ส่วนตัวเท่านั้น
- ก่อนนำเว็บขึ้นสาธารณะ ควรเพิ่ม Supabase Auth และเปลี่ยน RLS ให้ข้อมูลผูกกับผู้ใช้
