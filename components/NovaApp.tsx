"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Page = "dashboard" | "products" | "campaigns" | "content" | "studio" | "analytics";
type Product = { id:string; name:string; brand:string|null; category:string; price:number; commission:number; affiliate_link:string|null; status:string; revenue:number; created_at:string; };
type Campaign = { id:string; name:string; product_id:string|null; platform:string; target_audience:string|null; tone:string|null; status:string; total_clips:number; created_at:string; };
type Content = { id:string; campaign_id:string|null; title:string; character:string; platform:string; status:string; hook:string|null; script:string|null; caption:string|null; storyboard:unknown; image_prompt:string|null; video_prompt:string|null; views:number; clicks:number; revenue:number; created_at:string; };
type CampaignItem = { title:string; hook:string; script:string; caption:string; hashtags:string[]; storyboard:Array<{scene:number;visual:string;voiceover:string}>; image_prompt:string; video_prompt:string; };

const VERSION = "v5.0 CAMPAIGN HUB";
const statuses = ["Idea","Script","Production","Ready","Posted"];
const money = (value:number|string|null|undefined) => `฿${Number(value || 0).toLocaleString("th-TH")}`;
const creatorByCategory = (category:string) => category === "Beauty" ? "LUNA" : category === "Office" ? "MAYA" : category === "Tech" ? "ETHAN" : "ARIA";

export default function NovaApp(){
  const [page,setPage] = useState<Page>("dashboard");
  const [products,setProducts] = useState<Product[]>([]);
  const [campaigns,setCampaigns] = useState<Campaign[]>([]);
  const [contents,setContents] = useState<Content[]>([]);
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState("");
  const [productModal,setProductModal] = useState(false);

  const loadData = useCallback(async()=>{
    if(!supabase){ setLoading(false); return; }
    setLoading(true);
    const [p,cp,c] = await Promise.all([
      supabase.from("products").select("*").order("created_at",{ascending:false}),
      supabase.from("campaigns").select("*").order("created_at",{ascending:false}),
      supabase.from("contents").select("*").order("created_at",{ascending:false})
    ]);
    if(p.error || cp.error || c.error) setNotice((p.error || cp.error || c.error)?.message || "โหลดข้อมูลไม่สำเร็จ");
    setProducts((p.data || []) as Product[]);
    setCampaigns((cp.data || []) as Campaign[]);
    setContents((c.data || []) as Content[]);
    setLoading(false);
  },[]);
  useEffect(()=>{ loadData(); },[loadData]);

  const revenue = useMemo(()=>products.reduce((s,p)=>s+Number(p.revenue||0),0)+contents.reduce((s,c)=>s+Number(c.revenue||0),0),[products,contents]);
  const views = useMemo(()=>contents.reduce((s,c)=>s+Number(c.views||0),0),[contents]);
  const clicks = useMemo(()=>contents.reduce((s,c)=>s+Number(c.clicks||0),0),[contents]);

  async function addProduct(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); if(!supabase) return;
    const f = new FormData(e.currentTarget);
    const {error} = await supabase.from("products").insert({
      name:f.get("name"), brand:f.get("brand") || null, category:f.get("category"),
      price:Number(f.get("price")||0), commission:Number(f.get("commission")||0),
      affiliate_link:f.get("affiliate_link") || null, status:"Active", revenue:0
    });
    if(error){setNotice(error.message);return;}
    setProductModal(false); setNotice("เพิ่มสินค้าแล้ว"); loadData();
  }

  async function moveContent(id:string,status:string){
    if(!supabase) return;
    const {error}=await supabase.from("contents").update({status}).eq("id",id);
    if(error) setNotice(error.message); else loadData();
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span>✦</span><div><b>NOVA OS</b><small>Free Campaign Studio</small></div></div>
      <div className="version">{VERSION}</div>
      <nav>{[
        ["dashboard","⌂","Dashboard"],["products","▣","Products"],["campaigns","◆","Campaigns"],["content","▶","Content"],["studio","✦","Campaign Studio"],["analytics","▥","Analytics"]
      ].map(([id,icon,label])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id as Page)}><span>{icon}</span>{label}</button>)}</nav>
      <div className={`connection ${hasSupabaseConfig?"online":"offline"}`}>● {hasSupabaseConfig?"Supabase connected":"Environment missing"}</div>
    </aside>
    <main>
      <header><div><h1>{page==="studio"?"Free Campaign Studio":page[0].toUpperCase()+page.slice(1)}</h1><p>สร้างแคมเปญด้วย ChatGPT โดยไม่เสียค่า API เพิ่ม</p></div><button className="secondary" onClick={loadData}>↻ Refresh</button></header>
      {!hasSupabaseConfig&&<div className="warning">ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY</div>}
      {notice&&<div className="notice" onClick={()=>setNotice("")}>{notice} ×</div>}
      {loading?<div className="panel empty">กำลังโหลดข้อมูล...</div>:<>
        {page==="dashboard"&&<Dashboard products={products} contents={contents} revenue={revenue} views={views} clicks={clicks}/>} 
        {page==="products"&&<Products products={products} open={()=>setProductModal(true)}/>} 
        {page==="campaigns"&&<CampaignHub campaigns={campaigns} contents={contents} products={products} refresh={loadData}/>} 
        {page==="content"&&<ContentBoard contents={contents} move={moveContent} refresh={loadData}/>} 
        {page==="studio"&&<CampaignStudio products={products} refresh={loadData}/>} 
        {page==="analytics"&&<Analytics contents={contents} revenue={revenue} views={views} clicks={clicks}/>} 
      </>}
    </main>
    {productModal&&<Modal title="เพิ่มสินค้า" close={()=>setProductModal(false)}><form className="form" onSubmit={addProduct}>
      <label>ชื่อสินค้า<input name="name" required/></label><label>แบรนด์<input name="brand"/></label>
      <label>หมวดสินค้า<select name="category"><option>Beauty</option><option>Office</option><option>Tech</option><option>Lifestyle</option></select></label>
      <div className="two"><label>ราคา<input name="price" type="number" min="0" defaultValue="0"/></label><label>คอมมิชชั่น<input name="commission" type="number" min="0" defaultValue="0"/></label></div>
      <label>Affiliate Link<input name="affiliate_link" type="url"/></label><button className="primary">บันทึกสินค้า</button>
    </form></Modal>}
  </div>;
}

