# NOVA OS v2

## 1) อัปเดตฐานข้อมูล
Supabase → SQL Editor → เปิด `supabase_schema_v2.sql` → คัดลอกทั้งหมด → Run

## 2) อัปโหลดเข้า GitHub
อัปโหลดไฟล์และโฟลเดอร์ทั้งหมดใน ZIP นี้เข้า repository `nova-os` แทนไฟล์ HTML เดิม

## 3) ตั้งค่า Vercel Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- OPENAI_API_KEY (ข้ามก่อนได้)
- OPENAI_MODEL = gpt-5-mini

ใช้ Publishable key เท่านั้น ห้ามใช้ Secret หรือ service_role key

## 4) Redeploy
Vercel → Deployments → เมนูจุดสามจุดของ Deployment ล่าสุด → Redeploy

ระบบมี Dashboard, Product Center, Content Kanban, AI Script Generator และ Analytics
หากยังไม่ใส่ OPENAI_API_KEY ปุ่ม AI จะใช้ Template สำรองและยังทำงานได้
