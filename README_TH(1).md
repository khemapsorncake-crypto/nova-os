# NOVA OS v8 — Creative Engine Ultimate

เวอร์ชันนี้รวมระบบเดิมทั้งหมดจาก v6 และเพิ่ม Publishing Calendar + Creative Engine แบบกดครั้งเดียว

## ฟีเจอร์หลัก

- Dashboard / Products / Campaign Hub / Content Factory
- Asset Library พร้อมอัปโหลดภาพและวิดีโอ
- Publishing Calendar
- NOVA Creative Engine
- สร้าง Big Idea, Strategy, Hook, Script, Caption, Hashtag
- สร้าง Storyboard, Image Prompt และ Video Prompt
- บังคับมุมคอนเทนต์ให้แตกต่างกัน
- ตรวจคำกล่าวอ้างเกินจริงตามข้อมูลสินค้าที่มี
- บันทึก Campaign และ Contents ลง Supabase อัตโนมัติ

## 1. อัปเดตฐานข้อมูล

เปิด Supabase → SQL Editor → New query

คัดลอกไฟล์ `supabase_schema_v8.sql` แล้วกด Run

## 2. สร้าง Gemini API Key

สร้าง API key ใน Google AI Studio แล้วเก็บไว้เป็น Secret เท่านั้น ห้ามใส่ใน GitHub หรือไฟล์หน้าเว็บ

## 3. สร้าง Edge Function

Supabase → Edge Functions → Create a new function

ชื่อฟังก์ชัน:

`creative-engine`

แทนโค้ดทั้งหมดด้วยไฟล์:

`supabase/functions/creative-engine/index.ts`

จากนั้น Deploy

## 4. ตั้งค่า Secrets

Supabase → Edge Functions → Secrets

เพิ่ม:

- `GEMINI_API_KEY` = API Key จาก Google AI Studio
- `GEMINI_MODEL` = `gemini-2.5-flash` (ไม่ใส่ก็ได้ ระบบใช้ค่านี้เป็นค่าเริ่มต้น)

`SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` มีให้ Edge Function ของ Supabase ใช้อยู่แล้ว

## 5. อัปเดตไฟล์ใน GitHub

ให้นำไฟล์จากโฟลเดอร์นี้ไปแทนโปรเจกต์เดิม โดยเฉพาะ:

- `components/NovaApp.tsx`
- `app/globals.css`
- `supabase_schema_v8.sql`
- โฟลเดอร์ `supabase/functions/creative-engine`

Commit และรอ Vercel Deploy

## 6. ใช้งาน

1. เปิดเมนู Creative Engine
2. เลือกสินค้า
3. ตั้งเป้าหมาย กลุ่มเป้าหมาย โทน Creator และจำนวนคลิป
4. กด `GENERATE FULL CAMPAIGN`
5. รอระบบสร้างและบันทึก
6. เปิด Campaign Hub หรือ Content Factory เพื่อดูงานทั้งหมด

## หมายเหตุ

- ระบบใช้โควตาของ Gemini API ตามบัญชีของคุณ
- AI จะไม่สามารถรู้รายละเอียดสินค้าที่ไม่ได้กรอกไว้ใน Product Center
- เพื่อป้องกันข้อมูลเท็จ ควรเพิ่มข้อมูลสินค้าที่ตรวจสอบแล้วเท่านั้น
- หากฟังก์ชันแจ้งว่า `GEMINI_API_KEY` ไม่มี ให้กลับไปตรวจ Edge Function Secrets
