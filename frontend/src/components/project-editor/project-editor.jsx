import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {api,readJson} from "../../api";
import "../dashboard/dashboard.css";

export default function ProjectEditor(){
 const {id}=useParams(), navigate=useNavigate(); const [p,setP]=useState(null); const [msg,setMsg]=useState("");
 useEffect(()=>{readJson(api(`/api/projects/${id}`)).then(d=>setP(d.project)).catch(e=>setMsg(e.message))},[id]);
 if(!p) return <div className="dashboard-page"><main className="dashboard-content"><p>{msg||"Loading..."}</p></main></div>;
 const save=async e=>{e.preventDefault();try{await readJson(api(`/api/projects/${id}`,{method:"PATCH",body:JSON.stringify(p)}));setMsg("Draft saved.");}catch(e){setMsg(e.message)}};
 return <div className="dashboard-page"><header className="dashboard-nav"><button className="dashboard-brand" onClick={()=>navigate("/dashboard")}>Hackathon Raptors</button><button className="dashboard-gallery-btn" onClick={()=>navigate("/gallery")}>Public Gallery</button></header><main className="dashboard-content"><section className="dashboard-welcome"><p className="dashboard-eyebrow">PROJECT EDITOR</p><h1>{p.title||"Untitled project"}</h1><p>Drafts remain editable until the submission deadline.</p></section><form className="dashboard-panel mini-form" onSubmit={save}><input value={p.title} onChange={e=>setP({...p,title:e.target.value})} placeholder="Project title"/><input value={p.repo_url} onChange={e=>setP({...p,repo_url:e.target.value})} placeholder="Repository URL"/><textarea value={p.summary} onChange={e=>setP({...p,summary:e.target.value})} placeholder="Summary"/><button>Save draft</button>{p.status==="draft"&&<button type="button" onClick={async()=>{try{await readJson(api(`/api/projects/${id}/submit`,{method:"POST"}));navigate("/dashboard")}catch(e){setMsg(e.message)}}}>Submit project</button>}{msg&&<p className="muted">{msg}</p>}</form></main></div>
}
