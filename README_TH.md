# NOVA OS v3.1 REAL

เวอร์ชันนี้มี Campaign Studio จริง และจะแสดงป้าย `v3.1 REAL` ที่เมนูซ้ายและบนหน้า Campaign Studio

## ขั้นตอนติดตั้ง
1. Supabase → SQL Editor → Run ไฟล์ `supabase_schema_v3_1.sql`
2. ใน GitHub repository `nova-os` ให้ลบไฟล์และโฟลเดอร์เดิมทั้งหมดก่อน ยกเว้น `.git`
3. อัปโหลดไฟล์จาก ZIP นี้ทั้งหมดโดยตรงที่หน้า root ของ repository
4. Commit: `Release NOVA OS v3.1 REAL`
5. รอ Vercel Deploy เป็น Ready แล้วกด Ctrl+Shift+R

## เช็กว่าขึ้นเวอร์ชันถูก
- เมนูด้านซ้ายต้องมี `v3.1 REAL`
- เมนูต้องเขียน `Campaign Studio` ไม่ใช่ `AI Studio`
- หน้า Campaign Studio ต้องมี 3 ขั้นตอน: ตั้งค่า Campaign, Prompt พร้อมใช้, Import Campaign Result

## Environment Variables เดิม
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

ไม่ต้องมี OpenAI API Key
