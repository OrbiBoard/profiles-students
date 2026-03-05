const path = require('path');
const url = require('url');

let pluginApi = null;

function fileUrl(p) { return url.pathToFileURL(p).href; }

function emitUpdate(channel, target, value) {
  try { pluginApi.emit(channel, { type: 'update', target, value }); } catch (e) {}
}

const EVENT_CHANNEL = 'profiles-students-channel';

const functions = {
  openStudents: async () => {
    const bg = fileUrl(path.join(__dirname, 'index.html')) + `?channel=${encodeURIComponent(EVENT_CHANNEL)}&caller=${encodeURIComponent('profiles-students')}`;
  const params = {
      title: '档案-学生列表',
      eventChannel: EVENT_CHANNEL,
      subscribeTopics: [EVENT_CHANNEL],
      callerPluginId: 'profiles-students',
      backgroundUrl: bg,
      floatingUrl: null,
      leftItems: [
        { id: 'add', text: '新增学生', icon: 'ri-user-add-line' },
        { id: 'shuffle', text: '打乱顺序', icon: 'ri-shuffle-line' },
        { id: 'save', text: '保存', icon: 'ri-save-3-line' },
        { id: 'importText', text: '文本导入', icon: 'ri-file-text-line' }
      ],
      centerItems: []
    };
    await pluginApi.call('ui-lowbar', 'openTemplate', [params]);
    return true;
  },
  onLowbarEvent: async (payload = {}) => {
    try {
      if (payload?.type === 'left.click') {
        if (payload.id === 'add') {
          const list = Array.isArray(pluginApi.store.get('students')) ? pluginApi.store.get('students') : [];
          list.push({ required: true, name: '', gender: '未选择' });
          pluginApi.store.set('students', list);
          emitUpdate(EVENT_CHANNEL, 'refresh', true);
        } else if (payload.id === 'shuffle') {
          emitUpdate(EVENT_CHANNEL, 'students.shuffle', true);
        } else if (payload.id === 'save') {
          emitUpdate(EVENT_CHANNEL, 'students.save', true);
        } else if (payload.id === 'importText') {
          emitUpdate(EVENT_CHANNEL, 'floatingBounds', 'center');
          emitUpdate(EVENT_CHANNEL, 'floatingBounds', { width: 620, height: 420 });
          const floatUrl = fileUrl(path.join(__dirname, 'floating.html')) + `?channel=${encodeURIComponent(EVENT_CHANNEL)}&caller=${encodeURIComponent('profiles-students')}`;
          emitUpdate(EVENT_CHANNEL, 'floatingUrl', floatUrl);
        }
      }
      return true;
    } catch (e) {
      return { ok: false, error: e?.message || String(e) };
    }
  },
  getColumns: async () => {
    try {
      const defsRes = pluginApi.getStudentColumnDefs();
      const extra = Array.isArray(defsRes?.columns) ? defsRes.columns : [];
      return { ok: true, columns: extra };
    } catch (e) { return { ok: false, error: e?.message || String(e) }; }
  },
  getStudents: async () => {
    try {
      let arr = pluginApi.store.get('students');
      if (!Array.isArray(arr)) { arr = []; pluginApi.store.set('students', arr); }
      return { ok: true, students: arr };
    } catch (e) { return { ok: false, students: [], error: e?.message || String(e) }; }
  },
  saveStudents: async (payload) => {
    try {
      if (!Array.isArray(payload?.students)) {
        return { ok: false, error: 'invalid_students' };
      }
      pluginApi.store.set('students', payload.students);
      try { emitUpdate(EVENT_CHANNEL, 'refresh', true); } catch (e) {}
      return { ok: true };
    } catch (e) { return { ok: false, error: e?.message || String(e) }; }
  }
};

const init = async (api) => {
  pluginApi = api;
  api.splash.setStatus('plugin:init', '初始化 档案-学生列表');
  api.splash.progress('plugin:init', '档案-学生列表就绪');
};

module.exports = {
  name: 'profiles-students',
  version: '1.0.0',
  description: '档案-学生列表（底栏模板）',
  init,
  functions: {
    ...functions,
    getVariable: async (name) => { const k=String(name||''); if (k==='timeISO') return new Date().toISOString(); if (k==='pluginName') return '档案-学生列表'; return ''; },
    listVariables: () => ['timeISO','pluginName']
  }
};
