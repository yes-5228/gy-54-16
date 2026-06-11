import { Eye, EyeOff, FolderOpen, Plus, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import GradeTable from "../components/GradeTable";
import Notice from "../components/Notice";

const initialForm = {
  studentNo: "",
  studentName: "",
  major: "",
  className: "",
  courseCode: "",
  courseName: "",
  credit: 3,
  score: 85,
  semester: "2025-2026-2",
  teacher: "",
};

export default function TeacherPage() {
  const [form, setForm] = useState(initialForm);
  const [grades, setGrades] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState({ name: "", semester: "2025-2026-2", teacher: "" });

  const loadData = async () => {
    const [allGrades, allBatches] = await Promise.all([api.listGrades(), api.listBatches()]);
    setGrades(allGrades);
    setBatches(allBatches);
  };

  useEffect(() => {
    loadData().catch((error) => setNotice({ type: "error", message: error.message }));
  }, []);

  const activeBatch = batches.find((b) => b.id === activeBatchId) || null;
  const displayedGrades = activeBatchId
    ? grades.filter((g) => g.batchId === activeBatchId)
    : grades;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (activeBatchId) {
        payload.batchId = activeBatchId;
      }
      await api.createGrade(payload);
      setNotice({ type: "success", message: activeBatchId ? "成绩已暂存到批次" : "成绩已录入" });
      setForm({ ...initialForm, teacher: form.teacher, semester: form.semester });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const changeScore = async (gradeId, score) => {
    setGrades((items) => items.map((item) => (item.id === gradeId ? { ...item, score: Number(score) } : item)));
    try {
      const updated = await api.updateGrade(gradeId, { score });
      setGrades((items) => items.map((item) => (item.id === gradeId ? updated : item)));
    } catch (error) {
      setNotice({ type: "error", message: error.message });
      await loadData();
    }
  };

  const createBatch = async (event) => {
    event.preventDefault();
    try {
      const newBatch = await api.createBatch(batchForm);
      setNotice({ type: "success", message: "批次已创建" });
      setBatchForm({ name: "", semester: "2025-2026-2", teacher: "" });
      setShowBatchForm(false);
      await loadData();
      setActiveBatchId(newBatch.id);
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  const handlePublish = async (batchId) => {
    try {
      await api.publishBatch(batchId);
      setNotice({ type: "success", message: "批次已发布，学生可查看成绩" });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  const handleUnpublish = async (batchId) => {
    try {
      await api.unpublishBatch(batchId);
      setNotice({ type: "info", message: "批次已撤回发布，学生无法查看" });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  const handleDeleteBatch = async (batchId) => {
    try {
      await api.deleteBatch(batchId);
      if (activeBatchId === batchId) setActiveBatchId(null);
      setNotice({ type: "success", message: "批次已删除" });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>教师成绩录入</h1>
          <p>创建批次暂存成绩，确认无误后统一发布给学生查看。</p>
        </div>
      </header>

      <Notice notice={notice} />

      <div className="batch-section">
        <div className="panel-head">
          <h2>成绩发布批次</h2>
          <button className="btn-sm" onClick={() => setShowBatchForm(!showBatchForm)} type="button">
            <Plus size={16} />
            新建批次
          </button>
        </div>

        {showBatchForm && (
          <form className="batch-form panel" onSubmit={createBatch}>
            <label>
              批次名称
              <input value={batchForm.name} onChange={(e) => setBatchForm((f) => ({ ...f, name: e.target.value }))} required placeholder="如：2025-2026学年第二学期期末" />
            </label>
            <label>
              学期
              <input value={batchForm.semester} onChange={(e) => setBatchForm((f) => ({ ...f, semester: e.target.value }))} required />
            </label>
            <label>
              任课教师
              <input value={batchForm.teacher} onChange={(e) => setBatchForm((f) => ({ ...f, teacher: e.target.value }))} required />
            </label>
            <button className="primary-action" type="submit">
              <FolderOpen size={18} />
              创建批次
            </button>
          </form>
        )}

        <div className="batch-list">
          <button
            className={`batch-card ${!activeBatchId ? "active" : ""}`}
            onClick={() => setActiveBatchId(null)}
            type="button"
          >
            <div className="batch-card-info">
              <strong>全部成绩</strong>
              <span>{grades.length} 条记录</span>
            </div>
          </button>
          {batches.map((batch) => (
            <div
              key={batch.id}
              className={`batch-card ${activeBatchId === batch.id ? "active" : ""}`}
            >
              <button className="batch-card-info" onClick={() => setActiveBatchId(batch.id)} type="button">
                <strong>{batch.name}</strong>
                <span>
                  <span className={`status ${batch.status}`}>{batch.status === "draft" ? "草稿" : "已发布"}</span>
                  {batch.gradeCount} 条成绩
                </span>
              </button>
              <div className="batch-card-actions">
                {batch.status === "draft" && (
                  <button className="btn-icon" disabled={batch.gradeCount === 0} onClick={() => handlePublish(batch.id)} title="发布批次" type="button">
                    <Send size={16} />
                  </button>
                )}
                {batch.status === "published" && (
                  <button className="btn-icon" onClick={() => handleUnpublish(batch.id)} title="撤回发布" type="button">
                    <EyeOff size={16} />
                  </button>
                )}
                {batch.status === "draft" && (
                  <button className="btn-icon danger" onClick={() => handleDeleteBatch(batch.id)} title="删除批次" type="button">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!batches.length && <div className="empty">暂无批次，请新建一个批次开始录入成绩</div>}
        </div>
      </div>

      <div className="split-grid">
        <form className="panel form-grid" onSubmit={submit}>
          {activeBatch && activeBatch.status === "published" && (
            <div className="notice info" style={{ gridColumn: "1 / -1" }}>
              该批次已发布，新增成绩将自动标记为已发布。
            </div>
          )}
          <label>
            学号
            <input value={form.studentNo} onChange={(event) => updateField("studentNo", event.target.value)} required />
          </label>
          <label>
            姓名
            <input value={form.studentName} onChange={(event) => updateField("studentName", event.target.value)} required />
          </label>
          <label>
            专业
            <input value={form.major} onChange={(event) => updateField("major", event.target.value)} />
          </label>
          <label>
            班级
            <input value={form.className} onChange={(event) => updateField("className", event.target.value)} />
          </label>
          <label>
            课程代码
            <input value={form.courseCode} onChange={(event) => updateField("courseCode", event.target.value)} required />
          </label>
          <label>
            课程名称
            <input value={form.courseName} onChange={(event) => updateField("courseName", event.target.value)} required />
          </label>
          <label>
            学分
            <input min="0.5" step="0.5" type="number" value={form.credit} onChange={(event) => updateField("credit", event.target.value)} required />
          </label>
          <label>
            成绩
            <input min="0" max="100" type="number" value={form.score} onChange={(event) => updateField("score", event.target.value)} required />
          </label>
          <label>
            学期
            <input value={form.semester} onChange={(event) => updateField("semester", event.target.value)} required />
          </label>
          <label>
            任课教师
            <input value={form.teacher} onChange={(event) => updateField("teacher", event.target.value)} required />
          </label>
          <button className="primary-action" disabled={saving} type="submit">
            <Save size={18} />
            {saving ? "保存中" : activeBatchId ? "暂存到批次" : "保存成绩"}
          </button>
        </form>

        <div className="panel">
          <div className="panel-head">
            <h2>{activeBatch ? `${activeBatch.name} - 成绩列表` : "最近成绩"}</h2>
            {activeBatch && activeBatch.status === "draft" && activeBatch.gradeCount > 0 && (
              <button className="btn-publish" onClick={() => handlePublish(activeBatch.id)} type="button">
                <Eye size={18} />
                发布给学生
              </button>
            )}
          </div>
          <GradeTable grades={displayedGrades} onScoreChange={changeScore} showPublished />
        </div>
      </div>
    </section>
  );
}
