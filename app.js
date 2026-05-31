/* ============================================
   NEXUS — app.js — Full Feature Implementation
   ============================================ */

// ===== STATE =====
const state = {
  user: null,
  localStream: null,
  screenStream: null,
  mediaRecorder: null,
  recordedChunks: [],
  isRecording: false,
  isMuted: false,
  isCamOff: false,
  isScreenSharing: false,
  isWhiteboardOpen: false,
  isChatOpen: false,
  isParticipantsOpen: false,
  meetingStartTime: null,
  meetingTimer: null,
  roomCode: '',
  chatMessages: [],
  files: [
    { name: 'Q3_Report.pdf', type: 'pdf', size: '2.4 MB', icon: '📄', date: 'Today' },
    { name: 'Design_Mockups.png', type: 'image', size: '8.1 MB', icon: '🖼️', date: 'Today' },
    { name: 'Sprint_Plan.docx', type: 'doc', size: '340 KB', icon: '📝', date: 'Yesterday' },
    { name: 'Meeting_Notes.pdf', type: 'pdf', size: '120 KB', icon: '📄', date: 'Yesterday' },
    { name: 'Logo_Assets.png', type: 'image', size: '5.2 MB', icon: '🖼️', date: '2 days ago' },
    { name: 'Budget_2026.xlsx', type: 'doc', size: '890 KB', icon: '📊', date: '3 days ago' },
  ],
  contacts: [
    { name: 'Sarah Chen', role: 'Product Manager', initials: 'SC' },
    { name: 'Mike Rodriguez', role: 'Lead Developer', initials: 'MR' },
    { name: 'Emma Wilson', role: 'UI/UX Designer', initials: 'EW' },
    { name: 'James Kim', role: 'DevOps Engineer', initials: 'JK' },
    { name: 'Priya Sharma', role: 'Data Scientist', initials: 'PS' },
    { name: 'Tom Baker', role: 'Marketing Lead', initials: 'TB' },
  ],
  // Whiteboard
  wb: {
    tool: 'pen',
    color: '#00f5ff',
    size: 4,
    drawing: false,
    lastX: 0, lastY: 0,
    shapes: [],
  },
  // Simulated participants
  fakeParticipants: [
    { name: 'Sarah Chen', initials: 'SC' },
    { name: 'Mike Rodriguez', initials: 'MR' },
  ]
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateGreeting();
  setInterval(updateGreeting, 60000);
  renderFiles(state.files);
  renderContacts();
  setDefaultDateTime();
});

function updateGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  const el = document.getElementById('time-greeting');
  if (el) el.textContent = g;
}

function setDefaultDateTime() {
  const input = document.getElementById('sched-time');
  if (input) {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    input.value = d.toISOString().slice(0, 16);
  }
}

// ===== NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showAuth(type) {
  showPage('auth-page');
  switchTab(type);
}

function switchTab(type) {
  document.getElementById('tab-login').classList.toggle('active', type === 'login');
  document.getElementById('tab-signup').classList.toggle('active', type === 'signup');
  document.getElementById('name-group').style.display = type === 'signup' ? 'flex' : 'none';
  document.getElementById('auth-btn').textContent = type === 'signup' ? 'Create Account' : 'Sign In';
}

// ===== AUTH =====
function handleAuth(e, provider) {
  if (e) e.preventDefault();
  const name = document.getElementById('auth-name')?.value || 'Alex Johnson';
  const email = document.getElementById('auth-email')?.value || 'alex@nexus.io';

  state.user = {
    name: name || 'Alex Johnson',
    email: email,
    initials: (name || 'Alex Johnson').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2),
  };

  updateUserUI();
  showPage('dashboard-page');
  showDashTab('home');
  showToast('Welcome to NEXUS! 🚀');
}

