import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});
const angles=["Problem–Solution","Honest Review","POV Story","Before You Buy","Comparison","Office Routine","Myth vs Fact","Checklist","Lifestyle Integration","Unexpected Test","Social Proof","Mini Story","Objection Handling","Tutorial","Day-in-the-Life"];

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
  try{
    const body=await req.json();
    const product=body.product;
    if(!product?.id||!product?.name) return json({error:"Missing product"},400);
    const count=Math.max(3,Math.min(15,Number(body.clip_count||7)));
    const apiKey=Deno.env.get("GEMINI_API_KEY");
    if(!apiKey) return json({error:"ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Supabase Edge Function Secrets"},500);
    const model=Deno.env.get("GEMINI_MODEL")||"gemini-2.5-flash";
    const selectedAngles=angles.slice(0,count);
    const prompt=`You are NOVA Creative Engine, a senior Thai affiliate creative department with six internal roles: strategist, creative director, copywriter, storyboard director, prompt engineer, and truth/quality checker.

Create one complete campaign with exactly ${count} short-form videos.
PRODUCT FACTS (the only facts you may claim):
${JSON.stringify({name:product.name,brand:product.brand,category:product.category,price:product.price,commission:product.commission,affiliate_link:product.affiliate_link},null,2)}
Platform: ${body.platform||"TikTok"}
Goal: ${body.goal||"Conversion"}
Audience: ${body.target_audience||"General Thai audience"}
Tone: ${body.tone||"Honest and natural"}
Creator: ${body.creator||"AUTO"}
Creativity: ${body.creativity||"Bold"}
Must include / restrictions: ${body.must_include||"Do not invent product facts."}
Mandatory distinct angles, one per clip: ${selectedAngles.join(", ")}.

Rules:
- Thai language for strategy, titles, hooks, scripts, captions, storyboard text.
- English only for image_prompt and video_prompt.
- Each script should fit roughly 30–45 seconds, sound spoken and natural, and contain a non-pushy CTA.
- Never claim efficacy, ingredients, certifications, durability, medical benefits, test results, discounts, stock, reviews, or features not present in PRODUCT FACTS.
- When facts are missing, explicitly frame as something the buyer should check before purchase.
- Every clip must have a clearly different structure, opening device, setting, emotional trigger, and visual rhythm.
- video_prompt must specify vertical 9:16, shot sequence, subject action, camera behavior, lighting, realism, no on-screen text, no watermark.
- Return valid JSON only.`;

    const schema={type:"OBJECT",required:["campaign_name","big_idea","strategy_summary","quality_score","items"],properties:{
      campaign_name:{type:"STRING"},big_idea:{type:"STRING"},strategy_summary:{type:"STRING"},quality_score:{type:"INTEGER"},
      items:{type:"ARRAY",minItems:count,maxItems:count,items:{type:"OBJECT",required:["angle","title","hook","script","caption","hashtags","storyboard","image_prompt","video_prompt"],properties:{
        angle:{type:"STRING"},title:{type:"STRING"},hook:{type:"STRING"},script:{type:"STRING"},caption:{type:"STRING"},hashtags:{type:"ARRAY",items:{type:"STRING"}},
        storyboard:{type:"ARRAY",minItems:3,maxItems:7,items:{type:"OBJECT",required:["scene","visual","voiceover"],properties:{scene:{type:"INTEGER"},visual:{type:"STRING"},voiceover:{type:"STRING"}}}},
        image_prompt:{type:"STRING"},video_prompt:{type:"STRING"}
      }}}
    }};
    const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:body.creativity==="Safe"?.55:body.creativity==="Experimental"?1.15:.9,responseMimeType:"application/json",responseSchema:schema}})});
    const raw=await response.json();
    if(!response.ok) return json({error:raw?.error?.message||"Gemini request failed",details:raw},502);
    const text=raw?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("");
    if(!text) return json({error:"Gemini returned an empty response"},502);
    const generated=JSON.parse(text);
    if(!Array.isArray(generated.items)||generated.items.length!==count) return json({error:"จำนวนคลิปจาก AI ไม่ครบ กรุณากดสร้างใหม่"},502);

    const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const campaignName=generated.campaign_name||`${product.name} · ${body.platform||"TikTok"}`;
    const {data:campaign,error:campaignError}=await supabase.from("campaigns").insert({name:campaignName,product_id:product.id,platform:body.platform||"TikTok",target_audience:body.target_audience||null,tone:body.tone||null,status:"Active",total_clips:count,big_idea:generated.big_idea||null,strategy_summary:generated.strategy_summary||null,quality_score:Number(generated.quality_score||0),generation_source:"Gemini"}).select("id").single();
    if(campaignError||!campaign) return json({error:campaignError?.message||"Cannot save campaign"},500);
    const autoCreator=body.creator&&body.creator!=="AUTO"?body.creator:(product.category==="Beauty"?"LUNA":product.category==="Office"?"MAYA":product.category==="Tech"?"ETHAN":"ARIA");
    const rows=generated.items.map((x:any,index:number)=>({campaign_id:campaign.id,product_id:product.id,title:x.title,character:autoCreator,platform:body.platform||"TikTok",status:"Script",hook:x.hook,script:x.script,caption:`${x.caption||""}\n\n${(x.hashtags||[]).join(" ")}`.trim(),storyboard:x.storyboard,image_prompt:x.image_prompt,video_prompt:x.video_prompt,content_angle:x.angle,creative_order:index+1,ai_quality_score:Number(generated.quality_score||0)}));
    const {error:contentError}=await supabase.from("contents").insert(rows);
    if(contentError){await supabase.from("campaigns").delete().eq("id",campaign.id);return json({error:contentError.message},500);}
    return json({campaign_id:campaign.id,campaign_name:campaignName,big_idea:generated.big_idea,strategy_summary:generated.strategy_summary,quality_score:generated.quality_score,items:generated.items});
  }catch(error){return json({error:error instanceof Error?error.message:"Unknown error"},500);}
});
