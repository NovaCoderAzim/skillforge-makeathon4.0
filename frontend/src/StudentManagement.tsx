import React, { useState, useEffect } from "react";
import { Search, Plus, UploadCloud, ChevronDown, ChevronUp, Save, Edit, X, Eye, EyeOff, Shield, BookOpen, Calendar, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface CourseEnrollment {
  id: number;
  title: string;
  tier: "Free" | "Paid";
  days_left?: number;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  joined_at: string;
  status: "Active" | "Suspended";
  temp_password?: string;
  school_class?: string;
  section?: string;
  enrolled_courses: CourseEnrollment[];
}

interface SchoolClass {
  id: number;
  name: string;
  academic_year: string;
}

const StudentManagement = () => {
  const [activeTab, setActiveTab] = useState("Directory");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [newStudent, setNewStudent] = useState({ name: "", email: "", tempPass: "", school_class_id: "none", section: "" });
  const [bulkConfig, setBulkConfig] = useState({ school_class_id: "none", section: "" });
  const [csvContent, setCsvContent] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [resStudents, resClasses] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/v1/admin/students", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://127.0.0.1:8000/api/v1/admin/classes", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStudents(resStudents.data);
      setClasses(resClasses.data);
    } catch (err) {
      console.error("Failed to load CRM data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://127.0.0.1:8000/api/v1/admin/admit-student", {
        full_name: newStudent.name,
        email: newStudent.email,
        password: newStudent.tempPass || null,
        school_class_id: newStudent.school_class_id !== "none" ? parseInt(newStudent.school_class_id) : null,
        section: newStudent.section,
        course_ids: []
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert(`Account created for ${newStudent.name}.`);
      setNewStudent({ name: "", email: "", tempPass: "", school_class_id: "none", section: "" });
      fetchData();
    } catch (err) {
      alert("Failed to create student profile.");
    }
  };

  const processBulk = async () => {
    if (!csvContent.trim()) return;
    setBulkLoading(true);
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
    
    let successCount = 0;
    const token = localStorage.getItem("token");

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) continue;
      const [name, email, pass] = parts;
      try {
        await axios.post("http://127.0.0.1:8000/api/v1/admin/admit-student", {
          full_name: name,
          email: email,
          password: pass || null,
          school_class_id: bulkConfig.school_class_id !== "none" ? parseInt(bulkConfig.school_class_id) : null,
          section: bulkConfig.section,
          course_ids: [] 
        }, { headers: { Authorization: `Bearer ${token}` } });
        successCount++;
      } catch (e) { console.error(`Failed to admit ${email}`); }
    }

    setBulkLoading(false);
    setCsvContent("");
    alert(`Successfully processed ${successCount} out of ${lines.length} entries.`);
    fetchData();
  };

  const toggleSuspend = async (s: Student) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = s.status === "Active" ? "Suspended" : "Active";
      await axios.patch(`http://127.0.0.1:8000/api/v1/admin/students/${s.id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(students.map(st => st.id === s.id ? { ...st, status: newStatus } : st));
    } catch (err) {}
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 font-sans w-full mx-auto animation-fadeIn">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Student CRM</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Manage student profiles & enrollment.</p>
        </div>

        <nav className="flex flex-col gap-2">
          {["Directory", "Single Onboarding", "Bulk Import"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all text-sm border ${
                activeTab === tab 
                  ? "bg-[#1e293b] text-white border-[#1e293b] shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {tab === "Directory" ? <BookOpen size={18} /> : tab === "Single Onboarding" ? <Plus size={18} /> : <UploadCloud size={18} />}
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading CRM data...</div>
        ) : (
          <>
            {/* DIRECTORY TAB */}
            {activeTab === "Directory" && (
              <div className="animate-in fade-in duration-300 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[60vh]">
                <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#1e293b] focus:ring-1 focus:ring-[#1e293b] transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                  {filteredStudents.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No students matched your search.</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-4 font-semibold text-slate-600 text-sm">Student</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm">Class / Section</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                          <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(s => (
                          <React.Fragment key={s.id}>
                            <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${expandedRow === s.id ? "bg-slate-50" : ""}`}>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0 text-sm">
                                    {s.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800 text-sm">{s.full_name}</p>
                                    <p className="text-xs text-slate-500">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                {s.school_class ? (
                                  <div>
                                    <p className="text-sm text-slate-800 font-medium">{s.school_class}</p>
                                    <p className="text-xs text-slate-500">Sec: {s.section || "N/A"}</p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-sm">Unassigned</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${s.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                  {expandedRow === s.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded Details Row */}
                            <AnimatePresence>
                              {expandedRow === s.id && (
                                <tr className="bg-slate-50 border-b border-slate-200 shadow-inner">
                                  <td colSpan={4} className="p-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Security</p>
                                          <div className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center mb-4 shadow-sm">
                                            <div>
                                              <p className="text-sm font-semibold text-slate-800">Initial Password</p>
                                              <p className="text-xs text-slate-500 font-mono mt-1">{s.temp_password || "None provided"}</p>
                                            </div>
                                            <button 
                                              onClick={() => toggleSuspend(s)}
                                              className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${s.status === 'Active' ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100' : 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'}`}
                                            >
                                              {s.status === "Active" ? "Suspend Account" : "Reactivate"}
                                            </button>
                                          </div>
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Enrollments</p>
                                          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm min-h-[70px]">
                                            {s.enrolled_courses?.length === 0 ? (
                                              <p className="text-sm text-slate-400">No active course enrollments.</p>
                                            ) : (
                                              <ul className="text-sm text-slate-700 space-y-1">
                                                {s.enrolled_courses?.map((c, i) => <li key={i} className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> {c.title}</li>)}
                                              </ul>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* SINGLE ONBOARDING TAB */}
            {activeTab === "Single Onboarding" && (
              <div className="animate-in fade-in duration-300 bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Manual Provisioning</h3>
                <p className="text-slate-500 mb-8 text-sm">Forcefully push a single student profile into the system.</p>

                <form onSubmit={handleAddStudent} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                      <input required value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e293b]" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                      <input required type="email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e293b]" placeholder="john@example.edu" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Provisioned Password</label>
                    <input type="text" value={newStudent.tempPass} onChange={e => setNewStudent({ ...newStudent, tempPass: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-[#1e293b]" placeholder="Leave blank to auto-generate" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">School Class</label>
                      <select value={newStudent.school_class_id} onChange={e => setNewStudent({ ...newStudent, school_class_id: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e293b]">
                        <option value="none">-- Select Class --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                      <input type="text" value={newStudent.section} onChange={e => setNewStudent({ ...newStudent, section: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e293b]" placeholder="A, B, etc." />
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button type="submit" className="w-full md:w-auto px-6 py-3 bg-[#1e293b] hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm">
                      Create Student
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* BULK IMPORT TAB */}
            {activeTab === "Bulk Import" && (
              <div className="animate-in fade-in duration-300 bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-3xl">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Bulk Import Generator</h3>
                <p className="text-slate-500 mb-8 text-sm">Paste CSV formatted data: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">Name, Email, Password(optional)</code></p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target School Class</label>
                    <select value={bulkConfig.school_class_id} onChange={e => setBulkConfig({ ...bulkConfig, school_class_id: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e293b]">
                      <option value="none">-- Unassigned --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target Section</label>
                    <input type="text" value={bulkConfig.section} onChange={e => setBulkConfig({ ...bulkConfig, section: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#1e293b]" placeholder="A, B, etc." />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
                  <textarea
                    rows={10}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full bg-transparent font-mono text-sm text-slate-800 outline-none resize-y"
                    placeholder={`Steve Jobs, steve@apple.com, macintosh1984\nSarah Conner, sarah@cyberdyne.net,\nDr. Emmett Brown, emmett@bttf.com, delorean88`}
                  ></textarea>
                </div>
                
                <button onClick={processBulk} disabled={bulkLoading || !csvContent} className="px-6 py-3 bg-[#1e293b] hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm">
                  {bulkLoading ? "Processing..." : "Run Bulk Import"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;