function Dashboard({products,contents,revenue,views,clicks}:{products:Product[];contents:Content[];revenue:number;views:number;clicks:number}){
  const ctr=views?clicks/views*100:0;
  return <><section className="kpis"><Kpi label="รายได้รวม" value={money(revenue)}/><Kpi label="ยอดวิวรวม" value={views.toLocaleString()}/><Kpi label="คอนเทนต์" value={String(contents.length)}/><Kpi label="CTR" value={`${ctr.toFixed(2)}%`}/></section>
  <section className="grid2"><div className="panel"><h2>Content Pipeline</h2>{contents.slice(0,6).map(c=><Row key={c.id} left={c.title} sub={`${c.character} · ${c.platform}`} right={c.status}/>)}{!contents.length&&<Empty/>}</div><div className="panel"><h2>Top Products</h2>{products.slice(0,6).map((p,i)=><Row key={p.id} left={`${i+1}. ${p.name}`} sub={p.category} right={money(p.revenue)}/>)}{!products.length&&<Empty/>}</div></section>
  <section className="creators">{[["LUNA","Beauty"],["MAYA","Office"],["ETHAN","Tech"],["ARIA","Lifestyle"]].map(([name,cat])=><div className="creator" key={name}><small>{cat} Creator</small><strong>{name}</strong><span>ACTIVE</span></div>)}</section></>;
}

function Products({products,open}:{products:Product[];open:()=>void}){return <div className="panel"><div className="panelTop"><div><h2>Product Center</h2><p>สินค้าทั้งหมดใน Supabase</p></div><button className="primary" onClick={open}>+ เพิ่มสินค้า</button></div><div className="tableWrap"><table><thead><tr><th>สินค้า</th><th>หมวด</th><th>ราคา</th><th>คอมมิชชั่น</th><th>สถานะ</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.brand||"—"}</small></td><td>{p.category}</td><td>{money(p.price)}</td><td>{money(p.commission)}</td><td><span className="pill">{p.status}</span></td></tr>)}</tbody></table></div>{!products.length&&<Empty/>}</div>}

