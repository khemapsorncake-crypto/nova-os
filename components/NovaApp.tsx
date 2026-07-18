"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";

type Page = "dashboard" | "products" | "campaigns" | "content" | "assets" | "publishing" | "creative" | "analytics";
type Product = { id:string; name:string; brand:string|null; category:string; price:number; commission:number; affiliate_link:string|null; status:string; revenue:number; created_at:string; };
type Campaign = { id:string; name:string; product_id:string|null; platform:string; target_audience:string|null; tone:string|null; status:string; total_clips:number; created_at:string; };
type Asset = { id:string; content_id:string; campaign_id:string|null; asset_type:"image"|"video"|"thumbnail"; file_name:string; file_path:string; public_url:string; mime_type:string|null; file_size:number; created_at:string; };
type Content = { id:string; campaign_id:string|null; title:string; character:string; platform:string; status:string; hook:string|null; script:string|null; caption:string|null; storyboard:unknown; image_prompt:string|null; video_prompt:string|null; scheduled_at:string|null; published_at:string|null; publish_url:string|null; publish_status:string; views:number; clicks:number; revenue:number; created_at:string; };
type CampaignItem = { title:string; hook:string; script:string; caption:string; hashtags:string[]; storyboard:Array<{scene:number;visual:string;voiceover:string}>; image_prompt:string; video_prompt:string; };

const VERSION = "v8.0 CREATIVE ENGINE ULTIMATE";
const statuses = ["Idea","Script","Production","Ready","Posted"];
const money = (value:number|string|null|undefined) => `฿${Number(value || 0).toLocaleString("th-TH")}`;
const creatorByCategory = (category:string) => category === "Beauty" ? "LUNA" : category === "Office" ? "MAYA" : category === "Tech" ? "ETHAN" : "ARIA";

