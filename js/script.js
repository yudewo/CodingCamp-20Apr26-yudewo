document.addEventListener('DOMContentLoaded', () => {

    // === 0. THEME & MODAL LOGIC ===
    const themeToggleBtn = document.getElementById('themeToggle');
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    const applyTheme = () => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        themeToggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    };
    applyTheme();

    themeToggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme();
    });

    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalInput = document.getElementById('modalInput');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    let modalCallback = null;

    const showModal = (config) => {
        modalTitle.textContent = config.title || 'Notice';
        modalMessage.textContent = config.message || '';
        if (config.type === 'prompt') {
            modalInput.style.display = 'block';
            modalInput.value = config.defaultValue || '';
            modalCancel.style.display = 'block';
        } else {
            modalInput.style.display = 'none';
            modalCancel.style.display = 'none';
        }
        modalCallback = config.onConfirm;
        modal.showModal();
    };

    modalConfirm.addEventListener('click', () => {
        if (modalCallback) modalCallback(modalInput.value);
        modal.close();
    });
    modalCancel.addEventListener('click', () => modal.close());

    const showToast = (msg, success = false) => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('aside');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const t = document.createElement('output');
        t.className = `toast ${success ? 'success' : ''}`;
        t.textContent = msg;
        container.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 3000);
    };

    // === 1. CLOCK & GREETING ===
    const updateClock = () => {
        const now = new Date();
        document.getElementById('timeDisplay').textContent = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('dateDisplay').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const h = now.getHours();
        document.getElementById('greetingText').textContent = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
    };
    setInterval(updateClock, 1000); updateClock();

    const userNameEl = document.getElementById('userName');
    userNameEl.textContent = localStorage.getItem('dashName') || 'Yudewo';
    userNameEl.addEventListener('click', () => {
        showModal({
            type: 'prompt', title: 'Change Name', message: 'What is your name?', defaultValue: userNameEl.textContent,
            onConfirm: (n) => { if(n.trim()) { userNameEl.textContent = n.trim(); localStorage.setItem('dashName', n.trim()); }}
        });
    });

    // === 2. DYNAMIC FOCUS TIMER ===
    const timerOutput = document.getElementById('focusTimerDisplay');
    const timeInput = document.getElementById('timeInput');
    let startingTime = parseInt(localStorage.getItem('dashTimer')) || 25 * 60;
    let timeLeft = startingTime;
    let timerId = null;

    timeInput.value = startingTime / 60;

    const renderTimer = () => {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerOutput.textContent = `${m}:${s}`;
    };

    document.getElementById('timeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const mins = parseInt(timeInput.value);
        if (mins > 0) {
            startingTime = mins * 60;
            timeLeft = startingTime;
            localStorage.setItem('dashTimer', startingTime);
            if (timerId) { clearInterval(timerId); timerId = null; }
            renderTimer();
            showToast(`Timer set to ${mins} mins`, true);
        }
    });

    document.getElementById('btnStart').onclick = () => {
        if (timerId) return;
        timerId = setInterval(() => {
            if (timeLeft > 0) { timeLeft--; renderTimer(); }
            else { clearInterval(timerId); timerId = null; showModal({ title: 'Finish!', message: 'Focus time is up!' }); }
        }, 1000);
    };

    document.getElementById('btnStop').onclick = () => { clearInterval(timerId); timerId = null; };
    document.getElementById('btnReset').onclick = () => { clearInterval(timerId); timerId = null; timeLeft = startingTime; renderTimer(); };
    renderTimer();

    // === 3. QUICK LINKS ===
    let links = JSON.parse(localStorage.getItem('dashLinks')) || [];
    const renderLinks = () => {
        const container = document.getElementById('linksContainer');
        container.innerHTML = '';
        links.forEach((l, i) => {
            const a = document.createElement('a');
            a.className = 'link-tag'; a.href = l.url; a.target = '_blank';
            a.innerHTML = `${l.name} <span style="cursor:pointer" onclick="event.preventDefault(); deleteLink(${i})">×</span>`;
            container.appendChild(a);
        });
    };

    document.getElementById('linkForm').onsubmit = (e) => {
        e.preventDefault();
        const n = document.getElementById('linkName').value.trim();
        let u = document.getElementById('linkUrl').value.trim().toLowerCase();
        if (!u.startsWith('http')) u = 'https://' + u;
        if (links.some(l => l.url === u)) return showToast("URL already exists!");
        links.push({ name: n, url: u });
        localStorage.setItem('dashLinks', JSON.stringify(links));
        e.target.reset(); renderLinks();
    };

    window.deleteLink = (i) => { links.splice(i, 1); localStorage.setItem('dashLinks', JSON.stringify(links)); renderLinks(); };
    renderLinks();

    // === 4. TASKS ===
    let tasks = JSON.parse(localStorage.getItem('dashTasks')) || [];
    const renderTasks = () => {
        const list = document.getElementById('taskList');
        list.innerHTML = '';
        tasks.sort((a,b) => a.done - b.done);
        tasks.forEach((t, i) => {
            const li = document.createElement('li');
            li.className = `task-item ${t.done ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${i})">
                <span class="task-text" onclick="editTask(${i})">${t.text}</span>
                <button class="btn btn-red" onclick="deleteTask(${i})">Delete</button>
            `;
            list.appendChild(li);
        });
        localStorage.setItem('dashTasks', JSON.stringify(tasks));
    };

    document.getElementById('taskForm').onsubmit = (e) => {
        e.preventDefault();
        const val = document.getElementById('taskInput').value.trim();
        if (tasks.some(t => t.text.toLowerCase() === val.toLowerCase())) return showToast("Task already exists!");
        tasks.push({ text: val, done: false });
        e.target.reset(); renderTasks();
    };

    window.toggleTask = (i) => { tasks[i].done = !tasks[i].done; renderTasks(); };
    window.deleteTask = (i) => { tasks.splice(i, 1); renderTasks(); };
    window.editTask = (i) => {
        showModal({
            type: 'prompt', title: 'Edit Task', defaultValue: tasks[i].text,
            onConfirm: (val) => { if(val.trim()) { tasks[i].text = val.trim(); renderTasks(); }}
        });
    };
    renderTasks();
});