function CampaignHub({campaigns,contents,products,refresh}:{campaigns:Campaign[];contents:Content[];products:Product[];refresh:()=>void}){
  const [selected,setSelected]=useState<Campaign|null>(null);
  const [query,setQuery]=useState("");
  const filtered=campaigns.filter(c=>!query||c.name.toLowerCase().includes(query.toLowerCase()));
  const productName=(id:string|null)=>products.find(p=>p.id===id)?.name||"ไม่ระบุสินค้า";
  async function remove(campaign:Campaign){
    if(!supabase||!confirm(`ลบ Campaign “${campaign.name}” และคลิปทั้งหมดหรือไม่?`))return;
    const {error}=await supabase.from("campaigns").delete().eq("id",campaign.id);
    if(error)alert(error.message);else{setSelected(null);refresh();}
  }
  return <>
    <div className="factoryToolbar"><div><h2>Campaign Hub</h2><p>รวมหลายคลิปไว้เป็นแคมเปญเดียว พร้อมติดตามความคืบหน้า</p></div><div className="factoryFilters"><input placeholder="ค้นหา Campaign" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
    <div className="campaignGrid">{filtered.map(c=>{
      const clips=contents.filter(x=>x.campaign_id===c.id);
      const complete=clips.filter(x=>x.status==="Ready"||x.status==="Posted").length;
      const percent=clips.length?Math.round(complete/clips.length*100):0;
      return <article className="campaignCard" key={c.id} onClick={()=>setSelected(c)}>
        <div className="campaignCardTop"><span className="badge">{c.platform}</span><span className="pill">{c.status}</span></div>
        <h3>{c.name}</h3><p>{productName(c.product_id)}</p>
        <div className="progressMeta"><span>{clips.length} คลิป</span><b>{percent}%</b></div><div className="progress"><i style={{width:`${percent}%`}}/></div>
        <div className="campaignStats"><span>Script {clips.filter(x=>x.status==="Script").length}</span><span>Production {clips.filter(x=>x.status==="Production").length}</span><span>Posted {clips.filter(x=>x.status==="Posted").length}</span></div>
      </article>})}{!filtered.length&&<div className="panel"><Empty text="ยังไม่มี Campaign — สร้างได้จาก Campaign Studio"/></div>}</div>
    {selected&&<div className="backdrop" onMouseDown={()=>setSelected(null)}><div className="campaignDetail" onMouseDown={e=>e.stopPropagation()}>
      <div className="editorHead"><div><span className="badge">{selected.platform} · {selected.status}</span><h2>{selected.name}</h2><p>{productName(selected.product_id)}</p></div><button className="closeButton" onClick={()=>setSelected(null)}>×</button></div>
      <div className="campaignInfo"><div><small>กลุ่มเป้าหมาย</small><p>{selected.target_audience||"—"}</p></div><div><small>โทน</small><p>{selected.tone||"—"}</p></div><div><small>จำนวนที่วางแผน</small><strong>{selected.total_clips} คลิป</strong></div></div>
      <div className="campaignClipList">{contents.filter(x=>x.campaign_id===selected.id).map((clip,i)=><div className="campaignClip" key={clip.id}><span>{i+1}</span><div><b>{clip.title}</b><small>{clip.character} · {clip.platform}</small><p>{clip.hook||"ยังไม่มี Hook"}</p></div><span className="pill">{clip.status}</span></div>)}{!contents.some(x=>x.campaign_id===selected.id)&&<Empty text="ยังไม่มีคลิปใน Campaign นี้"/>}</div>
      <div className="editorActions"><button className="dangerButton" onClick={()=>remove(selected)}>ลบ Campaign</button><button className="primary" onClick={()=>setSelected(null)}>ปิด</button></div>
    </div></div>}
  </>;
}

