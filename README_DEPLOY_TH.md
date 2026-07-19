# NOVA OS 2.0 COMPLETE

ชุดนี้อัปเกรดจาก NOVA 6.1 ได้โดยตรง ไม่ต้องลง 7, 8 หรือ 8.1 ก่อน และไม่มีไฟล์ `index.ts` อยู่ที่ Root

## มีครบในชุดเดียว
Dashboard, Product Center, Campaign Hub, Content Factory, Asset Library, Publishing Calendar, Analytics และ NOVA Creative Engine ที่สร้าง Big Idea, Strategy, มุมคลิป, Hook, Script, Caption, Hashtag, Storyboard, Image Prompt และ Video Prompt แล้วบันทึกเข้าฐานข้อมูลอัตโนมัติ

## 1) อัปโหลดโปรเจกต์
ลบไฟล์ `/index.ts` ที่เคยวางผิดตำแหน่งใน GitHub ก่อน จากนั้นนำไฟล์ **ด้านในโฟลเดอร์นี้ทั้งหมด** ไปแทน Repository เดิม โครงสร้างสำคัญต้องเป็น:

```text
app/
components/NovaApp.tsx
lib/supabase.ts
supabase/functions/creative-engine/index.ts
package.json
```

## 2) ตั้งค่า Vercel
เพิ่ม Environment Variables ใน Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

จากนั้น Redeploy

## 3) อัปเกรด Supabase ครั้งเดียว
Supabase → SQL Editor → New query → วางไฟล์ `supabase_schema_2_0.sql` ทั้งหมด → Run

SQL นี้รองรับทั้งฐาน NOVA 6.1 เดิมและโปรเจกต์ Supabase ว่าง โดยไม่ลบข้อมูลเดิม

## 4) สร้าง Creative Engine
Supabase → Edge Functions → Create function ชื่อ `creative-engine` แล้ววางโค้ดจาก:

```text
supabase/functions/creative-engine/index.ts
```

เพิ่ม Secrets:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```

`SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` มีให้ Edge Function โดยระบบ Supabase

Deploy Function แล้วเปิด NOVA → Creative Engine → เลือกสินค้า → Generate Full Campaign

## 5) Build ที่ใช้ตรวจชุดนี้

```bash
npm ci
npm run build
```

ผลที่ตรวจ: Next.js production build สำเร็จ ทั้ง Compile, TypeScript check, static page generation และ build trace

## หมายเหตุด้านความปลอดภัย
Schema ตั้ง policy แบบ single-user เพื่อให้ของเดิมใช้งานได้ทันที ห้ามเผยแพร่ NOVA เป็นระบบสาธารณะหลายผู้ใช้ก่อนเพิ่ม Supabase Auth และเปลี่ยน RLS ให้ผูกกับ `auth.uid()`
