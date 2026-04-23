document.addEventListener('DOMContentLoaded', () => {

    // === THEME  ===
    const themeToggleBtn = document.getElementById('themeToggle');
    let isDarkMode = localStorage.getItem('darkMode') === 'true';

    function applyTheme() {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            themeToggleBtn.textContent = '☀️'; 
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.textContent = '🌙'; 
        }
    }
    applyTheme(); // Terapkan saat web pertama kali dimuat

    themeToggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme();
    });

    // === 1. LOGIC (POP-UP DI TENGAH) ===
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalInput = document.getElementById('modalInput');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    let modalCallback = null;

    // Fungsi untuk memanggil pop-up
    function showModal(config) {
        modalTitle.textContent = config.title || 'Notice';
        
        if (config.message) {
            modalMessage.textContent = config.message;
            modalMessage.style.display = 'block';
        } else {
            modalMessage.style.display = 'none';
        }

        if (config.type === 'prompt') {
            modalInput.style.display = 'block';
            modalInput.value = config.defaultValue || '';
            modalCancel.style.display = 'block'; 
        } else {
            
            modalInput.style.display = 'none';
            modalCancel.style.display = 'none'; 
        }

        modalCallback = config.onConfirm || null;
        modal.showModal(); 
    }

    modalCancel.addEventListener('click', () => {
        modal.close();
    });

    modalConfirm.addEventListener('click', () => {
        if (modalCallback) {
            // Jika benar, kirim value inputnya. Jika alert, cukup tutup.
            if (modalInput.style.display === 'block') {
                modalCallback(modalInput.value);
            } else {
                modalCallback();
            }
        }
        modal.close();
    });

    // === 2. CLOCK & GREETING ===
    const timeDisplay = document.getElementById('timeDisplay');
    const dateDisplay = document.getElementById('dateDisplay');
    const greetingText = document.getElementById('greetingText');
    const userNameEl = document.getElementById('userName');

    function updateClock() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour12: false });
        dateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const hour = now.getHours();
        if (hour < 12) greetingText.textContent = 'Morning';
        else if (hour < 18) greetingText.textContent = 'Afternoon';
        else greetingText.textContent = 'Evening';
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Mengganti Nama 
    let savedName = localStorage.getItem('dashName') || 'Yudewo';
    userNameEl.textContent = savedName;

    userNameEl.addEventListener('click', () => {
        showModal({
            type: 'prompt',
            title: 'Change Name',
            message: 'What should we call you?',
            defaultValue: savedName,
            onConfirm: (newName) => {
                if(newName && newName.trim() !== '') { 
                    savedName = newName.trim();
                    userNameEl.textContent = savedName; 
                    localStorage.setItem('dashName', savedName); 
                }
            }
        });
    });

    // === 3. FOCUS TIMER ===
    const timerOutput = document.getElementById('focusTimerDisplay');
    const btnStart = document.getElementById('btnStart');
    const btnStop = document.getElementById('btnStop');
    const btnReset = document.getElementById('btnReset');

    const STARTING_TIME = 25 * 60;
    let timeLeft = STARTING_TIME;
    let timerId = null;

    function renderTimer() {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        timerOutput.textContent = `${m}:${s}`;
    }

    btnStart.addEventListener('click', () => {
        if (timerId !== null) return; 
        
        timerId = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                renderTimer();
            } else {
                clearInterval(timerId);
                timerId = null;
                
                showModal({ type: 'alert', title: 'Time is Up!', message: 'Focus time is up! Take a break.' });
            }
        }, 1000);
    });

    btnStop.addEventListener('click', () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    });

    btnReset.addEventListener('click', () => {
        clearInterval(timerId);
        timerId = null;
        timeLeft = STARTING_TIME;
        renderTimer();
    });
    renderTimer();

    // === 4. QUICK LINKS ===
    const linkForm = document.getElementById('linkForm');
    const linksContainer = document.getElementById('linksContainer');
    let links = JSON.parse(localStorage.getItem('dashLinks')) || [];

    function renderLinks() {
        linksContainer.innerHTML = '';
        links.forEach((l, i) => {
            const a = document.createElement('a');
            a.className = 'link-tag';
            a.href = l.url;
            a.target = '_blank';
            
            const closeBtn = document.createElement('span');
            closeBtn.textContent = ' ×';
            closeBtn.className = 'link-delete';
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                links.splice(i, 1);
                localStorage.setItem('dashLinks', JSON.stringify(links));
                renderLinks();
            });

            a.textContent = l.name;
            a.appendChild(closeBtn);
            linksContainer.appendChild(a);
        });
    }

    linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('linkName');
        const urlInput = document.getElementById('linkUrl');
        
        const name = nameInput.value.trim();
        let url = urlInput.value.trim().toLowerCase();

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        // Pop-up Alert Jika URL Duplikat
        if (links.some(link => link.url === url)) {
            showModal({ type: 'alert', title: 'Duplicate Error', message: 'URL already exists in Quick Links!' });
            return;
        }

        links.push({ name, url });
        localStorage.setItem('dashLinks', JSON.stringify(links));
        linkForm.reset();
        renderLinks();
    });
    renderLinks();

    // === 5. TASKS ===
    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    let tasks = JSON.parse(localStorage.getItem('dashTasks')) || [];

    function saveAndRenderTasks() {
        localStorage.setItem('dashTasks', JSON.stringify(tasks));
        renderTasks();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.sort((a,b) => a.done === b.done ? 0 : a.done ? 1 : -1);
        
        tasks.forEach((t, i) => {
            const li = document.createElement('li');
            li.className = `task-item ${t.done ? 'completed' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = t.done;
            checkbox.addEventListener('change', () => {
                tasks[i].done = !tasks[i].done;
                saveAndRenderTasks();
            });

            const span = document.createElement('span');
            span.textContent = t.text;
            span.className = 'task-text';
            span.title = "Click to edit";
            span.addEventListener('click', () => {
                // Pop-up Prompt untuk Edit Tugas
                showModal({
                    type: 'prompt',
                    title: 'Edit Task',
                    defaultValue: t.text,
                    onConfirm: (newText) => {
                        if (newText && newText.trim() !== "") {
                            if (tasks.some((task, index) => index !== i && task.text.toLowerCase() === newText.trim().toLowerCase())) {
                                showModal({ type: 'alert', title: 'Duplicate Error', message: 'Task name already exists!' });
                                return;
                            }
                            tasks[i].text = newText.trim();
                            saveAndRenderTasks();
                        }
                    }
                });
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-red';
            delBtn.textContent = 'Delete';
            delBtn.style.marginLeft = 'auto';
            delBtn.addEventListener('click', () => {
                tasks.splice(i, 1);
                saveAndRenderTasks();
            });

            li.append(checkbox, span, delBtn);
            taskList.appendChild(li);
        });
    }

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('taskInput');
        const text = input.value.trim();

        if (text === '') return;

        // Pop-up Alert Jika Task Duplikat
        if (tasks.some(t => t.text.toLowerCase() === text.toLowerCase())) {
            showModal({ type: 'alert', title: 'Duplicate Error', message: 'This task is already on your list!' });
            return;
        }

        tasks.push({ text: text, done: false });
        input.value = '';
        saveAndRenderTasks();
    });
    renderTasks();
});