function ContentBoard({contents,move,refresh}:{contents:Content[];move:(id:string,status:string)=>void;refresh:()=>void}){
  const [selected,setSelected]=useState<Content|null>(null);
  const [query,setQuery]=useState("");
  const [creator,setCreator]=useState("All");
  const filtered=contents.filter(c=>(!query||`${c.title} ${c.hook||""}`.toLowerCase().includes(query.toLowerCase()))&&(creator==="All"||c.character===creator));
  return <>
    <div className="factoryToolbar"><div><h2>Content Factory</h2><p>เปิด แก้ไข คัดลอก Prompt และจัดสถานะงานจากหน้าเดียว</p></div><div className="factoryFilters"><input placeholder="ค้นหาชื่อคลิปหรือ Hook" value={query} onChange={e=>setQuery(e.target.value)}/><select value={creator} onChange={e=>setCreator(e.target.value)}><option>All</option><option>LUNA</option><option>MAYA</option><option>ETHAN</option><option>ARIA</option></select></div></div>
    <div className="kanban">{statuses.map(s=><div className="column" key={s}><h3>{s}<span>{filtered.filter(c=>c.status===s).length}</span></h3>{filtered.filter(c=>c.status===s).map(c=><div className="card contentFactoryCard" key={c.id} onClick={()=>setSelected(c)}><div className="cardStatus">{c.character}</div><b>{c.title}</b><small>{c.platform}</small>{c.hook&&<p>{c.hook}</p>}<select value={c.status} onClick={e=>e.stopPropagation()} onChange={e=>move(c.id,e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></div>)}</div>)}</div>
    {selected&&<ContentEditor content={selected} close={()=>setSelected(null)} refresh={()=>{setSelected(null);refresh();}}/>}
  </>;
}

function ContentEditor({content,close,refresh}:{content:Content;close:()=>void;refresh:()=>void}){
  const [draft,setDraft]=useState(content);
  const [saving,setSaving]=useState(false);
  const scenes=Array.isArray(draft.storyboard)?draft.storyboard as Array<{scene?:number;visual?:string;voiceover?:string}>:[];
  const set=(key:keyof Content,value:unknown)=>setDraft(d=>({...d,[key]:value}));
  async function save(){if(!supabase)return;setSaving(true);const {error}=await supabase.from("contents").update({title:draft.title,hook:draft.hook,script:draft.script,caption:draft.caption,image_prompt:draft.image_prompt,video_prompt:draft.video_prompt,status:draft.status}).eq("id",draft.id);setSaving(false);if(error)alert(error.message);else refresh();}
  async function remove(){if(!supabase||!confirm("ลบคอนเทนต์นี้ถาวรหรือไม่?"))return;const {error}=await supabase.from("contents").delete().eq("id",draft.id);if(error)alert(error.message);else refresh();}
  async function copy(value:string|null,label:string){if(!value)return alert(`ยังไม่มี ${label}`);await navigator.clipboard.writeText(value);alert(`คัดลอก ${label} แล้ว`);}
  return <div className="backdrop" onMouseDown={close}><div className="contentEditor" onMouseDown={e=>e.stopPropagation()}>
    <div className="editorHead"><div><span className="badge">{draft.character} · {draft.platform}</span><h2>{draft.title}</h2></div><button className="closeButton" onClick={close}>×</button></div>
    <div className="editorGrid"><section className="editorMain form"><label>ชื่อคลิป<input value={draft.title} onChange={e=>set("title",e.target.value)}/></label><label>Hook<textarea rows={3} value={draft.hook||""} onChange={e=>set("hook",e.target.value)}/></label><label>Script<textarea rows={12} value={draft.script||""} onChange={e=>set("script",e.target.value)}/></label><label>Caption + Hashtags<textarea rows={5} value={draft.caption||""} onChange={e=>set("caption",e.target.value)}/></label></section>
    <aside className="editorSide"><div className="editorBlock"><h3>Workflow</h3><select value={draft.status} onChange={e=>set("status",e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></div><div className="editorBlock"><h3>Storyboard</h3>{scenes.length?scenes.map((x,i)=><div className="scene" key={i}><b>Scene {x.scene||i+1}</b><p>{x.visual||"—"}</p><small>{x.voiceover||""}</small></div>):<p className="muted">ยังไม่มี Storyboard</p>}</div><div className="editorBlock"><h3>Image Prompt</h3><textarea rows={6} value={draft.image_prompt||""} onChange={e=>set("image_prompt",e.target.value)}/><button className="secondary fullButton" onClick={()=>copy(draft.image_prompt,"Image Prompt")}>คัดลอก Image Prompt</button></div><div className="editorBlock"><h3>Video Prompt</h3><textarea rows={7} value={draft.video_prompt||""} onChange={e=>set("video_prompt",e.target.value)}/><button className="secondary fullButton" onClick={()=>copy(draft.video_prompt,"Video Prompt")}>คัดลอก Video Prompt</button></div></aside></div>
    <div className="editorActions"><button className="dangerButton" onClick={remove}>ลบคอนเทนต์</button><div><button className="secondary" onClick={()=>copy(`${draft.hook||""}\n\n${draft.script||""}\n\n${draft.caption||""}`,"ชุดข้อความ")}>คัดลอกทั้งหมด</button><button className="primary" onClick={save} disabled={saving}>{saving?"กำลังบันทึก...":"บันทึกการแก้ไข"}</button></div></div>
  </div></div>;
}

function CampaignStudio({products,refresh}:{products:Product[];refresh:()=>void}){
  const [productId,setProductId]=useState("");
  const [target,setTarget]=useState("ผู้หญิงวัยทำงาน อายุ 22–35 ปี ที่ต้องการข้อมูลก่อนตัดสินใจซื้อ");
  const [tone,setTone]=useState("จริงใจ เป็นธรรมชาติ ไม่ขายเกินจริง");
  const [platform,setPlatform]=useState("TikTok");
  const [count,setCount]=useState(5);
  const [prompt,setPrompt]=useState("");
  const [jsonText,setJsonText]=useState("");
  const [preview,setPreview]=useState<CampaignItem[]>([]);
  const [message,setMessage]=useState("");
  const product=products.find(p=>p.id===productId);

  function buildPrompt(){
    if(!product){setMessage("กรุณาเลือกสินค้าก่อน");return;}
    const value=`คุณเป็นทีมสร้างคอนเทนต์ Affiliate ภาษาไทยของ NOVA OS

สร้างแคมเปญจำนวน ${count} คลิปสำหรับแพลตฟอร์ม ${platform}
สินค้า: ${product.name}
แบรนด์: ${product.brand||"ไม่ระบุ"}
หมวด: ${product.category}
ราคา: ${product.price} บาท
กลุ่มเป้าหมาย: ${target}
โทน: ${tone}

ข้อกำหนด:
- แต่ละคลิปต้องมีมุมเล่าเรื่องต่างกันอย่างชัดเจน
- ความยาวสคริปต์ประมาณ 30–45 วินาที
- ห้ามกล่าวอ้างเกินจริงและห้ามแต่งข้อมูลสินค้า
- ระบุสิ่งที่ควรเช็กก่อนซื้อ
- Image Prompt และ Video Prompt ให้เขียนเป็นภาษาอังกฤษ
- Video Prompt เป็นวิดีโอแนวตั้ง 9:16

ตอบเป็น JSON Array ที่ valid เท่านั้น ห้ามมี Markdown และห้ามมีข้อความก่อนหรือหลัง JSON
โครงสร้างของแต่ละรายการต้องเป็น:
{
  "title":"ชื่อคลิป",
  "hook":"ประโยคเปิดคลิป",
  "script":"สคริปต์เต็ม",
  "caption":"แคปชัน",
  "hashtags":["#แท็ก1","#แท็ก2"],
  "storyboard":[{"scene":1,"visual":"ภาพที่เห็น","voiceover":"เสียงพูด"}],
  "image_prompt":"English image prompt",
  "video_prompt":"English video prompt"
}`;
    setPrompt(value); setMessage("สร้าง Prompt แล้ว กดคัดลอกและนำไปวางใน ChatGPT");
  }

  async function copyPrompt(){if(!prompt)return;await navigator.clipboard.writeText(prompt);setMessage("คัดลอก Prompt แล้ว");}
  async function openChat(){if(prompt) await navigator.clipboard.writeText(prompt); window.open("https://chatgpt.com/","_blank","noopener,noreferrer");}
  function parse(){
    try{
      const clean=jsonText.trim().replace(/^```json\s*/i,"").replace(/```$/i,"").trim();
      const parsed=JSON.parse(clean);
      if(!Array.isArray(parsed)||!parsed.length) throw new Error("ข้อมูลต้องเป็น JSON Array");
      const validated=parsed.map((x:any,i:number)=>{
        if(!x.title||!x.hook||!x.script) throw new Error(`รายการที่ ${i+1} ขาด title, hook หรือ script`);
        return {...x,hashtags:Array.isArray(x.hashtags)?x.hashtags:[],storyboard:Array.isArray(x.storyboard)?x.storyboard:[]};
      });
      setPreview(validated); setMessage(`ตรวจสอบสำเร็จ พบ ${validated.length} คลิป`);
    }catch(e){setPreview([]);setMessage(`JSON ไม่ถูกต้อง: ${e instanceof Error?e.message:"Unknown error"}`);}
  }
  async function save(){
    if(!supabase||!product||!preview.length)return;
    const campaignName=`${product.name} · ${platform} · ${new Date().toLocaleDateString("th-TH")}`;
    const {data:campaign,error:campaignError}=await supabase.from("campaigns").insert({
      name:campaignName,product_id:product.id,platform,target_audience:target,tone,status:"Active",total_clips:preview.length
    }).select("id").single();
    if(campaignError||!campaign){setMessage(campaignError?.message||"สร้าง Campaign ไม่สำเร็จ");return;}
    const rows=preview.map(x=>({campaign_id:campaign.id,product_id:product.id,title:x.title,character:creatorByCategory(product.category),platform,status:"Script",hook:x.hook,script:x.script,caption:`${x.caption||""}\n\n${x.hashtags.join(" ")}`.trim(),storyboard:x.storyboard,image_prompt:x.image_prompt||null,video_prompt:x.video_prompt||null}));
    const {error}=await supabase.from("contents").insert(rows);
    if(error){await supabase.from("campaigns").delete().eq("id",campaign.id);setMessage(error.message);return;}
    setMessage(`สร้าง Campaign และบันทึก ${rows.length} คลิปแล้ว`); setPreview([]); setJsonText(""); refresh();
  }

  return <div className="studio">
    <div className="studioHero"><div><span className="badge">FREE • NO API COST</span><h2>Campaign Generator</h2><p>สร้าง Prompt → ใช้ใน ChatGPT → นำ JSON กลับมาบันทึกเป็นหลายคอนเทนต์</p></div><b>{VERSION}</b></div>
    <div className="grid2">
      <section className="panel form"><h2>1. ตั้งค่า Campaign</h2><label>สินค้า<select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">— เลือกสินค้า —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>กลุ่มเป้าหมาย<textarea rows={3} value={target} onChange={e=>setTarget(e.target.value)}/></label><label>โทนการสื่อสาร<input value={tone} onChange={e=>setTone(e.target.value)}/></label><div className="two"><label>แพลตฟอร์ม<select value={platform} onChange={e=>setPlatform(e.target.value)}><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option><option>Facebook Reels</option></select></label><label>จำนวนคลิป<input type="number" min="1" max="20" value={count} onChange={e=>setCount(Math.max(1,Math.min(20,Number(e.target.value))))}/></label></div><button className="primary" onClick={buildPrompt}>✦ สร้าง Campaign Prompt</button></section>
      <section className="panel form"><h2>2. Prompt พร้อมใช้</h2>{prompt?<><textarea className="promptBox" readOnly rows={16} value={prompt}/><div className="actions"><button className="secondary" onClick={copyPrompt}>คัดลอก Prompt</button><button className="primary" onClick={openChat}>เปิด ChatGPT</button></div></>:<Empty text="เลือกสินค้าและกดสร้าง Campaign Prompt"/>}</section>
    </div>
    <section className="panel form"><h2>3. Import Campaign Result</h2><p>คัดลอก JSON ที่ ChatGPT ตอบกลับมาวางในช่องนี้</p><textarea rows={10} value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder='วาง JSON ที่ขึ้นต้นด้วย [ และลงท้ายด้วย ]'/><div className="actions"><button className="secondary" onClick={parse}>ตรวจสอบ JSON</button>{preview.length>0&&<button className="primary" onClick={save}>บันทึก {preview.length} คลิปเข้า Content Queue</button>}</div>{message&&<div className="studioMessage">{message}</div>}{preview.length>0&&<div className="preview">{preview.map((x,i)=><article key={i}><small>CLIP {i+1}</small><b>{x.title}</b><p>{x.hook}</p><span>{x.hashtags.join(" ")}</span></article>)}</div>}</section>
  </div>;
}

function Analytics({contents,revenue,views,clicks}:{contents:Content[];revenue:number;views:number;clicks:number}){return <div className="grid2"><div className="panel metric"><small>Revenue per 1,000 views</small><strong>{money(views?revenue/views*1000:0)}</strong></div><div className="panel metric"><small>Clicks</small><strong>{clicks.toLocaleString()}</strong></div><div className="panel full"><h2>Performance</h2>{contents.slice(0,10).map(c=><Row key={c.id} left={c.title} sub={`${c.views} views · ${c.clicks} clicks`} right={money(c.revenue)}/>)}{!contents.length&&<Empty/>}</div></div>}
function Kpi({label,value}:{label:string;value:string}){return <div className="kpi"><small>{label}</small><strong>{value}</strong></div>}
function Row({left,sub,right}:{left:string;sub:string;right:string}){return <div className="row"><div><b>{left}</b><small>{sub}</small></div><span className="pill">{right}</span></div>}
function Empty({text="ยังไม่มีข้อมูล"}:{text?:string}){return <div className="empty">{text}</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