function updateUserUI() {
  const u = state.user;
  if (!u) return;
  const greet = document.getElementById('user-greeting');
  if (greet) greet.textContent = `Welcome back, ${u.name.split(' ')[0]}`;
  const sname = document.getElementById('sidebar-name');
  if (sname) sname.textContent = u.name;
  const savatar = document.getElementById('sidebar-avatar');
  if (savatar) savatar.textContent = u.initials;
  const settAvatar = document.getElementById('settings-avatar');
  if (settAvatar) settAvatar.textContent = u.initials;
  const settNameDisp = document.getElementById('settings-name-display');
  if (settNameDisp) settNameDisp.textContent = u.name;
  const settName = document.getElementById('settings-name');
  if (settName) settName.value = u.name;
  const settEmail = document.getElementById('settings-email');
  if (settEmail) settEmail.value = u.email;
}

function logout() {
  state.user = null;
  showPage('landing-page');
  showToast('Signed out. See you soon!');
}

// ===== DASHBOARD TABS =====
function showDashTab(id) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  const navMap = { home: 0, meetings: 1, files: 2, contacts: 3, settings: 4 };
  const items = document.querySelectorAll('.nav-item');
  if (items[navMap[id]]) items[navMap[id]].classList.add('active');
  renderFiles(state.files);
  renderContacts();
}

// ===== FILES =====
function renderFiles(files, container) {
  const ids = container ? [container] : ['recent-files-list', 'all-files-list'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const count = id === 'recent-files-list' ? 4 : files.length;
    el.innerHTML = files.slice(0, count).map(f => `
      <div class="file-card" data-type="${f.type}">
        <div class="file-icon">${f.icon}</div>
        <div class="file-name">${f.name}</div>
        <div class="file-meta">${f.size} · ${f.date}</div>
      </div>
    `).join('');
  });
}

function handleFileUpload(event) {
  const newFiles = Array.from(event.target.files).map(f => ({
    name: f.name,
    type: f.type.includes('image') ? 'image' : f.type.includes('pdf') ? 'pdf' : 'doc',
    size: formatFileSize(f.size),
    icon: f.type.includes('image') ? '🖼️' : f.type.includes('pdf') ? '📄' : '📝',
    date: 'Just now',
  }));
  state.files = [...newFiles, ...state.files];
  renderFiles(state.files);
  showToast(`✅ ${newFiles.length} file(s) uploaded!`);
  event.target.value = '';
}

function formatFileSize(bytes) {
  if (bytes > 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

function filterFiles(query) {
  const filtered = state.files.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
  renderFiles(filtered);
}

function filterByType(type, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = type === 'all' ? state.files : state.files.filter(f => f.type === type);
  renderFiles(filtered);
}

// ===== CONTACTS =====
function renderContacts() {
  const el = document.getElementById('contacts-list');
  if (!el) return;
  el.innerHTML = state.contacts.map(c => `
    <div class="contact-card">
      <div class="contact-avatar">${c.initials}</div>
      <div class="contact-name">${c.name}</div>
      <div class="contact-role">${c.role}</div>
      <div class="contact-actions">
        <button class="contact-btn" onclick="startInstantMeeting()" title="Video Call">🎥</button>
        <button class="contact-btn" onclick="showToast('Message sent!')" title="Message">💬</button>
        <button class="contact-btn" onclick="showToast('Email opened!')" title="Email">📧</button>
      </div>
    </div>
  `).join('');
}

function filterContacts(query) {
  const el = document.getElementById('contacts-list');
  if (!el) return;
  const filtered = state.contacts.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.role.toLowerCase().includes(query.toLowerCase())
  );
  el.innerHTML = filtered.map(c => `
    <div class="contact-card">
      <div class="contact-avatar">${c.initials}</div>
      <div class="contact-name">${c.name}</div>
      <div class="contact-role">${c.role}</div>
      <div class="contact-actions">
        <button class="contact-btn" onclick="startInstantMeeting()">🎥</button>
        <button class="contact-btn" onclick="showToast('Message sent!')">💬</button>
      </div>
    </div>
  `).join('');
}

function showAddContact() {
  showToast('Add contact: coming soon!');
}

// ===== SETTINGS =====
function saveSettings() {
  const name = document.getElementById('settings-name').value;
  const email = document.getElementById('settings-email').value;
  if (state.user) {
    state.user.name = name;
    state.user.email = email;
    state.user.initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    updateUserUI();
  }
  showToast('✅ Settings saved!');
}

function toggleTheme(checkbox) {
  // Theme is always dark for this premium design
  showToast(checkbox.checked ? 'Dark mode enabled' : 'Light mode coming soon!');
  if (!checkbox.checked) checkbox.checked = true;
}

// ===== MODALS =====
function showJoinModal() {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('join-modal').style.display = '';
  document.getElementById('schedule-modal').style.display = 'none';
  document.getElementById('invite-modal').style.display = 'none';
}
function showScheduleModal() {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('join-modal').style.display = 'none';
  document.getElementById('schedule-modal').style.display = '';
  document.getElementById('invite-modal').style.display = 'none';
}
function showInviteModal() {
  document.getElementById('invite-code-text').textContent = state.roomCode;
  document.getElementById('invite-link-text').textContent = `https://nexus.io/meet/${state.roomCode}`;
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('join-modal').style.display = 'none';
  document.getElementById('schedule-modal').style.display = 'none';
  document.getElementById('invite-modal').style.display = '';
}
function closeModals() {
  document.getElementById('modal-overlay').classList.remove('active');
}
function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModals();
}