export default function NovaApp(){
  const [page,setPage] = useState<Page>("dashboard");
  const [products,setProducts] = useState<Product[]>([]);
  const [campaigns,setCampaigns] = useState<Campaign[]>([]);
  const [contents,setContents] = useState<Content[]>([]);
  const [assets,setAssets] = useState<Asset[]>([]);
  const [loading,setLoading] = useState(true);
  const [notice,setNotice] = useState("");
  const [productModal,setProductModal] = useState(false);

  const loadData = useCallback(async()=>{
    if(!supabase){ setLoading(false); return; }
    setLoading(true);
    const [p,cp,c,a] = await Promise.all([
      supabase.from("products").select("*").order("created_at",{ascending:false}),
      supabase.from("campaigns").select("*").order("created_at",{ascending:false}),
      supabase.from("contents").select("*").order("created_at",{ascending:false}),
      supabase.from("assets").select("*").order("created_at",{ascending:false})
    ]);
    if(p.error || cp.error || c.error || a.error) setNotice((p.error || cp.error || c.error || a.error)?.message || "โหลดข้อมูลไม่สำเร็จ");
    setProducts((p.data || []) as Product[]);
    setCampaigns((cp.data || []) as Campaign[]);
    setContents((c.data || []) as Content[]);
    setAssets((a.data || []) as Asset[]);
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
        ["dashboard","⌂","Dashboard"],["products","▣","Products"],["campaigns","◆","Campaigns"],["content","▶","Content"],["assets","▧","Assets"],["publishing","◫","Publishing"],["creative","✦","Creative Engine"],["analytics","▥","Analytics"]
      ].map(([id,icon,label])=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id as Page)}><span>{icon}</span>{label}</button>)}</nav>
      <div className={`connection ${hasSupabaseConfig?"online":"offline"}`}>● {hasSupabaseConfig?"Supabase connected":"Environment missing"}</div>
    </aside>
    <main>
      <header><div><h1>{page==="creative"?"NOVA Creative Engine":page[0].toUpperCase()+page.slice(1)}</h1><p>คิดแคมเปญ สคริปต์ Storyboard และ Production Prompt ในคลิกเดียว</p></div><button className="secondary" onClick={loadData}>↻ Refresh</button></header>
      {!hasSupabaseConfig&&<div className="warning">ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY</div>}
      {notice&&<div className="notice" onClick={()=>setNotice("")}>{notice} ×</div>}
      {loading?<div className="panel empty">กำลังโหลดข้อมูล...</div>:<>
        {page==="dashboard"&&<Dashboard products={products} contents={contents} revenue={revenue} views={views} clicks={clicks}/>} 
        {page==="products"&&<Products products={products} open={()=>setProductModal(true)}/>} 
        {page==="campaigns"&&<CampaignHub campaigns={campaigns} contents={contents} assets={assets} products={products} refresh={loadData}/>} 
        {page==="content"&&<ContentBoard contents={contents} assets={assets} move={moveContent} refresh={loadData}/>} 
        {page==="assets"&&<AssetLibrary assets={assets} contents={contents} campaigns={campaigns} refresh={loadData}/>} 
        {page==="publishing"&&<PublishingCalendar contents={contents} campaigns={campaigns} assets={assets} refresh={loadData}/>} 
        {page==="creative"&&<CreativeEngine products={products} refresh={loadData}/>} 
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

function CampaignHub({campaigns,contents,assets,products,refresh}:{campaigns:Campaign[];contents:Content[];assets:Asset[];products:Product[];refresh:()=>void}){
  const [selected,setSelected]=useState<Campaign|null>(null);
  const [selectedClip,setSelectedClip]=useState<Content|null>(null);
  const [query,setQuery]=useState("");
  const filtered=campaigns.filter(c=>!query||c.name.toLowerCase().includes(query.toLowerCase()));
  const productName=(id:string|null)=>products.find(p=>p.id===id)?.name||"ไม่ระบุสินค้า";
  const campaignClips=selected?contents.filter(x=>x.campaign_id===selected.id):[];
  const completed=campaignClips.filter(x=>x.status==="Ready"||x.status==="Posted").length;
  const progressPercent=campaignClips.length?Math.round(completed/campaignClips.length*100):0;

  async function remove(campaign:Campaign){
    if(!supabase||!confirm(`ลบ Campaign “${campaign.name}” และคลิปทั้งหมดหรือไม่?`))return;
    const {error}=await supabase.from("campaigns").delete().eq("id",campaign.id);
    if(error)alert(error.message);else{setSelected(null);refresh();}
  }
  async function updateClipStatus(id:string,status:string){
    if(!supabase)return;
    const {error}=await supabase.from("contents").update({status}).eq("id",id);
    if(error)alert(error.message);else await refresh();
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
      <div className="campaignProgressHero"><div><small>ความคืบหน้า Campaign</small><strong>{progressPercent}%</strong><span>{completed} จาก {campaignClips.length} คลิปพร้อมใช้งานหรือโพสต์แล้ว</span></div><div className="progress large"><i style={{width:`${progressPercent}%`}}/></div></div>
      <div className="campaignInfo"><div><small>กลุ่มเป้าหมาย</small><p>{selected.target_audience||"—"}</p></div><div><small>โทน</small><p>{selected.tone||"—"}</p></div><div><small>จำนวนที่วางแผน</small><strong>{selected.total_clips} คลิป</strong></div></div>
      <div className="campaignSummary">{statuses.map(status=><div key={status}><small>{status}</small><b>{campaignClips.filter(x=>x.status===status).length}</b></div>)}</div>
      <div className="campaignClipList">{campaignClips.map((clip,i)=><div className="campaignClip clickable" key={clip.id} onClick={()=>setSelectedClip(clip)}><span>{i+1}</span><div><b>{clip.title}</b><small>{clip.character} · {clip.platform}</small><p>{clip.hook||"ยังไม่มี Hook"}</p></div><div className="clipActions" onClick={e=>e.stopPropagation()}><select value={clip.status} onChange={e=>updateClipStatus(clip.id,e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select><button className="secondary compact" onClick={()=>setSelectedClip(clip)}>เปิดรายละเอียด</button></div></div>)}{!campaignClips.length&&<Empty text="ยังไม่มีคลิปใน Campaign นี้"/>}</div>
      <div className="editorActions"><button className="dangerButton" onClick={()=>remove(selected)}>ลบ Campaign</button><button className="primary" onClick={()=>setSelected(null)}>ปิด</button></div>
    </div></div>}
    {selectedClip&&<ContentEditor content={selectedClip} assets={assets.filter(a=>a.content_id===selectedClip.id)} close={()=>setSelectedClip(null)} refresh={async()=>{await refresh();setSelectedClip(null);}}/>}
  </>;
}

function ContentBoard({contents,assets,move,refresh}:{contents:Content[];assets:Asset[];move:(id:string,status:string)=>void;refresh:()=>void}){
  const [selected,setSelected]=useState<Content|null>(null);
  const [query,setQuery]=useState("");
  const [creator,setCreator]=useState("All");
  const filtered=contents.filter(c=>(!query||`${c.title} ${c.hook||""}`.toLowerCase().includes(query.toLowerCase()))&&(creator==="All"||c.character===creator));
  return <>
    <div className="factoryToolbar"><div><h2>Content Factory</h2><p>เปิด แก้ไข คัดลอก Prompt และจัดสถานะงานจากหน้าเดียว</p></div><div className="factoryFilters"><input placeholder="ค้นหาชื่อคลิปหรือ Hook" value={query} onChange={e=>setQuery(e.target.value)}/><select value={creator} onChange={e=>setCreator(e.target.value)}><option>All</option><option>LUNA</option><option>MAYA</option><option>ETHAN</option><option>ARIA</option></select></div></div>
    <div className="kanban">{statuses.map(s=><div className="column" key={s}><h3>{s}<span>{filtered.filter(c=>c.status===s).length}</span></h3>{filtered.filter(c=>c.status===s).map(c=><div className="card contentFactoryCard" key={c.id} onClick={()=>setSelected(c)}><div className="cardStatus">{c.character}</div><b>{c.title}</b><small>{c.platform}</small>{c.hook&&<p>{c.hook}</p>}<select value={c.status} onClick={e=>e.stopPropagation()} onChange={e=>move(c.id,e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></div>)}</div>)}</div>
    {selected&&<ContentEditor content={selected} assets={assets.filter(a=>a.content_id===selected.id)} close={()=>setSelected(null)} refresh={()=>{setSelected(null);refresh();}}/>}
  </>;
}

function ContentEditor({content,assets,close,refresh}:{content:Content;assets:Asset[];close:()=>void;refresh:()=>void}){
  const [draft,setDraft]=useState(content);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState<string|null>(null);
  const scenes=Array.isArray(draft.storyboard)?draft.storyboard as Array<{scene?:number;visual?:string;voiceover?:string}>:[];
  const set=(key:keyof Content,value:unknown)=>setDraft(d=>({...d,[key]:value}));
  async function save(){if(!supabase)return;setSaving(true);const {error}=await supabase.from("contents").update({title:draft.title,hook:draft.hook,script:draft.script,caption:draft.caption,image_prompt:draft.image_prompt,video_prompt:draft.video_prompt,status:draft.status}).eq("id",draft.id);setSaving(false);if(error)alert(error.message);else refresh();}
  async function remove(){if(!supabase||!confirm("ลบคอนเทนต์นี้ถาวรหรือไม่? ไฟล์ Asset ของคลิปจะถูกลบด้วย"))return;const {error}=await supabase.from("contents").delete().eq("id",draft.id);if(error)alert(error.message);else refresh();}
  async function copy(value:string|null,label:string){if(!value)return alert(`ยังไม่มี ${label}`);await navigator.clipboard.writeText(value);alert(`คัดลอก ${label} แล้ว`);}
  async function uploadAsset(file:File,type:Asset["asset_type"]){
    if(!supabase)return;
    const limit=type==="video"?100*1024*1024:15*1024*1024;
    if(file.size>limit){alert(type==="video"?"วิดีโอต้องไม่เกิน 100 MB":"รูปต้องไม่เกิน 15 MB");return;}
    setUploading(type);
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=`${draft.id}/${Date.now()}-${safe}`;
    const {error:uploadError}=await supabase.storage.from("nova-assets").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError){setUploading(null);alert(uploadError.message);return;}
    const {data:urlData}=supabase.storage.from("nova-assets").getPublicUrl(path);
    const {error:dbError}=await supabase.from("assets").insert({content_id:draft.id,campaign_id:draft.campaign_id,asset_type:type,file_name:file.name,file_path:path,public_url:urlData.publicUrl,mime_type:file.type||null,file_size:file.size});
    if(dbError){await supabase.storage.from("nova-assets").remove([path]);setUploading(null);alert(dbError.message);return;}
    setUploading(null);alert("อัปโหลดไฟล์สำเร็จ");refresh();
  }
  async function deleteAsset(asset:Asset){
    if(!supabase||!confirm(`ลบไฟล์ “${asset.file_name}” หรือไม่?`))return;
    const {error:storageError}=await supabase.storage.from("nova-assets").remove([asset.file_path]);
    if(storageError){alert(storageError.message);return;}
    const {error}=await supabase.from("assets").delete().eq("id",asset.id);
    if(error)alert(error.message);else refresh();
  }
  const images=assets.filter(a=>a.asset_type==="image");
  const videos=assets.filter(a=>a.asset_type==="video");
  const thumbnails=assets.filter(a=>a.asset_type==="thumbnail");
  return <div className="backdrop" onMouseDown={close}><div className="contentEditor" onMouseDown={e=>e.stopPropagation()}>
    <div className="editorHead"><div><span className="badge">{draft.character} · {draft.platform}</span><h2>{draft.title}</h2></div><button className="closeButton" onClick={close}>×</button></div>
    <div className="editorGrid"><section className="editorMain form"><label>ชื่อคลิป<input value={draft.title} onChange={e=>set("title",e.target.value)}/></label><label>Hook<textarea rows={3} value={draft.hook||""} onChange={e=>set("hook",e.target.value)}/></label><label>Script<textarea rows={12} value={draft.script||""} onChange={e=>set("script",e.target.value)}/></label><label>Caption + Hashtags<textarea rows={5} value={draft.caption||""} onChange={e=>set("caption",e.target.value)}/></label>
      <AssetSection title="Thumbnail" type="thumbnail" assets={thumbnails} uploading={uploading} upload={uploadAsset} remove={deleteAsset}/>
      <AssetSection title="Images" type="image" assets={images} uploading={uploading} upload={uploadAsset} remove={deleteAsset}/>
      <AssetSection title="Videos" type="video" assets={videos} uploading={uploading} upload={uploadAsset} remove={deleteAsset}/>
    </section>
    <aside className="editorSide"><div className="editorBlock"><h3>Workflow</h3><select value={draft.status} onChange={e=>set("status",e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></div><div className="editorBlock"><h3>Asset Summary</h3><div className="assetSummary"><span>Thumbnail <b>{thumbnails.length}</b></span><span>Images <b>{images.length}</b></span><span>Videos <b>{videos.length}</b></span></div></div><div className="editorBlock"><h3>Storyboard</h3>{scenes.length?scenes.map((x,i)=><div className="scene" key={i}><b>Scene {x.scene||i+1}</b><p>{x.visual||"—"}</p><small>{x.voiceover||""}</small></div>):<p className="muted">ยังไม่มี Storyboard</p>}</div><div className="editorBlock"><h3>Image Prompt</h3><textarea rows={6} value={draft.image_prompt||""} onChange={e=>set("image_prompt",e.target.value)}/><button className="secondary fullButton" onClick={()=>copy(draft.image_prompt,"Image Prompt")}>คัดลอก Image Prompt</button></div><div className="editorBlock"><h3>Video Prompt</h3><textarea rows={7} value={draft.video_prompt||""} onChange={e=>set("video_prompt",e.target.value)}/><button className="secondary fullButton" onClick={()=>copy(draft.video_prompt,"Video Prompt")}>คัดลอก Video Prompt</button></div></aside></div>
    <div className="editorActions"><button className="dangerButton" onClick={remove}>ลบคอนเทนต์</button><div><button className="secondary" onClick={()=>copy(`${draft.hook||""}\n\n${draft.script||""}\n\n${draft.caption||""}`,"ชุดข้อความ")}>คัดลอกทั้งหมด</button><button className="primary" onClick={save} disabled={saving}>{saving?"กำลังบันทึก...":"บันทึกการแก้ไข"}</button></div></div>
  </div></div>;
}

function AssetSection({title,type,assets,uploading,upload,remove}:{title:string;type:Asset["asset_type"];assets:Asset[];uploading:string|null;upload:(file:File,type:Asset["asset_type"])=>void;remove:(asset:Asset)=>void}){
  const accept=type==="video"?"video/*":"image/*";
  return <div className="assetSection"><div className="assetSectionHead"><div><h3>{title}</h3><small>{assets.length} ไฟล์</small></div><label className="uploadButton">{uploading===type?"กำลังอัปโหลด...":"+ Upload"}<input type="file" accept={accept} disabled={Boolean(uploading)} onChange={e=>{const f=e.target.files?.[0];if(f)upload(f,type);e.currentTarget.value="";}}/></label></div>
    {assets.length?<div className="assetGrid">{assets.map(asset=><article className="assetCard" key={asset.id}>{asset.asset_type==="video"?<video src={asset.public_url} controls preload="metadata"/>:<img src={asset.public_url} alt={asset.file_name}/>}<div><b title={asset.file_name}>{asset.file_name}</b><small>{formatFileSize(asset.file_size)}</small><div className="assetCardActions"><a href={asset.public_url} target="_blank" rel="noreferrer">เปิดไฟล์</a><button onClick={()=>remove(asset)}>ลบ</button></div></div></article>)}</div>:<div className="assetEmpty">ยังไม่มี {title}</div>}
  </div>;
}

function AssetLibrary({assets,contents,campaigns,refresh}:{assets:Asset[];contents:Content[];campaigns:Campaign[];refresh:()=>void}){
  const [query,setQuery]=useState("");
  const [type,setType]=useState("All");
  const [selectedContent,setSelectedContent]=useState<Content|null>(null);
  const filtered=assets.filter(a=>{const content=contents.find(c=>c.id===a.content_id);return(type==="All"||a.asset_type===type)&&(!query||`${a.file_name} ${content?.title||""}`.toLowerCase().includes(query.toLowerCase()));});
  async function remove(asset:Asset){if(!supabase||!confirm(`ลบไฟล์ “${asset.file_name}” หรือไม่?`))return;const {error:se}=await supabase.storage.from("nova-assets").remove([asset.file_path]);if(se){alert(se.message);return;}const {error}=await supabase.from("assets").delete().eq("id",asset.id);if(error)alert(error.message);else refresh();}
  return <><div className="factoryToolbar"><div><h2>Asset Library</h2><p>รวมรูป วิดีโอ และ Thumbnail ของทุกคลิปไว้ในที่เดียว</p></div><div className="factoryFilters"><input placeholder="ค้นหาชื่อไฟล์หรือชื่อคลิป" value={query} onChange={e=>setQuery(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option value="thumbnail">Thumbnail</option><option value="image">Image</option><option value="video">Video</option></select></div></div>
    <section className="kpis assetKpis"><Kpi label="ไฟล์ทั้งหมด" value={String(assets.length)}/><Kpi label="Thumbnail" value={String(assets.filter(a=>a.asset_type==="thumbnail").length)}/><Kpi label="รูปภาพ" value={String(assets.filter(a=>a.asset_type==="image").length)}/><Kpi label="วิดีโอ" value={String(assets.filter(a=>a.asset_type==="video").length)}/></section>
    {filtered.length?<div className="libraryGrid">{filtered.map(asset=>{const content=contents.find(c=>c.id===asset.content_id);const campaign=campaigns.find(c=>c.id===asset.campaign_id);return <article className="libraryCard" key={asset.id}>{asset.asset_type==="video"?<video src={asset.public_url} controls preload="metadata"/>:<img src={asset.public_url} alt={asset.file_name}/>}<div className="libraryBody"><span className="badge">{asset.asset_type}</span><h3>{asset.file_name}</h3><p>{content?.title||"ไม่พบคลิป"}</p><small>{campaign?.name||"ไม่มี Campaign"} · {formatFileSize(asset.file_size)}</small><div className="libraryActions"><a href={asset.public_url} target="_blank" rel="noreferrer">เปิดไฟล์</a>{content&&<button onClick={()=>setSelectedContent(content)}>เปิดคลิป</button>}<button className="dangerText" onClick={()=>remove(asset)}>ลบ</button></div></div></article>})}</div>:<div className="panel"><Empty text="ยังไม่มี Asset — เปิดคลิปใน Content หรือ Campaign แล้วกด Upload"/></div>}
    {selectedContent&&<ContentEditor content={selectedContent} assets={assets.filter(a=>a.content_id===selectedContent.id)} close={()=>setSelectedContent(null)} refresh={async()=>{await refresh();setSelectedContent(null);}}/>}
  </>;
}

function PublishingCalendar({contents,campaigns,assets,refresh}:{contents:Content[];campaigns:Campaign[];assets:Asset[];refresh:()=>void}){
  const [selected,setSelected]=useState<Content|null>(null);
  const [month,setMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("All");
  const scheduled=contents.filter(c=>c.scheduled_at).sort((a,b)=>String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
  const filtered=scheduled.filter(c=>{
    const inMonth=String(c.scheduled_at||"").startsWith(month);
    const text=`${c.title} ${c.character} ${c.platform}`.toLowerCase();
    return inMonth&&(filter==="All"||c.publish_status===filter)&&(!query||text.includes(query.toLowerCase()));
  });
  const ready=contents.filter(c=>c.status==="Ready"&&!c.scheduled_at);
  const posted=contents.filter(c=>c.publish_status==="Published"||c.status==="Posted");
  const calendarDays=useMemo(()=>{
    const [y,m]=month.split("-").map(Number); const first=new Date(y,m-1,1); const last=new Date(y,m,0);
    const cells:Array<{date:string|null;day:number|null;items:Content[]}>=[];
    for(let i=0;i<first.getDay();i++)cells.push({date:null,day:null,items:[]});
    for(let d=1;d<=last.getDate();d++){
      const date=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push({date,day:d,items:filtered.filter(c=>String(c.scheduled_at).slice(0,10)===date)});
    }
    while(cells.length%7)cells.push({date:null,day:null,items:[]}); return cells;
  },[month,filtered]);
  async function saveSchedule(e:FormEvent<HTMLFormElement>){
    e.preventDefault(); if(!supabase||!selected)return; const f=new FormData(e.currentTarget);
    const scheduledAt=String(f.get("scheduled_at")||""); const publishStatus=String(f.get("publish_status")||"Scheduled");
    const publishUrl=String(f.get("publish_url")||"")||null;
    const updates:any={scheduled_at:scheduledAt?new Date(scheduledAt).toISOString():null,publish_status:publishStatus,publish_url:publishUrl};
    if(publishStatus==="Published"){updates.status="Posted";updates.published_at=new Date().toISOString();}
    const {error}=await supabase.from("contents").update(updates).eq("id",selected.id);
    if(error)alert(error.message);else{setSelected(null);refresh();}
  }
  async function unschedule(content:Content){if(!supabase||!confirm("นำคลิปนี้ออกจากตารางเผยแพร่หรือไม่?"))return;const {error}=await supabase.from("contents").update({scheduled_at:null,publish_status:"Draft"}).eq("id",content.id);if(error)alert(error.message);else refresh();}
  const thumb=(id:string)=>assets.find(a=>a.content_id===id&&a.asset_type==="thumbnail")?.public_url||assets.find(a=>a.content_id===id&&a.asset_type==="image")?.public_url;
  return <>
    <div className="factoryToolbar"><div><h2>Publishing Calendar</h2><p>วางแผนวันและเวลาลงคอนเทนต์ พร้อมติดตามสถานะการเผยแพร่</p></div><div className="factoryFilters"><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/><input placeholder="ค้นหาคลิป" value={query} onChange={e=>setQuery(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option><option>Scheduled</option><option>Published</option><option>Failed</option></select></div></div>
    <section className="kpis assetKpis"><Kpi label="รอจัดตาราง" value={String(ready.length)}/><Kpi label="มีตารางแล้ว" value={String(scheduled.length)}/><Kpi label="เผยแพร่แล้ว" value={String(posted.length)}/><Kpi label="เดือนนี้" value={String(filtered.length)}/></section>
    {ready.length>0&&<section className="panel publishQueue"><div className="panelTop"><div><h2>Ready to Schedule</h2><p>คลิปที่สถานะ Ready และยังไม่ได้กำหนดวันลง</p></div></div><div className="scheduleStrip">{ready.map(c=><button key={c.id} className="scheduleMini" onClick={()=>setSelected(c)}>{thumb(c.id)?<img src={thumb(c.id)} alt=""/>:<span>▶</span>}<div><b>{c.title}</b><small>{c.character} · {c.platform}</small></div><em>จัดตาราง</em></button>)}</div></section>}
    <section className="panel calendarPanel"><div className="calendarWeek">{["อา","จ","อ","พ","พฤ","ศ","ส"].map(x=><b key={x}>{x}</b>)}</div><div className="calendarGrid">{calendarDays.map((cell,i)=><div className={`calendarCell ${cell.date?"":"blank"}`} key={i}>{cell.day&&<span className="dayNumber">{cell.day}</span>}{cell.items.map(c=><button key={c.id} className={`calendarEvent ${c.publish_status.toLowerCase()}`} onClick={()=>setSelected(c)}><b>{new Date(String(c.scheduled_at)).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"})}</b><span>{c.title}</span></button>)}</div>)}</div></section>
    <section className="panel"><div className="panelTop"><div><h2>Publishing Queue</h2><p>รายการที่กำหนดวันเผยแพร่แล้ว</p></div></div>{scheduled.length?<div className="publishList">{scheduled.map(c=><article key={c.id}><div className="publishMedia">{thumb(c.id)?<img src={thumb(c.id)} alt=""/>:<span>▶</span>}</div><div className="publishInfo"><span className={`publishBadge ${c.publish_status.toLowerCase()}`}>{c.publish_status}</span><h3>{c.title}</h3><p>{c.character} · {c.platform} · {new Date(String(c.scheduled_at)).toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"})}</p></div><div className="publishActions">{c.publish_url&&<a href={c.publish_url} target="_blank" rel="noreferrer">เปิดโพสต์</a>}<button onClick={()=>setSelected(c)}>แก้ไข</button><button className="dangerText" onClick={()=>unschedule(c)}>ยกเลิก</button></div></article>)}</div>:<Empty text="ยังไม่มีคลิปในตารางเผยแพร่"/>}</section>
    {selected&&<Modal title="กำหนดการเผยแพร่" close={()=>setSelected(null)}><form className="form" onSubmit={saveSchedule}><div className="scheduleSelected"><b>{selected.title}</b><small>{selected.character} · {selected.platform}</small></div><label>วันและเวลาเผยแพร่<input name="scheduled_at" type="datetime-local" required defaultValue={selected.scheduled_at?toLocalInput(selected.scheduled_at):""}/></label><label>สถานะ<select name="publish_status" defaultValue={selected.publish_status||"Scheduled"}><option>Scheduled</option><option>Published</option><option>Failed</option></select></label><label>ลิงก์โพสต์จริง<input name="publish_url" type="url" defaultValue={selected.publish_url||""} placeholder="https://..."/></label><button className="primary">บันทึกตารางเผยแพร่</button></form></Modal>}
  </>;
}

function toLocalInput(value:string){const d=new Date(value);const pad=(n:number)=>String(n).padStart(2,"0");return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;}

function formatFileSize(bytes:number){if(!bytes)return "0 B";const units=["B","KB","MB","GB"];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);return `${(bytes/Math.pow(1024,i)).toFixed(i?1:0)} ${units[i]}`;}

function CreativeEngine({products,refresh}:{products:Product[];refresh:()=>void}){
  const [productId,setProductId]=useState("");
  const [target,setTarget]=useState("ผู้หญิงวัยทำงาน อายุ 22–35 ปี ที่ต้องการข้อมูลจริงก่อนตัดสินใจซื้อ");
  const [tone,setTone]=useState("จริงใจ เป็นธรรมชาติ ทันสมัย ไม่ขายเกินจริง");
  const [platform,setPlatform]=useState("TikTok");
  const [goal,setGoal]=useState("Conversion");
  const [creator,setCreator]=useState("AUTO");
  const [creativity,setCreativity]=useState("Bold");
  const [count,setCount]=useState(7);
  const [mustInclude,setMustInclude]=useState("ระบุสิ่งที่ควรเช็กก่อนซื้อ และหลีกเลี่ยงข้อมูลที่สินค้าไม่ได้ระบุ");
  const [generating,setGenerating]=useState(false);
  const [message,setMessage]=useState("");
  const [result,setResult]=useState<{campaign_id?:string;campaign_name?:string;big_idea?:string;strategy_summary?:string;quality_score?:number;items:CampaignItem[]} | null>(null);
  const product=products.find(p=>p.id===productId);

  async function generate(){
    if(!supabase||!product){setMessage("กรุณาเลือกสินค้าก่อน");return;}
    setGenerating(true);setMessage("NOVA กำลังวิเคราะห์สินค้าและประชุมทีม AI...");setResult(null);
    const {data,error}=await supabase.functions.invoke("creative-engine",{body:{
      product, target_audience:target, tone, platform, goal, creator, creativity,
      clip_count:count, must_include:mustInclude
    }});
    setGenerating(false);
    if(error){setMessage(`สร้างไม่สำเร็จ: ${error.message}`);return;}
    if(!data?.items?.length){setMessage(data?.error||"AI ไม่ได้ส่งผลลัพธ์กลับมา");return;}
    setResult(data);setMessage(`สร้างและบันทึก ${data.items.length} คลิปเรียบร้อยแล้ว`);await refresh();
  }

  async function regenerate(){await generate();}

  return <div className="creativeEngine">
    <section className="creativeHero"><div><span className="badge">NOVA MULTI-AGENT AI</span><h2>One click. Full campaign.</h2><p>Strategist → Creative Director → Copywriter → Storyboard Director → Prompt Engineer → Quality Checker</p></div><div className="aiOrb">✦</div></section>
    <section className="creativeLayout">
      <div className="panel form creativeControl"><div className="sectionTitle"><div><small>CAMPAIGN BRIEF</small><h2>ให้ NOVA คิดงานแทนทั้งทีม</h2></div><span className="smartBadge">SMART MODE</span></div>
        <label>สินค้า<select value={productId} onChange={e=>setProductId(e.target.value)}><option value="">— เลือกสินค้า —</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.brand||p.category}</option>)}</select></label>
        {product&&<div className="productBrief"><b>{product.name}</b><span>{product.category} · {money(product.price)} · Commission {money(product.commission)}</span></div>}
        <div className="two"><label>เป้าหมาย<select value={goal} onChange={e=>setGoal(e.target.value)}><option>Conversion</option><option>Awareness</option><option>Trust</option><option>Product Education</option><option>Launch</option></select></label><label>แพลตฟอร์ม<select value={platform} onChange={e=>setPlatform(e.target.value)}><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option><option>Facebook Reels</option></select></label></div>
        <div className="two"><label>Creator<select value={creator} onChange={e=>setCreator(e.target.value)}><option>AUTO</option><option>LUNA</option><option>MAYA</option><option>ETHAN</option><option>ARIA</option></select></label><label>Creativity<select value={creativity} onChange={e=>setCreativity(e.target.value)}><option>Safe</option><option>Balanced</option><option>Bold</option><option>Experimental</option></select></label></div>
        <label>กลุ่มเป้าหมาย<textarea rows={3} value={target} onChange={e=>setTarget(e.target.value)}/></label>
        <label>โทนแบรนด์<input value={tone} onChange={e=>setTone(e.target.value)}/></label>
        <label>สิ่งที่ต้องมี / ข้อห้าม<textarea rows={3} value={mustInclude} onChange={e=>setMustInclude(e.target.value)}/></label>
        <label>จำนวนคลิป <b>{count}</b><input type="range" min="3" max="15" value={count} onChange={e=>setCount(Number(e.target.value))}/></label>
        <button className="generateButton" disabled={generating||!productId} onClick={generate}>{generating?<><span className="spinner"/> กำลังสร้าง Creative Universe...</>:<>✦ GENERATE FULL CAMPAIGN</>}</button>
        <small className="helper">ระบบจะสร้าง Campaign และบันทึกทุกคลิปเข้า Content Factory อัตโนมัติ</small>
        {message&&<div className={message.includes("ไม่สำเร็จ")?"engineError":"engineMessage"}>{message}</div>}
      </div>
      <aside className="creativeBrain">
        <div className="brainHead"><span>LIVE AI WORKFLOW</span><b>{generating?"PROCESSING":"READY"}</b></div>
        {[['01','STRATEGIST','วิเคราะห์สินค้า เป้าหมาย และแรงจูงใจซื้อ'],['02','CREATIVE DIRECTOR','สร้าง Big Idea และมุมเล่าเรื่องไม่ซ้ำ'],['03','COPYWRITER','เขียน Hook, Script และ CTA'],['04','STORYBOARD','แตกฉาก ภาพ เสียง และจังหวะ'],['05','PROMPT ENGINEER','สร้าง Image / Video Prompt ภาษาอังกฤษ'],['06','QUALITY CHECKER','ตรวจความซ้ำ ความจริง และคำกล่าวอ้าง']].map(([n,name,desc],i)=><div className={`brainStep ${generating?'running':''}`} style={{animationDelay:`${i*180}ms`}} key={name}><i>{n}</i><div><b>{name}</b><small>{desc}</small></div><span>✓</span></div>)}
      </aside>
    </section>
    {result&&<section className="resultZone">
      <div className="resultHeader"><div><span className="badge">CAMPAIGN CREATED</span><h2>{result.campaign_name||"NOVA Campaign"}</h2><p>{result.big_idea}</p></div><div className="qualityScore"><small>QUALITY</small><b>{result.quality_score||90}</b><span>/100</span></div></div>
      {result.strategy_summary&&<div className="strategyCallout"><b>Creative Strategy</b><p>{result.strategy_summary}</p></div>}
      <div className="resultActions"><button className="secondary" onClick={regenerate} disabled={generating}>↻ สร้างชุดใหม่ทั้งหมด</button><button className="primary" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>สร้าง Campaign ถัดไป</button></div>
      <div className="creativeResults">{result.items.map((x,i)=><article key={i} className="creativeCard"><div className="creativeCardTop"><span>CLIP {String(i+1).padStart(2,'0')}</span><b>{(x as any).angle||"UNIQUE ANGLE"}</b></div><h3>{x.title}</h3><div className="hookBox">“{x.hook}”</div><p>{x.script}</p><details><summary>Storyboard & Production Prompts</summary><div className="detailBody"><b>Storyboard</b>{x.storyboard?.map((scene,j)=><div className="sceneRow" key={j}><i>{scene.scene}</i><span><strong>{scene.visual}</strong><small>{scene.voiceover}</small></span></div>)}<b>Image Prompt</b><code>{x.image_prompt}</code><b>Video Prompt</b><code>{x.video_prompt}</code><b>Caption</b><p>{x.caption}</p></div></details></article>)}</div>
    </section>}
  </div>;
}
function Analytics({contents,revenue,views,clicks}:{contents:Content[];revenue:number;views:number;clicks:number}){return <div className="grid2"><div className="panel metric"><small>Revenue per 1,000 views</small><strong>{money(views?revenue/views*1000:0)}</strong></div><div className="panel metric"><small>Clicks</small><strong>{clicks.toLocaleString()}</strong></div><div className="panel full"><h2>Performance</h2>{contents.slice(0,10).map(c=><Row key={c.id} left={c.title} sub={`${c.views} views · ${c.clicks} clicks`} right={money(c.revenue)}/>)}{!contents.length&&<Empty/>}</div></div>}
function Kpi({label,value}:{label:string;value:string}){return <div className="kpi"><small>{label}</small><strong>{value}</strong></div>}
function Row({left,sub,right}:{left:string;sub:string;right:string}){return <div className="row"><div><b>{left}</b><small>{sub}</small></div><span className="pill">{right}</span></div>}
function Empty({text="ยังไม่มีข้อมูล"}:{text?:string}){return <div className="empty">{text}</div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:React.ReactNode}){return <div className="backdrop" onMouseDown={close}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button onClick={close}>×</button></div>{children}</div></div>}
