import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, CheckSquare, PieChart, Settings, Users, Bell, 
  Plus, Download, Upload, ChevronRight, AlertCircle, TrendingUp, X, BarChart2, 
  Save, Target, Edit3, Printer, FileBarChart, Filter, Trash2, List, Layers, 
  Star, Activity, Eye, FileSpreadsheet, HelpCircle, CheckCircle, Clock, PenTool, 
  AlertTriangle, Database, Wifi, WifiOff, Search as SearchIcon, ArrowRight, Building2,
  TrendingDown
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
    getFirestore, collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, writeBatch 
} from "firebase/firestore";

// --- 1. CONFIGURATION & MOCK DATA ---

const firebaseConfig = {
  apiKey: "AIzaSyArS2zL1N3eCLik3Ui82pom784bKApPweo",
  authDomain: "srms-zoneidea.firebaseapp.com",
  projectId: "srms-zoneidea",
  storageBucket: "srms-zoneidea.firebasestorage.app",
  messagingSenderId: "971630913268",
  appId: "1:971630913268:web:99e50828e6a2c8428da0a1",
  measurementId: "G-EH3FQECML3"
};

const initFirebase = () => {
    try {
        if (!firebaseConfig.apiKey) throw new Error("No Config");
        const app = initializeApp(firebaseConfig);
        return getFirestore(app);
    } catch (error) {
        console.error("Firebase Init Error (Running Offline):", error);
        return null;
    }
};

const realDb = initFirebase();

const SEED_DEPARTMENTS = [
  { name: 'ฝ่ายกฎหมาย (กม.)' }, { name: 'ฝ่ายการบัญชี (บช.)' }, { name: 'ฝ่ายกำกับการปฏิบัติงาน (กก.)' },
  { name: 'ฝ่ายกิจกรรมเพื่อสังคม (กส.)' }, { name: 'ฝ่ายเงินฝากและพันธมิตร (งพ.)' }, { name: 'ฝ่ายสื่อสารองค์กร (สอ.)' }, { name: 'สำนักกรรมการผู้จัดการ (สก)' }
];
const SEED_GROUPS = [
  { id: '1', name: 'เจ้าของ' }, { id: '2', name: 'หน่วยงานกำกับดูแล' }, { id: '3', name: 'คณะกรรมการธนาคาร' },
  { id: '4', name: 'พนักงาน' }, { id: '5', name: 'ผู้มีรายได้น้อยกลุ่มเป้าหมาย' }, { id: '6', name: 'ลูกค้า' },
  { id: '7', name: 'พันธมิตรทางธุรกิจ' }, { id: '8', name: 'ผู้ให้บริการภายนอก' }, { id: '9', name: 'สังคมและชุมชน' }, { id: '10', name: 'สื่อมวลชน' }
];
const SEED_STAKEHOLDERS = [
  { id: '1.1', groupId: '1', name: 'สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ' }, { id: '1.2', groupId: '1', name: 'สำนักงานเศรษฐกิจการคลัง' },
  { id: '2.1', groupId: '2', name: 'ธนาคารแห่งประเทศไทย' }, { id: '7.1', groupId: '7', name: 'บริษัทพัฒนาอสังหาริมทรัพย์' },
  { id: '8.3', groupId: '8', name: 'บริษัทติดตามหนี้' }, { id: '10.1', groupId: '10', name: 'สื่อมวลชน' }
];

const INITIAL_GLOBAL_TARGETS = { overall: 90.00, operational: 85.00, communication: 90.00, transparency: 95.00, relationship: 90.00, dissatisfaction: 5.00, loyalty: 85.00, engagement: 85.00, image: 90.00, channel: 90.00, levelsMethods: 85.00 };
const INITIAL_USERS = [
    { id: 'u1', name: 'Admin Central', email: 'admin@ghb.co.th', role: 'admin', deptId: null, status: 'Active' },
    { id: 'u2', name: 'เจ้าหน้าที่ สอ.', email: 'comm@ghb.co.th', role: 'user', deptId: 44, status: 'Active' }
];

const THAI_LABELS = { overall: 'ความพึงพอใจโดยรวม', operational: 'ด้านปฏิบัติงาน', communication: 'การสื่อสาร', transparency: 'ความโปร่งใส', relationship: 'ความสัมพันธ์', dissatisfaction: 'ความไม่พึงพอใจ', loyalty: 'ความภักดี', engagement: 'ความผูกพัน', image: 'ภาพลักษณ์', channel: 'ช่องทางสื่อสาร', levelsMethods: 'ระดับและรูปแบบ' };

// --- 2. SHARED COMPONENTS ---

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}>{children}</div>
);