function joinRoom() {
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!code) { showToast('⚠️ Please enter a room code'); return; }
  state.roomCode = code;
  closeModals();
  enterMeeting();
}

function scheduleMeeting() {
  const title = document.getElementById('sched-title').value || 'New Meeting';
  closeModals();
  showToast(`📅 "${title}" scheduled!`);
}

function copyRoomCode() {
  navigator.clipboard.writeText(state.roomCode).catch(() => {});
  showToast('📋 Room code copied!');
}
function copyInviteCode() {
  navigator.clipboard.writeText(state.roomCode).catch(() => {});
  showToast('📋 Code copied!');
}
function copyInviteLink() {
  navigator.clipboard.writeText(`https://nexus.io/meet/${state.roomCode}`).catch(() => {});
  showToast('🔗 Link copied!');
}

// ===== MEETING =====
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NEXUS-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function startInstantMeeting() {
  state.roomCode = generateRoomCode();
  await enterMeeting();
}

async function enterMeeting() {
  showPage('meeting-page');
  document.getElementById('room-code-display').textContent = state.roomCode;

  // Reset state
  state.isMuted = false;
  state.isCamOff = false;
  state.isScreenSharing = false;
  state.isRecording = false;
  state.chatMessages = [];
  state.recordedChunks = [];
  document.getElementById('chat-messages').innerHTML = '';

  // Attempt to get camera
  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = state.localStream;
  } catch (err) {
    // Camera not available, show placeholder
    showCamPlaceholder('local-video-tile', state.user?.initials || 'You');
  }

  // Start timer
  state.meetingStartTime = Date.now();
  state.meetingTimer = setInterval(updateMeetingTimer, 1000);

  // Simulate other participants joining after delay
  setTimeout(() => addFakeParticipants(), 3000);

  // Welcome message
  setTimeout(() => {
    addChatMessage('NEXUS Bot', '👋 Meeting started! Room: ' + state.roomCode, false, true);
  }, 1000);

  updateControlState();
}

function showCamPlaceholder(tileId, label) {
  const tile = document.getElementById(tileId);
  if (!tile) return;
  const video = tile.querySelector('video');
  if (video) video.style.display = 'none';
  const placeholder = document.createElement('div');
  placeholder.className = 'cam-off-placeholder';
  placeholder.innerHTML = `<div class="cam-avatar">${label}</div><div style="font-size:0.8rem;color:var(--text2)">${label}</div>`;
  tile.appendChild(placeholder);
}

function addFakeParticipants() {
  if (document.getElementById('meeting-page').style.display === 'none') return;
  const grid = document.getElementById('video-grid');
  const participants = document.getElementById('participants-list');

  state.fakeParticipants.forEach((p, i) => {
    setTimeout(() => {
      // Add video tile
      const tile = document.createElement('div');
      tile.className = 'video-tile';
      tile.id = 'fake-tile-' + i;
      tile.innerHTML = `
        <div class="cam-off-placeholder">
          <div class="cam-avatar">${p.initials}</div>
          <div style="font-size:0.8rem;color:var(--text2)">${p.name}</div>
        </div>
        <div class="video-overlay">
          <div class="participant-name">${p.name}</div>
          <div class="tile-controls"><span>🎙</span></div>
        </div>
        <div class="speaking-ring"></div>
      `;
      grid.appendChild(tile);

      // Add to participants list
      if (participants) {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
          <div class="p-avatar">${p.initials}</div>
          <div class="p-info">
            <div class="p-name">${p.name}</div>
            <div class="p-status">● Joined</div>
          </div>
          <div class="p-icons">🎙 🎥</div>
        `;
        participants.appendChild(item);
      }

      // Update count
      const countEl = document.getElementById('participant-count');
      if (countEl) countEl.textContent = grid.children.length;

      // Toast
      showToast(`${p.name} joined the meeting`);
      addChatMessage('NEXUS Bot', `${p.name} joined`, false, true);
    }, i * 1500);
  });
}

function updateMeetingTimer() {
  if (!state.meetingStartTime) return;
  const elapsed = Math.floor((Date.now() - state.meetingStartTime) / 1000);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  const el = document.getElementById('meeting-duration');
  if (el) el.textContent = `${m}:${s}`;
}

function endCall() {
  // Stop streams
  if (state.localStream) { state.localStream.getTracks().forEach(t => t.stop()); state.localStream = null; }
  if (state.screenStream) { state.screenStream.getTracks().forEach(t => t.stop()); state.screenStream = null; }
  if (state.mediaRecorder) { try { state.mediaRecorder.stop(); } catch(e){} state.mediaRecorder = null; }
  clearInterval(state.meetingTimer); state.meetingTimer = null;

  // Clear fake tiles
  const grid = document.getElementById('video-grid');
  const fakeTiles = grid.querySelectorAll('[id^="fake-tile"]');
  fakeTiles.forEach(t => t.remove());

  // Reset cam placeholder
  const localTile = document.getElementById('local-video-tile');
  const placeholders = localTile.querySelectorAll('.cam-off-placeholder');
  placeholders.forEach(p => p.remove());
  document.getElementById('local-video').style.display = '';
  document.getElementById('local-video').srcObject = null;

  // Reset panels
  if (state.isWhiteboardOpen) toggleWhiteboard();
  if (state.isChatOpen) toggleChat();
  if (state.isParticipantsOpen) toggleParticipants();
  if (state.isScreenSharing) {
    document.getElementById('screen-share-container').style.display = 'none';
    state.isScreenSharing = false;
  }

  showPage('dashboard-page');
  showDashTab('home');
  showToast('📵 Meeting ended');
}

// ===== CONTROLS =====
async function toggleMic() {
  state.isMuted = !state.isMuted;
  if (state.localStream) {
    state.localStream.getAudioTracks().forEach(t => t.enabled = !state.isMuted);
  }
  updateControlState();
  showToast(state.isMuted ? '🔇 Microphone muted' : '🎙️ Microphone on');
}

async function toggleCam() {
  state.isCamOff = !state.isCamOff;
  if (state.localStream) {
    state.localStream.getVideoTracks().forEach(t => t.enabled = !state.isCamOff);
  }
  const localTile = document.getElementById('local-video-tile');
  const existingPlaceholder = localTile.querySelector('.cam-off-placeholder');
  if (state.isCamOff) {
    if (!existingPlaceholder) showCamPlaceholder('local-video-tile', state.user?.initials || 'You');
    document.getElementById('local-video').style.opacity = '0';
  } else {
    if (existingPlaceholder) existingPlaceholder.remove();
    document.getElementById('local-video').style.opacity = '1';
  }
  updateControlState();
  showToast(state.isCamOff ? '🚫 Camera off' : '🎥 Camera on');
}

async function toggleScreenShare() {
  if (state.isScreenSharing) {
    // Stop
    if (state.screenStream) { state.screenStream.getTracks().forEach(t => t.stop()); state.screenStream = null; }
    document.getElementById('screen-share-container').style.display = 'none';
    state.isScreenSharing = false;
    updateControlState();
    showToast('🖥️ Screen sharing stopped');
    return;
  }
  try {
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    document.getElementById('screen-share-video').srcObject = state.screenStream;
    document.getElementById('screen-share-container').style.display = '';
    state.isScreenSharing = true;
    state.screenStream.getTracks()[0].onended = () => {
      if (state.isScreenSharing) toggleScreenShare();
    };
    updateControlState();
    showToast('🖥️ Screen sharing started');
  } catch (err) {
    showToast('⚠️ Screen share cancelled');
  }
}

function toggleRecord() {
  if (state.isRecording) {
    // Stop recording
    if (state.mediaRecorder) {
      state.mediaRecorder.stop();
    }
    state.isRecording = false;
    document.getElementById('record-btn').classList.remove('recording');
    document.getElementById('rec-label').textContent = 'Record';
    showToast('⏹️ Recording saved!');
    return;
  }

  // Start recording
  try {
    const stream = state.localStream;
    if (!stream) { showToast('⚠️ No stream to record'); return; }
    state.recordedChunks = [];
    state.mediaRecorder = new MediaRecorder(stream);
    state.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) state.recordedChunks.push(e.data);
    };
    state.mediaRecorder.onstop = () => {
      const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `nexus-${state.roomCode}-${Date.now()}.webm`; a.click();
      URL.revokeObjectURL(url);
    };
    state.mediaRecorder.start();
    state.isRecording = true;
    document.getElementById('record-btn').classList.add('recording');
    document.getElementById('rec-label').textContent = 'Stop';
    showToast('⏺️ Recording started');
  } catch (err) {
    showToast('⚠️ Recording not supported in this browser');
  }
}

function updateControlState() {
  const micBtn = document.getElementById('mic-btn');
  const camBtn = document.getElementById('cam-btn');
  const screenBtn = document.getElementById('screen-btn');
  const micIcon = document.getElementById('mic-icon');
  const camIcon = document.getElementById('cam-icon');
  const micLabel = micBtn?.querySelector('.ctrl-label');
  const camLabel = camBtn?.querySelector('.ctrl-label');

  if (micBtn) micBtn.classList.toggle('muted', state.isMuted);
  if (micIcon) micIcon.textContent = state.isMuted ? '🔇' : '🎙️';
  if (micLabel) micLabel.textContent = state.isMuted ? 'Unmute' : 'Mute';

  if (camBtn) camBtn.classList.toggle('muted', state.isCamOff);
  if (camIcon) camIcon.textContent = state.isCamOff ? '🚫' : '🎥';
  if (camLabel) camLabel.textContent = state.isCamOff ? 'Start Cam' : 'Camera';

  if (screenBtn) screenBtn.classList.toggle('active', state.isScreenSharing);
}

// ===== WHITEBOARD =====
function toggleWhiteboard() {
  state.isWhiteboardOpen = !state.isWhiteboardOpen;
  const panel = document.getElementById('whiteboard-panel');
  panel.style.display = state.isWhiteboardOpen ? '' : 'none';
  document.getElementById('wb-btn').classList.toggle('active', state.isWhiteboardOpen);
  if (state.isWhiteboardOpen) initWhiteboard();
}

function openWhiteboard() {
  showPage('meeting-page');
  state.roomCode = generateRoomCode();
  document.getElementById('room-code-display').textContent = state.roomCode;
  state.meetingStartTime = Date.now();
  state.meetingTimer = setInterval(updateMeetingTimer, 1000);
  state.isWhiteboardOpen = true;
  document.getElementById('whiteboard-panel').style.display = '';
  document.getElementById('wb-btn').classList.add('active');
  initWhiteboard();
}

let wbCanvas, wbCtx;
function initWhiteboard() {
  wbCanvas = document.getElementById('whiteboard-canvas');
  wbCtx = wbCanvas.getContext('2d');
  wbCanvas.width = wbCanvas.offsetWidth;
  wbCanvas.height = wbCanvas.offsetHeight;
  wbCtx.fillStyle = '#ffffff';
  wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);

  wbCanvas.onmousedown = wbStart;
  wbCanvas.onmousemove = wbDraw;
  wbCanvas.onmouseup = wbEnd;
  wbCanvas.onmouseleave = wbEnd;
  wbCanvas.ontouchstart = e => { e.preventDefault(); wbStart(e.touches[0]); };
  wbCanvas.ontouchmove = e => { e.preventDefault(); wbDraw(e.touches[0]); };
  wbCanvas.ontouchend = wbEnd;
}

function getWbPos(e) {
  const rect = wbCanvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

let shapeStartX, shapeStartY, snapshot;
function wbStart(e) {
  const pos = getWbPos(e);
  state.wb.drawing = true;
  state.wb.lastX = pos.x;
  state.wb.lastY = pos.y;
  shapeStartX = pos.x;
  shapeStartY = pos.y;
  snapshot = wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height);

  if (state.wb.tool === 'text') {
    const text = prompt('Enter text:');
    if (text) {
      wbCtx.fillStyle = state.wb.color;
      wbCtx.font = `${state.wb.size * 4 + 12}px Syne, sans-serif`;
      wbCtx.fillText(text, pos.x, pos.y);
    }
    state.wb.drawing = false;
  }
}

function wbDraw(e) {
  if (!state.wb.drawing) return;
  const pos = getWbPos(e);
  wbCtx.lineWidth = state.wb.size;
  wbCtx.lineCap = 'round';
  wbCtx.lineJoin = 'round';

  if (state.wb.tool === 'pen') {
    wbCtx.globalCompositeOperation = 'source-over';
    wbCtx.strokeStyle = state.wb.color;
    wbCtx.beginPath();
    wbCtx.moveTo(state.wb.lastX, state.wb.lastY);
    wbCtx.lineTo(pos.x, pos.y);
    wbCtx.stroke();
    state.wb.lastX = pos.x;
    state.wb.lastY = pos.y;
  } else if (state.wb.tool === 'eraser') {
    wbCtx.globalCompositeOperation = 'destination-out';
    wbCtx.beginPath();
    wbCtx.arc(pos.x, pos.y, state.wb.size * 3, 0, Math.PI * 2);
    wbCtx.fill();
    wbCtx.globalCompositeOperation = 'source-over';
  } else if (state.wb.tool === 'rect') {
    wbCtx.putImageData(snapshot, 0, 0);
    wbCtx.strokeStyle = state.wb.color;
    wbCtx.strokeRect(shapeStartX, shapeStartY, pos.x - shapeStartX, pos.y - shapeStartY);
  } else if (state.wb.tool === 'circle') {
    wbCtx.putImageData(snapshot, 0, 0);
    wbCtx.strokeStyle = state.wb.color;
    wbCtx.beginPath();
    const rx = (pos.x - shapeStartX) / 2;
    const ry = (pos.y - shapeStartY) / 2;
    wbCtx.ellipse(shapeStartX + rx, shapeStartY + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
    wbCtx.stroke();
  }
}

function wbEnd() { state.wb.drawing = false; }

function setWbTool(tool, btn) {
  state.wb.tool = tool;
  document.querySelectorAll('.wb-tool').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  wbCanvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
}

document.addEventListener('change', e => {
  if (e.target.id === 'wb-color') state.wb.color = e.target.value;
  if (e.target.id === 'wb-size') state.wb.size = parseInt(e.target.value);
});

function clearWhiteboard() {
  if (!wbCtx) return;
  wbCtx.fillStyle = '#ffffff';
  wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);
}

// ===== CHAT =====
function toggleChat() {
  state.isChatOpen = !state.isChatOpen;
  document.getElementById('chat-panel').style.display = state.isChatOpen ? '' : 'none';
  document.getElementById('chat-btn').classList.toggle('active', state.isChatOpen);
  document.getElementById('chat-notif').style.display = 'none';
  if (state.isParticipantsOpen && state.isChatOpen) toggleParticipants();
  if (state.isChatOpen) setTimeout(() => document.getElementById('chat-input').focus(), 100);
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  addChatMessage(state.user?.name?.split(' ')[0] || 'You', text, true);
  input.value = '';

  // Simulate reply after delay
  setTimeout(() => {
    const replies = [
      'Got it! 👍', 'Thanks for sharing!', 'Sounds good!',
      'Let me check that real quick.', 'Great idea! 🚀', 'Roger that!'
    ];
    const sender = state.fakeParticipants[Math.floor(Math.random() * state.fakeParticipants.length)];
    addChatMessage(sender?.name?.split(' ')[0] || 'Sarah', replies[Math.floor(Math.random() * replies.length)], false);
  }, 1000 + Math.random() * 2000);
}

function addChatMessage(sender, text, isMe, isBot = false) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const msg = document.createElement('div');
  msg.className = `chat-msg${isMe ? ' mine' : ''}`;
  msg.innerHTML = `
    <div class="msg-sender">${isBot ? '🤖 ' : ''}${sender}</div>
    <div class="msg-bubble">${text}</div>
  `;
  msgs.appendChild(msg);
  msgs.scrollTop = msgs.scrollHeight;
  if (!state.isChatOpen && !isMe) {
    document.getElementById('chat-notif').style.display = '';
  }
}

function shareFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  addChatMessage(state.user?.name?.split(' ')[0] || 'You', `📎 Shared file: ${file.name}`, true);
  state.files.unshift({
    name: file.name, type: file.type.includes('image') ? 'image' : 'doc',
    size: formatFileSize(file.size), icon: '📎', date: 'Just now'
  });
  showToast(`📎 ${file.name} shared in chat!`);
  event.target.value = '';
}

// ===== PARTICIPANTS =====
function toggleParticipants() {
  state.isParticipantsOpen = !state.isParticipantsOpen;
  document.getElementById('participants-panel').style.display = state.isParticipantsOpen ? '' : 'none';
  document.getElementById('participants-btn').classList.toggle('active', state.isParticipantsOpen);
  if (state.isChatOpen && state.isParticipantsOpen) toggleChat();
}

function inviteParticipant() {
  closeModals();
  showInviteModal();
}

// ===== TOAST =====
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const meetingActive = document.getElementById('meeting-page').classList.contains('active');
  if (!meetingActive) return;

  if (e.key === 'd' || e.key === 'D') toggleMic();
  if (e.key === 'e' || e.key === 'E') toggleCam();
  if (e.key === 'Escape') {
    if (state.isWhiteboardOpen) toggleWhiteboard();
    else if (state.isChatOpen) toggleChat();
    else if (state.isParticipantsOpen) toggleParticipants();
  }
});

// ===== SIMULATED SPEAKING ANIMATION =====
setInterval(() => {
  const tiles = document.querySelectorAll('.video-tile');
  tiles.forEach(tile => {
    const ring = tile.querySelector('.speaking-ring');
    if (ring) {
      if (Math.random() > 0.7) {
        ring.classList.add('active');
        setTimeout(() => ring.classList.remove('active'), 500 + Math.random() * 1000);
      }
    }
  });
}, 2000);