const Badge = ({ status }) => {
  const styles = { Completed: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700', Late: 'bg-red-100 text-red-700', Recorded: 'bg-green-100 text-green-700', NotRecorded: 'bg-gray-100 text-gray-500', Active: 'bg-green-100 text-green-700' };
  const icons = { Recorded: <CheckCircle size={12} className="mr-1"/>, NotRecorded: <Clock size={12} className="mr-1"/> };
  return <span className={`px-2 py-1 rounded text-xs font-medium flex items-center w-fit ${styles[status] || 'bg-gray-100'}`}>{icons[status]} {status}</span>;
};

const InputTarget = ({ label, value, onChange }) => (
    <div className="flex justify-between items-center bg-gray-50 p-2 rounded"><span className="text-sm text-gray-700 capitalize">{label}</span><div className="flex items-center gap-2"><input type="number" step="0.01" className="w-24 text-right p-1 border border-gray-300 rounded outline-none focus:border-orange-500" value={value} onChange={e => onChange(e.target.value)} /><span className="text-xs text-gray-500">%</span></div></div>
);

const InputScoreWithTarget = ({ label, actual, target, onChange, inverse }) => (
    <div className="flex justify-between items-center p-2 rounded hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-700 capitalize flex-1">{label}</span>
        <div className="flex items-center gap-6">
            <div className="text-right"><span className="block text-[10px] text-gray-400">Target</span><span className="text-sm font-medium text-gray-500">{Number(target).toFixed(2)}</span></div>
            <div><span className="block text-[10px] text-gray-400 mb-1">Actual</span><input type="number" step="0.01" className={`w-24 text-right p-1 border rounded outline-none ${ (parseFloat(actual) || 0) >= target ? (inverse ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700') : (inverse ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700') } focus:ring-1 focus:ring-blue-500`} value={actual} onChange={e => onChange(e.target.value)} /></div>
        </div>
    </div>
);

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium ${activeTab === id ? 'bg-orange-50 text-orange-600 border-r-4 border-orange-500' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Icon size={18} /> {label}
    </button>
);

const ScoreComparisonCard = ({ title, score, target, inverse = false }) => {
    const numScore = parseFloat(score) || 0;
    const numTarget = parseFloat(target) || 0;
    const diff = numScore - numTarget;
    const isPass = inverse ? numScore <= numTarget : numScore >= numTarget;
    const diffColor = isPass ? 'text-green-600' : 'text-red-600';
    const Icon = isPass ? TrendingUp : TrendingDown;
    
    return (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{title}</p>
            <div className="flex justify-between items-end">
                <div>
                    <h4 className={`text-2xl font-bold ${isPass ? 'text-gray-800' : 'text-red-600'}`}>{numScore.toFixed(2)}%</h4>
                    <p className="text-xs text-gray-400">เป้าหมาย: {numTarget.toFixed(2)}%</p>
                </div>
                <div className={`text-right ${diffColor}`}>
                     <Icon size={16} className="inline mr-1"/>
                     <span className="text-sm font-bold">{Math.abs(diff).toFixed(2)}%</span>
                </div>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${isPass ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(numScore, 100)}%` }}></div>
            </div>
        </div>
    );
};

// --- 3. SUB-VIEW COMPONENTS ---

const Sidebar = ({ role, setRole, activeTab, setActiveTab, currentDept, setCurrentDept, departments, isOfflineMode, setIsOfflineMode }) => (
    <div className="w-64 bg-white border-r fixed h-full flex flex-col z-10">
      <div className="p-6 border-b"><div className="text-xl font-bold text-orange-600">GHB SRMS</div><div className="text-xs text-gray-500">System v2.0 (Firebase)</div></div>
      <div className="flex-1 py-4 space-y-1 overflow-y-auto">
         {role === 'user' && <><NavItem id="dashboard" icon={LayoutDashboard} label="ภาพรวม" activeTab={activeTab} setActiveTab={setActiveTab}/><NavItem id="planning" icon={FileText} label="จัดการแผนงาน" activeTab={activeTab} setActiveTab={setActiveTab}/><NavItem id="reporting" icon={CheckSquare} label="บันทึกผล" activeTab={activeTab} setActiveTab={setActiveTab}/></>}
         {role === 'executive' && <><NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab}/><NavItem id="survey" icon={PieChart} label="ผลการสำรวจ" activeTab={activeTab} setActiveTab={setActiveTab}/></>}
         {role === 'admin' && <><NavItem id="survey_input" icon={BarChart2} label="จัดการผลสำรวจ" activeTab={activeTab} setActiveTab={setActiveTab}/><NavItem id="users" icon={Users} label="ผู้ใช้งาน" activeTab={activeTab} setActiveTab={setActiveTab}/><NavItem id="master" icon={Settings} label="ข้อมูลหลัก" activeTab={activeTab} setActiveTab={setActiveTab}/></>}
      </div>
      <div className="p-4 border-t bg-gray-50">
         <div className="mb-2 text-xs font-bold text-gray-400">DEBUG TOOLS</div>
         <div className="flex items-center justify-between mb-2 px-1">
             <span className="text-xs text-gray-500">Mode:</span>
             <button onClick={() => setIsOfflineMode(!isOfflineMode)} className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${isOfflineMode ? 'bg-gray-300 text-gray-700' : 'bg-green-100 text-green-700'}`}>
                 {isOfflineMode ? <WifiOff size={10}/> : <Wifi size={10}/>} {isOfflineMode ? 'Offline' : 'Online'}
             </button>
         </div>
         <select className="w-full text-xs p-1 border rounded mb-2" value={role} onChange={e => {setRole(e.target.value); setActiveTab(e.target.value==='admin'?'survey_input':'dashboard')}}><option value="user">User Role</option><option value="executive">Exec Role</option><option value="admin">Admin Role</option></select>
         {role === 'user' && <select className="w-full text-xs p-1 border rounded" value={currentDept?.id || ''} onChange={e => setCurrentDept(departments.find(d => String(d.id) === e.target.value))}><option value="">Select Dept</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>}
      </div>
    </div>
);

const MasterDataView = ({ db, departments, stakeholderGroups, stakeholders, handleCreate, handleUpdate, handleDelete, seedDatabase }) => {
    const [tab, setTab] = useState('dashboard');
    const [editItem, setEditItem] = useState(null);
    const [newItem, setNewItem] = useState({});
    const [importSummary, setImportSummary] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const collections = { dept: 'departments', group: 'stakeholderGroups', stake: 'stakeholders' };
    const fields = { dept: ['name'], group: ['id', 'name'], stake: ['id', 'name', 'groupId'] };
    const rawData = tab === 'dept' ? departments : tab === 'group' ? stakeholderGroups : stakeholders;
    
    const getData = () => {
        if (!searchTerm) return rawData;
        return rawData.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())));
    };
    
    const onSave = async () => {
        if (editItem) {
           await handleUpdate(collections[tab], editItem.id, editItem);
           setEditItem(null);
        } else {
           const idToUse = (tab !== 'dept' && newItem.id) ? newItem.id : null;
           if (tab !== 'dept' && !idToUse) return alert("กรุณาระบุ ID");
           const success = await handleCreate(collections[tab], newItem, idToUse);
           if(success) setNewItem({});
        }
    };
    const deleteItem = (id) => handleDelete(collections[tab], id);

    const downloadTemplate = () => {
        let header = "";
        let example = "";
        if (tab === 'dept') { header = "Name"; example = "ฝ่ายตัวอย่าง"; }
        else if (tab === 'group') { header = "ID,Name"; example = "11,กลุ่มตัวอย่าง"; }
        else { header = "ID,Name,GroupID"; example = "11.1,ตัวแทนตัวอย่าง,1"; }
        
        const csvContent = "\uFEFF" + header + "\n" + example;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `template_${tab}.csv`; link.click();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const lines = evt.target.result.split('\n');
            const newItems = [];
            const duplicates = [];
            for(let i=1; i<lines.length; i++) {
                const line = lines[i].trim();
                if(!line) continue;
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g,'').trim());
                let obj = {};
                let isDuplicate = false;
                if(tab === 'dept' && cols[0]) {
                    obj = { name: cols[0] };
                    isDuplicate = rawData.some(d => d.name === cols[0]);
                } else if (tab === 'group' && cols[0] && cols[1]) {
                    obj = { id: cols[0], name: cols[1] };
                    isDuplicate = rawData.some(d => String(d.id) === cols[0]);
                } else if (tab === 'stake' && cols[0] && cols[1] && cols[2]) {
                    obj = { id: cols[0], name: cols[1], groupId: cols[2] };
                    isDuplicate = rawData.some(d => String(d.id) === cols[0]);
                }
                if(Object.keys(obj).length > 0) {
                    if (isDuplicate) duplicates.push(obj);
                    else newItems.push(obj);
                }
            }
            setImportSummary({ newItems, duplicates });
            e.target.value = null;
        };
        reader.readAsText(file);
    };

    const confirmBatchImport = async () => {
        if (!importSummary || importSummary.newItems.length === 0) return;
        let count = 0;
        for (const item of importSummary.newItems) {
            const idToUse = item.id || null;
            await handleCreate(collections[tab], item, idToUse);
            count++;
        }
        alert(`นำเข้าสำเร็จ ${count} รายการ`);
        setImportSummary(null);
    };

    if (tab === 'dashboard') {
        return (
            <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">ภาพรวมข้อมูลหลัก (Master Data)</h2>
                    <button onClick={seedDatabase} className="text-xs bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 flex items-center gap-1 transition-colors"><Database size={14}/> ข้อมูลเริ่มต้น</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card onClick={() => setTab('dept')} className="hover:border-blue-300 cursor-pointer bg-gradient-to-br from-white to-blue-50"><div className="flex justify-between items-start"><div><p className="text-sm text-gray-500 mb-1">ฝ่ายงาน</p><h3 className="text-3xl font-bold text-blue-600">{departments.length}</h3></div><div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Building2 size={24}/></div></div><div className="mt-4 text-xs text-blue-500 flex items-center gap-1 font-medium">จัดการฝ่ายงาน <ArrowRight size={12}/></div></Card>
                    <Card onClick={() => setTab('group')} className="hover:border-orange-300 cursor-pointer bg-gradient-to-br from-white to-orange-50"><div className="flex justify-between items-start"><div><p className="text-sm text-gray-500 mb-1">กลุ่มผู้มีส่วนได้ส่วนเสีย</p><h3 className="text-3xl font-bold text-orange-600">{stakeholderGroups.length}</h3></div><div className="p-3 bg-orange-100 rounded-lg text-orange-600"><Layers size={24}/></div></div><div className="mt-4 text-xs text-orange-500 flex items-center gap-1 font-medium">จัดการกลุ่ม <ArrowRight size={12}/></div></Card>
                    <Card onClick={() => setTab('stake')} className="hover:border-green-300 cursor-pointer bg-gradient-to-br from-white to-green-50"><div className="flex justify-between items-start"><div><p className="text-sm text-gray-500 mb-1">ตัวแทน</p><h3 className="text-3xl font-bold text-green-600">{stakeholders.length}</h3></div><div className="p-3 bg-green-100 rounded-lg text-green-600"><Users size={24}/></div></div><div className="mt-4 text-xs text-green-500 flex items-center gap-1 font-medium">จัดการตัวแทน <ArrowRight size={12}/></div></Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setTab('dashboard')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronRight className="rotate-180" size={20}/></button>
                    <h2 className="text-2xl font-bold">จัดการ: {tab === 'dept' ? 'ฝ่ายงาน' : tab === 'group' ? 'กลุ่มผู้มีส่วนได้ส่วนเสีย' : 'ตัวแทน'}</h2>
                </div>
                <div className="flex gap-2 w-full md:w-auto"><div className="relative flex-1 md:w-64"><SearchIcon className="absolute left-2 top-2.5 text-gray-400" size={16} /><input type="text" placeholder="ค้นหา..." className="w-full pl-8 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-orange-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div></div>
            </div>
            
            <div className="flex gap-2 border-b">
                <button onClick={()=>setTab('dept')} className={`px-4 py-2 ${tab==='dept'?'border-b-2 border-orange-500 font-bold text-orange-600':''}`}>ฝ่ายงาน</button>
                <button onClick={()=>setTab('group')} className={`px-4 py-2 ${tab==='group'?'border-b-2 border-orange-500 font-bold text-orange-600':''}`}>กลุ่ม</button>
                <button onClick={()=>setTab('stake')} className={`px-4 py-2 ${tab==='stake'?'border-b-2 border-orange-500 font-bold text-orange-600':''}`}>ตัวแทน</button>
            </div>

            <Card className="bg-blue-50 border-blue-200"><div className="flex items-center gap-4"><div className="flex-1"><h4 className="font-bold text-blue-800 text-sm mb-1">นำเข้าข้อมูล (CSV)</h4></div><div className="flex gap-2"><button onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Download size={14}/> โหลด Template</button><label className="cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-2"><Upload size={14}/> นำเข้าไฟล์ CSV<input type="file" accept=".csv" className="hidden" onChange={handleImport} /></label></div></div></Card>

            {importSummary && (<Card className="border-yellow-200 bg-yellow-50 mb-4 animate-in fade-in"><h4 className="font-bold text-yellow-800 mb-2">ตรวจสอบรายการนำเข้า ({importSummary.newItems.length} รายการ)</h4><div className="flex justify-end gap-2"><button onClick={()=>setImportSummary(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">ยกเลิก</button><button onClick={confirmBatchImport} className="px-4 py-2 text-white rounded font-bold bg-green-600 hover:bg-green-700">ยืนยัน</button></div></Card>)}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card><h3 className="font-bold mb-4">{editItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h3>
                        <div className="space-y-3">
                            {fields[tab].map(f => (<div key={f}><label className="text-xs text-gray-500 uppercase">{f}</label>{f === 'groupId' ? (<select className="w-full p-2 border rounded" value={editItem ? editItem[f] : newItem[f] || ''} onChange={e => editItem ? setEditItem({...editItem, [f]: e.target.value}) : setNewItem({...newItem, [f]: e.target.value})}><option value="">เลือกกลุ่ม</option>{stakeholderGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>) : (<input className="w-full p-2 border rounded" value={editItem ? editItem[f] : newItem[f] || ''} onChange={e => editItem ? setEditItem({...editItem, [f]: e.target.value}) : setNewItem({...newItem, [f]: e.target.value})} disabled={f==='id' && editItem} placeholder={`ระบุ ${f}`} />)}</div>))}
                            <div className="flex gap-2 pt-2"><button onClick={onSave} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">บันทึก</button>{editItem && <button onClick={()=>setEditItem(null)} className="px-4 bg-gray-200 rounded">ยกเลิก</button>}</div>
                        </div>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card><div className="h-[500px] overflow-y-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 sticky top-0"><tr>{fields[tab].map(f=><th key={f} className="p-2 capitalize">{f}</th>)}<th className="p-2 text-center">Action</th></tr></thead>
                    <tbody className="divide-y">{getData().map(item => (<tr key={item.id} className="hover:bg-gray-50">{fields[tab].map(f => <td key={f} className="p-2">{f === 'groupId' ? stakeholderGroups.find(g=>String(g.id)===String(item.groupId))?.name || item.groupId : item[f]}</td>)}<td className="p-2 text-center flex justify-center gap-2"><button onClick={()=>setEditItem(item)} className="text-blue-500 hover:bg-blue-100 p-1 rounded"><Edit3 size={16}/></button><button onClick={()=>deleteItem(item.id)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></Card>
                </div>
            </div>
        </div>
    );
};

const UserManagementView = ({ users, departments, handleCreate, handleDelete }) => {
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user', deptId: '', status: 'Active' });
    const handleSave = async (e) => { e.preventDefault(); await handleCreate('users', newUser); setNewUser({ name: '', email: '', role: 'user', deptId: '', status: 'Active' }); };
    return ( <div className="space-y-6"><h2 className="text-2xl font-bold">จัดการผู้ใช้งาน</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Card><h3 className="font-bold mb-4">เพิ่มผู้ใช้งาน</h3><form onSubmit={handleSave} className="space-y-3"><input className="w-full border p-2 rounded" placeholder="ชื่อ-นามสกุล" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} required/><input className="w-full border p-2 rounded" placeholder="อีเมล" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} required/><select className="w-full border p-2 rounded" value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}><option value="user">User</option><option value="executive">Executive</option><option value="admin">Admin</option></select><select className="w-full border p-2 rounded" value={newUser.deptId} onChange={e=>setNewUser({...newUser, deptId: e.target.value})}><option value="">เลือกฝ่ายงาน (ถ้ามี)</option>{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><button type="submit" className="w-full bg-orange-500 text-white py-2 rounded">เพิ่มผู้ใช้งาน</button></form></Card><div className="md:col-span-2"><Card><table className="w-full text-sm"><thead><tr><th>ชื่อ</th><th>Role</th><th>ฝ่ายงาน</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id} className="border-t"><td className="p-2">{u.name}<br/><span className="text-xs text-gray-400">{u.email}</span></td><td className="p-2 uppercase">{u.role}</td><td className="p-2">{departments.find(d=>String(d.id)===String(u.deptId))?.name || '-'}</td><td className="p-2"><button onClick={()=>handleDelete('users', u.id)} className="text-red-500"><Trash2 size={16}/></button></td></tr>)}</tbody></table></Card></div></div></div> );
};

const UserPlanningView = ({ plans, stakeholders, currentDept, handleCreate, handleDelete }) => {
    const [newPlan, setNewPlan] = useState({ stakeholderIds: [], objective: '', outcome: '', kpi: '' });
    const [selectedSid, setSelectedSid] = useState('');
    const handleSavePlan = async (e) => { e.preventDefault(); if(newPlan.stakeholderIds.length === 0) return alert('เลือกตัวแทนอย่างน้อย 1 คน'); await handleCreate('plans', { ...newPlan, deptId: currentDept.id, deptName: currentDept.name, createdAt: new Date().toISOString() }); setNewPlan({ stakeholderIds: [], objective: '', outcome: '', kpi: '' }); alert('บันทึกสำเร็จ'); };
    const myPlans = plans.filter(p => String(p.deptId) === String(currentDept?.id));
    if (!currentDept) return <div className="p-10 text-center text-gray-400">กรุณาเลือกฝ่ายงานก่อน</div>;
    return ( <div className="space-y-6"><h2 className="text-2xl font-bold">จัดการแผนงาน ({currentDept.name})</h2><Card><h3 className="font-bold mb-4">สร้างแผนงานใหม่</h3><form onSubmit={handleSavePlan} className="space-y-4"><div><label className="text-sm font-medium">ตัวแทน</label><div className="flex gap-2 mt-1"><select className="flex-1 p-2 border rounded" value={selectedSid} onChange={e=>setSelectedSid(e.target.value)}><option value="">-- เลือก --</option>{stakeholders.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button type="button" onClick={()=>{if(selectedSid && !newPlan.stakeholderIds.includes(selectedSid)) setNewPlan({...newPlan, stakeholderIds:[...newPlan.stakeholderIds, selectedSid]})}} className="px-4 bg-gray-200 rounded hover:bg-gray-300">เพิ่ม</button></div><div className="flex flex-wrap gap-2 mt-2">{newPlan.stakeholderIds.map(sid=><span key={sid} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs flex items-center gap-1">{stakeholders.find(s=>s.id===sid)?.name || sid} <X size={12} className="cursor-pointer" onClick={()=>setNewPlan({...newPlan, stakeholderIds:newPlan.stakeholderIds.filter(x=>x!==sid)})}/></span>)}</div></div><input className="w-full p-2 border rounded" required value={newPlan.objective} onChange={e=>setNewPlan({...newPlan, objective: e.target.value})} placeholder="วัตถุประสงค์"/><div className="grid grid-cols-2 gap-4"><input className="border p-2 rounded" placeholder="ผลลัพธ์" value={newPlan.outcome} onChange={e=>setNewPlan({...newPlan, outcome: e.target.value})}/><input className="border p-2 rounded" placeholder="KPIs" value={newPlan.kpi} onChange={e=>setNewPlan({...newPlan, kpi: e.target.value})}/></div><button type="submit" className="w-full bg-orange-600 text-white py-2 rounded font-bold hover:bg-orange-700">บันทึก</button></form></Card><div className="space-y-4">{myPlans.map(p=><Card key={p.id}><div className="flex justify-between items-start"><h4 className="font-bold">{p.objective}</h4><button onClick={()=>handleDelete('plans', p.id)} className="text-red-500"><Trash2 size={16}/></button></div><div className="text-sm text-gray-500">Stakeholders: {p.stakeholderIds?.map(sid=>stakeholders.find(s=>s.id===sid)?.name).join(', ')}</div></Card>)}</div></div> );
};

const AdminSurveyInput = ({ surveyResults, stakeholders, stakeholderGroups, handleUpdate, globalTargets, saveToDB }) => {
    const [subTab, setSubTab] = useState('dashboard'); // dashboard, kpi, input, import
    const [selectedId, setSelectedId] = useState(''); 
    const [formScores, setFormScores] = useState({ overall: '', operational: '', communication: '', transparency: '', relationship: '', dissatisfaction: '', loyalty: '', engagement: '', image: '', channel: '', levelsMethods: '' });
    const [tempTargets, setTempTargets] = useState(globalTargets); 
    const [filterType, setFilterType] = useState('org'); 
    const [isSaving, setIsSaving] = useState(false);
    
    const [tempImportData, setTempImportData] = useState([]);
    const [importStatus, setImportStatus] = useState('idle');
    const [importLevel, setImportLevel] = useState('org'); // 'org' or 'dept'

    useEffect(() => {
        const strTargets = {};
        Object.keys(globalTargets).forEach(k => { strTargets[k] = String(globalTargets[k]); });
        setTempTargets(strTargets);
    }, [globalTargets]);

    const handleSelectionChange = (id) => {
        setSelectedId(id);
        const existing = surveyResults.find(r => r.stakeholderId === String(id));
        if (existing) {
            const loadedScores = {};
            Object.keys(THAI_LABELS).forEach(k => { loadedScores[k] = existing.scores[k] !== undefined ? String(existing.scores[k]) : ''; });
            setFormScores(loadedScores);
        } else {
            setFormScores({ overall: '', operational: '', communication: '', transparency: '', relationship: '', dissatisfaction: '', loyalty: '', engagement: '', image: '', channel: '', levelsMethods: '' });
        }
    };

    const handleScoreChange = (field, value) => setFormScores(prev => ({ ...prev, [field]: value }));
    const handleTargetChange = (field, value) => setTempTargets(prev => ({ ...prev, [field]: value }));

    const handleSaveScores = async () => {
        if (!selectedId) return alert('กรุณาเลือกรายการ');
        setIsSaving(true);
        const roundedScores = {};
        Object.keys(formScores).forEach(k => {
            const val = parseFloat(formScores[k]);
            roundedScores[k] = isNaN(val) ? 0 : parseFloat(val.toFixed(2));
        });
        const success = await handleUpdate('surveyResults', selectedId, { stakeholderId: selectedId, scores: roundedScores, updatedAt: new Date().toLocaleDateString('th-TH') });
        setIsSaving(false);
        if (success) alert('บันทึกผลสำรวจเรียบร้อยแล้ว');
    };

    const handleSaveTargets = async () => {
        setIsSaving(true);
        const targetsToSave = {};
        Object.entries(tempTargets).forEach(([k, v]) => { const val = parseFloat(v); targetsToSave[k] = isNaN(val) ? 0 : parseFloat(val.toFixed(2)); });
        await saveToDB('settings', {id: 'globalTargets', ...targetsToSave}, 'globalTargets');
        setIsSaving(false);
        alert('บันทึกค่าเป้าหมายเรียบร้อย');
        setSubTab('dashboard');
    };

    // --- Import Logic ---
    const downloadTemplate = (level) => {
        const headers = "Name/ID,Overall,Op,Comm,Trans,Rel,Dis,Loy,Eng,Img,Chan,Lvl";
        const row = level === 'org' ? "1. เจ้าของ,95.00,90.00,..." : "1.1 ตัวแทน,95.00,90.00,...";
        const blob = new Blob(["\uFEFF"+headers+"\n"+row], {type:'text/csv;charset=utf-8'});
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `survey_template_${level}.csv`; link.click();
    };

    const handleFileUpload = (e, level) => {
        const file = e.target.files[0];
        if(!file) return;
        setImportLevel(level);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const lines = evt.target.result.split('\n');
            const data = [];
            for(let i=1; i<lines.length; i++) {
                const line = lines[i].trim();
                if(!line) continue;
                const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g,'').trim());
                // Basic ID Extraction
                const idMatch = cols[0].match(/^(\d+(\.\d+)?|TOTAL_ORG)/);
                if(idMatch && cols.length >= 11) {
                     const id = idMatch[0];
                     // Simple check: org (integer or single digit ID usually) vs dept (decimal ID)
                     // Here we just accept valid rows, but could filter based on 'level' prop if IDs follow strict pattern
                     const proc = (v) => { const n = parseFloat(v); return isNaN(n)?0 : (n<=1 && n!==0 ? parseFloat((n*100).toFixed(2)) : parseFloat(n.toFixed(2))); };
                     data.push({ 
                         stakeholderId: id, name: cols[0], 
                         scores: { overall: proc(cols[1]), operational: proc(cols[2]), communication: proc(cols[3]), transparency: proc(cols[4]), relationship: proc(cols[5]), dissatisfaction: proc(cols[6]), loyalty: proc(cols[7]), engagement: proc(cols[8]), image: proc(cols[9]), channel: proc(cols[10]), levelsMethods: proc(cols[11]) } 
                     });
                }
            }
            setTempImportData(data);
            if(data.length > 0) setImportStatus('ready'); else alert('ไม่พบข้อมูลที่ถูกต้อง');
        };
        reader.readAsText(file);
    };

    const confirmImport = async () => {
         if (!tempImportData.length) return;
         if (!window.confirm(`ยืนยันการนำเข้า ${tempImportData.length} รายการ?`)) return;
         
         for (const item of tempImportData) {
             await handleUpdate('surveyResults', item.stakeholderId, { stakeholderId: item.stakeholderId, scores: item.scores, updatedAt: new Date().toLocaleDateString('th-TH') });
         }
         alert('นำเข้าข้อมูลสำเร็จ');
         setImportStatus('idle'); setTempImportData([]);
    };

    const DashboardView = () => {
        const list = filterType === 'org' ? stakeholderGroups : stakeholders;
        return (
            <div className="space-y-6 animate-in fade-in">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-700">ภาพรวมผลการดำเนินงาน</h3>
                    <div className="flex bg-gray-100 p-1 rounded">
                        <button onClick={()=>setFilterType('org')} className={`px-4 py-1 rounded text-sm ${filterType==='org'?'bg-white shadow text-orange-600':'text-gray-500'}`}>ระดับองค์กร</button>
                        <button onClick={()=>setFilterType('dept')} className={`px-4 py-1 rounded text-sm ${filterType==='dept'?'bg-white shadow text-orange-600':'text-gray-500'}`}>ระดับฝ่ายงาน</button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {['overall', 'image', 'loyalty'].map(k => {
                         const relevantIds = list.map(i => i.id);
                         const relevantResults = surveyResults.filter(r => relevantIds.includes(r.stakeholderId));
                         const avgScore = relevantResults.length ? relevantResults.reduce((a,b) => a + (b.scores[k]||0), 0) / relevantResults.length : 0;
                         return <ScoreComparisonCard key={k} title={THAI_LABELS[k]} score={avgScore} target={globalTargets[k]} />;
                     })}
                 </div>
                 <Card>
                     <h4 className="font-bold mb-4">สถานะคะแนนราย{filterType==='org'?'กลุ่ม':'ตัวแทน'}</h4>
                     <div className="overflow-x-auto h-96">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b sticky top-0"><tr><th className="p-3">ID</th><th className="p-3">ชื่อ</th><th className="p-3 text-right">ภาพรวม (KPI: {globalTargets.overall})</th><th className="p-3 text-center">สถานะ</th></tr></thead>
                            <tbody className="divide-y">{list.map(item => {
                                    const res = surveyResults.find(r => r.stakeholderId === String(item.id));
                                    const score = res?.scores?.overall || 0;
                                    const isPass = score >= globalTargets.overall;
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={()=>{ handleSelectionChange(item.id); setSubTab('input'); }}>
                                            <td className="p-3 font-medium">{item.id}</td><td className="p-3">{item.name}</td>
                                            <td className={`p-3 text-right font-bold ${isPass ? 'text-green-600' : 'text-red-500'}`}>{score.toFixed(2)}%</td>
                                            <td className="p-3 text-center">{res ? (isPass ? <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded text-xs">ผ่าน</span> : <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded text-xs">ต่ำกว่าเกณฑ์</span>) : <span className="text-gray-400">-</span>}</td>
                                        </tr>
                                    );
                            })}</tbody>
                        </table>
                     </div>
                 </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">จัดการผลสำรวจ (Survey Admin)</h2>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button onClick={()=>setSubTab('dashboard')} className={`px-4 py-2 text-sm rounded flex items-center gap-2 ${subTab==='dashboard'?'bg-white shadow text-blue-600':'text-gray-500'}`}><BarChart2 size={16}/> Dashboard</button>
                    <button onClick={()=>setSubTab('kpi')} className={`px-4 py-2 text-sm rounded flex items-center gap-2 ${subTab==='kpi'?'bg-white shadow text-blue-600':'text-gray-500'}`}><Target size={16}/> กำหนดค่าเป้าหมาย</button>
                    <button onClick={()=>setSubTab('input')} className={`px-4 py-2 text-sm rounded flex items-center gap-2 ${subTab==='input'?'bg-white shadow text-blue-600':'text-gray-500'}`}><Edit3 size={16}/> บันทึกผลสำรวจ</button>
                    <button onClick={()=>setSubTab('import')} className={`px-4 py-2 text-sm rounded flex items-center gap-2 ${subTab==='import'?'bg-white shadow text-blue-600':'text-gray-500'}`}><FileSpreadsheet size={16}/> นำเข้าไฟล์</button>
                </div>
            </div>

            {subTab === 'dashboard' && <DashboardView />}

            {subTab === 'kpi' && (
                <Card>
                    <h3 className="font-bold mb-6 flex items-center gap-2"><Target className="text-orange-500"/> กำหนดค่าเป้าหมาย (KPI Targets)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(tempTargets).map(([k,v]) => (
                            <InputTarget key={k} label={THAI_LABELS[k] || k} value={v} onChange={val => handleTargetChange(k, val)} />
                        ))}
                    </div>
                    <div className="mt-6 text-right">
                        <button onClick={handleSaveTargets} disabled={isSaving} className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 font-bold disabled:opacity-50">
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึกเป้าหมาย'}
                        </button>
                    </div>
                </Card>
            )}

            {subTab === 'input' && (
                <Card>
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700">เลือกกลุ่ม หรือ ตัวแทน เพื่อบันทึกคะแนน</label>
                        <select className="w-full p-2 border rounded outline-none focus:border-blue-500" value={selectedId} onChange={e=>handleSelectionChange(e.target.value)}>
                            <option value="">-- กรุณาเลือก --</option>
                            <optgroup label="ระดับองค์กร (Groups)">{stakeholderGroups.map(g => <option key={g.id} value={g.id}>{g.id} {g.name}</option>)}</optgroup>
                            <optgroup label="ระดับฝ่ายงาน (Representatives)">{stakeholders.map(s => <option key={s.id} value={s.id}>{s.id} {s.name}</option>)}</optgroup>
                        </select>
                    </div>

                    {selectedId && (
                        <div className="animate-in fade-in">
                            <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 text-blue-800 rounded">
                                <FileText size={18}/> 
                                <span className="font-bold">กำลังบันทึกข้อมูลสำหรับ: {stakeholderGroups.find(g=>String(g.id)===selectedId)?.name || stakeholders.find(s=>String(s.id)===selectedId)?.name || selectedId}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-700 border-b pb-2">ผลการดำเนินงานหลัก</h4>
                                    {['overall','operational','communication','transparency','relationship'].map(k=><InputScoreWithTarget key={k} label={THAI_LABELS[k]} actual={formScores[k]} target={globalTargets[k]} onChange={v=>handleScoreChange(k, v)}/>)}
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-700 border-b pb-2">ผลลัพธ์อื่นๆ</h4>
                                    {['dissatisfaction','loyalty','engagement','image','channel','levelsMethods'].map(k=><InputScoreWithTarget key={k} label={THAI_LABELS[k]} actual={formScores[k]} target={globalTargets[k]} inverse={k==='dissatisfaction'} onChange={v=>handleScoreChange(k, v)}/>)}
                                </div>
                            </div>
                            <div className="mt-8 pt-4 border-t text-right">
                                <button onClick={handleSaveScores} disabled={isSaving} className="bg-green-600 text-white px-8 py-2.5 rounded font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 ml-auto disabled:opacity-50">
                                    <Save size={18}/> {isSaving ? 'กำลังบันทึก...' : 'บันทึกผลคะแนน'}
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
            
            {subTab === 'import' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-orange-200 bg-orange-50">
                        <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><Layers size={18}/> นำเข้า: ระดับกลุ่ม (Organization)</h4>
                        <p className="text-xs text-orange-600 mb-4">สำหรับนำเข้าคะแนนผลสำรวจของกลุ่มผู้มีส่วนได้ส่วนเสีย (เช่น 1. เจ้าของ, 2. หน่วยงานกำกับดูแล)</p>
                        <div className="flex flex-col gap-2">
                             <button onClick={()=>downloadTemplate('org')} className="text-xs text-blue-600 underline text-left mb-1">ดาวน์โหลด Template (กลุ่ม)</button>
                             <label className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded text-center hover:bg-orange-700 font-bold shadow-sm block">
                                 <Upload size={16} className="inline mr-2"/> เลือกไฟล์ CSV (กลุ่ม)
                                 <input type="file" accept=".csv" className="hidden" onChange={(e)=>handleFileUpload(e, 'org')} />
                             </label>
                        </div>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Users size={18}/> นำเข้า: ระดับตัวแทน (Representative)</h4>
                        <p className="text-xs text-blue-600 mb-4">สำหรับนำเข้าคะแนนผลสำรวจของตัวแทนรายย่อย (เช่น 1.1 สคร., 8.3 บริษัทติดตามหนี้)</p>
                        <div className="flex flex-col gap-2">
                             <button onClick={()=>downloadTemplate('dept')} className="text-xs text-blue-600 underline text-left mb-1">ดาวน์โหลด Template (ตัวแทน)</button>
                             <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700 font-bold shadow-sm block">
                                 <Upload size={16} className="inline mr-2"/> เลือกไฟล์ CSV (ตัวแทน)
                                 <input type="file" accept=".csv" className="hidden" onChange={(e)=>handleFileUpload(e, 'dept')} />
                             </label>
                        </div>
                    </Card>
                    
                    {importStatus === 'ready' && (
                        <div className="md:col-span-2 mt-4 animate-in fade-in">
                            <Card className="border-yellow-200 bg-yellow-50">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-yellow-800">ตรวจสอบข้อมูลนำเข้า ({tempImportData.length} รายการ)</h4>
                                    <span className="text-xs font-bold px-2 py-1 bg-white rounded border">{importLevel === 'org' ? 'ระดับกลุ่ม' : 'ระดับตัวแทน'}</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto border rounded bg-white"><table className="w-full text-xs text-left"><thead className="bg-gray-100 sticky top-0"><tr><th className="p-2">Name</th><th className="p-2">Overall</th><th className="p-2">Op</th></tr></thead><tbody>{tempImportData.map((d,i)=><tr key={i} className="border-t"><td className="p-2">{d.name}</td><td className="p-2">{d.scores.overall}%</td><td className="p-2">{d.scores.operational}%</td></tr>)}</tbody></table></div>
                                <div className="flex gap-2 justify-end mt-4">
                                    <button onClick={()=>{setImportStatus('idle'); setTempImportData([])}} className="px-4 py-2 bg-gray-200 rounded">ยกเลิก</button>
                                    <button onClick={confirmImport} className="px-4 py-2 bg-green-600 text-white rounded font-bold">ยืนยันการนำเข้า</button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UserDashboardView = ({ userStats, currentDept }) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">สวัสดี, {currentDept?.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-orange-500 text-white"><div className="flex justify-between"><div><p className="text-orange-100 text-sm">ความคืบหน้า</p><h3 className="text-4xl font-bold mt-1">{userStats.percent}%</h3></div><TrendingUp size={24}/></div></Card>
          <Card><div><p className="text-gray-500 text-sm">กิจกรรมแล้วเสร็จ</p><h3 className="text-2xl font-bold">{userStats.completed} / {userStats.totalActs}</h3></div></Card>
          <Card><div><p className="text-gray-500 text-sm">รอรายงานผล</p><h3 className="text-2xl font-bold">{userStats.pending}</h3></div></Card>
      </div>
    </div>
);

// --- Main App ---
export default function App() {
  const [role, setRole] = useState('admin'); 
  const [activeTab, setActiveTab] = useState('master');
  const [isOfflineMode, setIsOfflineMode] = useState(false); 
  const [currentDept, setCurrentDept] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [stakeholderGroups, setStakeholderGroups] = useState([]);
  const [stakeholders, setStakeholders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [surveyResults, setSurveyResults] = useState([]);
  const [globalTargets, setGlobalTargets] = useState(INITIAL_GLOBAL_TARGETS);

  const db = isOfflineMode ? null : realDb;

  useEffect(() => {
    if (departments.length > 0 && !currentDept) setCurrentDept(departments[0]);
  }, [departments]);

  useEffect(() => {
    if (!db) return;
    const unsubDepts = onSnapshot(collection(db, 'departments'), (snap) => setDepartments(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubGroups = onSnapshot(collection(db, 'stakeholderGroups'), (snap) => setStakeholderGroups(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubStakeholders = onSnapshot(collection(db, 'stakeholders'), (snap) => setStakeholders(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubPlans = onSnapshot(collection(db, 'plans'), (snap) => setPlans(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubSurvey = onSnapshot(collection(db, 'surveyResults'), (snap) => setSurveyResults(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snap) => {
        const targets = snap.docs.find(d => d.id === 'globalTargets');
        if(targets) setGlobalTargets(targets.data());
    });
    return () => { unsubDepts(); unsubGroups(); unsubStakeholders(); unsubUsers(); unsubPlans(); unsubSurvey(); unsubSettings(); };
  }, [db]);

  const handleCreate = async (coll, data, customId = null) => {
      try {
          if (db) {
              if (customId) await setDoc(doc(db, coll, customId), data);
              else await addDoc(collection(db, coll), data);
          } else {
              const newItem = { ...data, id: customId || Date.now().toString() };
              if(coll==='departments') setDepartments(p=>[...p,newItem]);
              else if(coll==='stakeholderGroups') setStakeholderGroups(p=>[...p,newItem]);
              else if(coll==='stakeholders') setStakeholders(p=>[...p,newItem]);
              else if(coll==='users') setUsers(p=>[...p,newItem]);
              else if(coll==='plans') setPlans(p=>[...p,newItem]);
          }
          return true;
      } catch (e) { alert(e.message); return false; }
  };

  const handleUpdate = async (coll, id, data) => {
      try {
          if (db) await setDoc(doc(db, coll, id), data, { merge: true });
          else {
              const update = list => list.map(item => String(item.id) === String(id) ? { ...item, ...data } : item);
              if(coll==='departments') setDepartments(prev => update(prev));
              else if(coll==='stakeholderGroups') setStakeholderGroups(prev => update(prev));
              else if(coll==='stakeholders') setStakeholders(prev => update(prev));
              else if(coll==='surveyResults') {
                 setSurveyResults(prev => {
                     const idx = prev.findIndex(r => r.stakeholderId === data.stakeholderId);
                     return idx >= 0 ? prev.map((r, i) => i === idx ? { ...r, ...data } : r) : [...prev, { ...data, id: id || Date.now().toString() }];
                 });
              }
              else if(coll==='settings' && id==='globalTargets') {
                  setGlobalTargets({...globalTargets, ...data});
              }
          }
          return true;
      } catch (e) { alert(e.message); return false; }
  };

  const handleDelete = async (coll, id) => {
      if(!window.confirm("ยืนยันการลบข้อมูล?")) return;
      try {
          if (db) await deleteDoc(doc(db, coll, String(id)));
          else {
              const filter = list => list.filter(item => String(item.id) !== String(id));
              if(coll==='departments') setDepartments(prev => filter(prev));
              else if(coll==='stakeholderGroups') setStakeholderGroups(prev => filter(prev));
              else if(coll==='stakeholders') setStakeholders(prev => filter(prev));
              else if(coll==='users') setUsers(prev => filter(prev));
              else if(coll==='plans') setPlans(prev => filter(prev));
          }
      } catch (e) { alert(e.message); }
  };

  const saveToDB = handleUpdate; // Correct alias for settings

  const seedDatabase = async () => {
      if (!db) {
        if(!window.confirm("โหลดข้อมูลจำลอง (Offline)?")) return;
        setDepartments(SEED_DEPARTMENTS.map((d,i)=>({...d, id: String(i+1)})));
        setStakeholderGroups(SEED_GROUPS);
        setStakeholders(SEED_STAKEHOLDERS);
        return;
      }
      if (!window.confirm("ยืนยันบันทึกลง Firebase?")) return;
      const batch = writeBatch(db);
      SEED_DEPARTMENTS.forEach(d => { const ref = doc(collection(db, 'departments')); batch.set(ref, d); });
      SEED_GROUPS.forEach(g => { const ref = doc(db, 'stakeholderGroups', g.id); batch.set(ref, g); }); 
      SEED_STAKEHOLDERS.forEach(s => { const ref = doc(db, 'stakeholders', s.id); batch.set(ref, s); });
      await batch.commit();
      alert("ติดตั้งข้อมูลสำเร็จ");
  };

  const userStats = useMemo(() => {
    if (!currentDept) return { totalActs: 0, completed: 0, pending: 0, percent: 0 };
    const myPlans = plans.filter(p => String(p.deptId) === String(currentDept.id));
    let totalActs = 0, completed = 0;
    myPlans.forEach(p => p.activities?.forEach(a => { totalActs++; if (a.status === 'Completed') completed++; }));
    const percent = totalActs === 0 ? 0 : Math.round((completed / totalActs) * 100);
    return { totalActs, completed, pending: totalActs - completed, percent };
  }, [plans, currentDept]);

  const renderContent = () => {
    if(role === 'admin') {
        if(activeTab === 'survey_input') return <AdminSurveyInput surveyResults={surveyResults} stakeholders={stakeholders} stakeholderGroups={stakeholderGroups} handleUpdate={handleUpdate} globalTargets={globalTargets} setGlobalTargets={setGlobalTargets} saveToDB={handleUpdate} />;
        if(activeTab === 'users') return <UserManagementView users={users} departments={departments} handleCreate={handleCreate} handleDelete={handleDelete} />;
        return <MasterDataView db={db} departments={departments} stakeholderGroups={stakeholderGroups} stakeholders={stakeholders} handleCreate={handleCreate} handleUpdate={handleUpdate} handleDelete={handleDelete} seedDatabase={seedDatabase} />;
    } else if (role === 'user') {
        if(activeTab === 'dashboard') return <UserDashboardView userStats={userStats} currentDept={currentDept} />;
        if(activeTab === 'planning') return <UserPlanningView plans={plans} stakeholders={stakeholders} currentDept={currentDept} handleCreate={handleCreate} handleDelete={handleDelete} />;
        return <div className="p-10 text-center text-gray-400">Dashboard (User)</div>;
    } else {
        return <div className="p-10 text-center text-gray-400">Executive Dashboard</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      <Sidebar role={role} setRole={setRole} activeTab={activeTab} setActiveTab={setActiveTab} currentDept={currentDept} setCurrentDept={setCurrentDept} departments={departments} isOfflineMode={isOfflineMode} setIsOfflineMode={setIsOfflineMode} />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8"><div className="flex items-center gap-2"><span className="font-bold text-gray-400">SRMS</span><ChevronRight size={16} className="text-gray-300"/><span className="text-orange-600 font-bold capitalize">{activeTab.replace('_',' ')}</span></div><div className="text-right"><p className="font-bold text-sm">{new Date().toLocaleDateString('th-TH')}</p><p className="text-xs text-gray-500">ปีงบประมาณ 2568</p></div></header>
        {renderContent()}
      </main>
    </div>
  );
}
