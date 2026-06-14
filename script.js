const taskForm = document.getElementById('task-form');
        const taskTitleInput = document.getElementById('task-title-input');
        const taskCategory = document.getElementById('task-category');
        const taskPriority = document.getElementById('task-priority');
        const taskDate = document.getElementById('task-date');
        const formSubmitBtn = document.getElementById('form-submit-btn');
        const submitBtnText = document.getElementById('submit-btn-text');
        
        // Navigation Elements
        const searchInput = document.getElementById('search-input');
        const filterBtns = document.querySelectorAll('.tab-btn');
        const taskListContainer = document.getElementById('task-list');
        
        // Counters
        const countAll = document.getElementById('count-all');
        const countActive = document.getElementById('count-active');
        const countCompleted = document.getElementById('count-completed');
        
        // Progress, Themes, Date Picker Widgets
        const progressBar = document.getElementById('progress-bar');
        const progressPercent = document.getElementById('progress-percent');
        const currentDateText = document.getElementById('current-date');
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const calendarPicker = document.getElementById('calendar-picker');
        const calendarStripContainer = document.getElementById('calendar-strip');
        const resetDateFilterBtn = document.getElementById('reset-date-filter');
        const activeCalendarIndicator = document.getElementById('active-calendar-indicator');
        const activeFilterDateLabel = document.getElementById('active-filter-date-label');
        const clearCalendarFilterBtn = document.getElementById('clear-calendar-filter');
        
        // Modal & Popups
        const confirmModal = document.getElementById('confirm-modal');
        const modalCard = document.getElementById('modal-card');
        const modalConfirmBtn = document.getElementById('modal-confirm');
        const modalCancelBtn = document.getElementById('modal-cancel');
        const toast = document.getElementById('toast-notif');
        const toastMsg = document.getElementById('toast-msg');

        // Pomodoro Clock Elements (Enhanced with customizable study/break states)
        const timerDisplay = document.getElementById('timer-display');
        const timerStartBtn = document.getElementById('timer-start');
        const timerResetBtn = document.getElementById('timer-reset');
        const timerModeBadge = document.getElementById('timer-mode-badge');
        const studyMinutesInput = document.getElementById('study-minutes-input');
        const breakMinutesInput = document.getElementById('break-minutes-input');
        
        let timerInterval = null;
        let timerSeconds = 1500; // 25 min default state
        let isTimerRunning = false;
        let activeTimerMode = 'study'; // 'study' or 'break'

        // Inspirational Student Quotes List
        const quotes = [
            "\"The secret of getting ahead is getting started.\" — Mark Twain",
            "\"It always seems impossible until it's done.\" — Nelson Mandela",
            "\"Believe you can and you're halfway there.\" — Theodore Roosevelt",
            "\"Work hard in silence, let your success be your noise.\" — Frank Ocean",
            "\"There is no substitute for hard work.\" — Thomas Edison",
            "\"Start where you are. Use what you have. Do what you can.\" — Arthur Ashe",
            "\"The expert in anything was once a beginner.\" — Helen Hayes"
        ];

        /* ==========================================
           STATE CONTAINER (Single Source of Truth)
           ------------------------------------------
           Clean array-based structures. Makes integrating
           with Backend databases (fetch/JSON API/MongoDB) effortless!
           ========================================== */
        let tasks = [];
        let currentFilter = 'all'; // all | active | completed
        let currentEditId = null; // Track item in update state
        let currentDeleteId = null; // Track item ready for modal deletion
        let selectedFilterDate = null; // Holds ISO Date string "YYYY-MM-DD" if calendar filter is active

        // Load quotes on load
        function loadNewQuote() {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            document.getElementById('motivational-quote').innerText = quotes[randomIndex];
        }

        /* ==========================================
           DYNAMIC CALENDAR AND WEEKDAY STRIP
           ========================================== */
        // Formats today's date dynamically for header display
        function updateHeaderDate() {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const today = new Date();
            currentDateText.innerText = today.toLocaleDateString('en-US', options);
        }

        // Generates the 7-day strip centered around the selected date
        function generateCalendarStrip(baseDate = new Date()) {
            calendarStripContainer.innerHTML = '';
            
            // Generate week starting from baseDate
            const startOfWeek = new Date(baseDate);
            // Move back 3 days to keep the current/base date at the center of the 7-day strip
            startOfWeek.setDate(baseDate.getDate() - 3);

            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);

                const dayNum = day.getDate();
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dateString = day.toISOString().substring(0, 10); // Format YYYY-MM-DD

                const isToday = new Date().toISOString().substring(0, 10) === dateString;
                const isSelected = selectedFilterDate === dateString;

                // Create the beautiful weekday bubble card
                const dayButton = document.createElement('button');
                dayButton.className = `flex flex-col items-center gap-1 p-2 w-11 rounded-xl transition-all cursor-pointer ${
                    isSelected 
                    ? 'bg-student-600 text-white shadow-md shadow-student-500/20 dark:bg-student-600' 
                    : isToday 
                        ? 'bg-student-100 text-student-600 dark:bg-slate-800 dark:text-student-200 border border-student-200/50 dark:border-slate-700' 
                        : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`;
                dayButton.setAttribute('data-date', dateString);
                dayButton.innerHTML = `
                    <span class="text-[9px] font-bold uppercase">${dayName}</span>
                    <span class="text-sm font-extrabold">${dayNum}</span>
                `;

                // Quick tap date filtering event
                dayButton.addEventListener('click', () => {
                    selectCalendarDate(dateString);
                });

                calendarStripContainer.appendChild(dayButton);
            }
        }

        // Handles date updates from either Calendar Strip click or Date Input picker
        function selectCalendarDate(dateString) {
            selectedFilterDate = dateString;
            
            // Sync the native calendar picker input
            calendarPicker.value = dateString;

            // Generate week strip centered around selected date
            generateCalendarStrip(new Date(dateString));

            // Show date filter reset controls
            resetDateFilterBtn.classList.remove('hidden');
            activeCalendarIndicator.classList.remove('hidden');
            activeCalendarIndicator.classList.add('flex');
            
            const parsedDate = new Date(dateString);
            activeFilterDateLabel.innerText = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            renderApp();
            showToast(`Viewing schedule for ${activeFilterDateLabel.innerText}`);
        }

        // Resets the Calendar Filters back to viewing all days
        function clearCalendarFilter() {
            selectedFilterDate = null;
            calendarPicker.value = '';
            resetDateFilterBtn.classList.add('hidden');
            activeCalendarIndicator.classList.add('hidden');
            activeCalendarIndicator.classList.remove('flex');
            generateCalendarStrip(new Date()); // regenerate around real today
            renderApp();
            showToast('Showing all academic deadlines');
        }

        /* ==========================================
           POMODORO SYNTHESIZER & CUSTOM TIMER SYSTEMS
           ------------------------------------------
           Uses pure native Web Audio API inside browser. 
           No external mp3 urls, ensuring 100% offline stability.
           ========================================== */
        function playFocusEndChime() {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 Node
                oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5 Node
                oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5 Node
                
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.6);
            } catch (error) {
                console.warn("Audio Context block: Interact with screen to play chimes.");
            }
        }

        // Incremental/Decremental adjustments via +/- controls
        function adjustCustomDuration(type, delta) {
            if (type === 'study') {
                let currentVal = parseInt(studyMinutesInput.value) || 25;
                currentVal = Math.max(1, Math.min(180, currentVal + delta));
                studyMinutesInput.value = currentVal;
                
                // If the active state is study and the timer is not running, update output display immediately
                if (!isTimerRunning && activeTimerMode === 'study') {
                    timerSeconds = currentVal * 60;
                    updateTimerUI();
                }
            } else if (type === 'break') {
                let currentVal = parseInt(breakMinutesInput.value) || 5;
                currentVal = Math.max(1, Math.min(60, currentVal + delta));
                breakMinutesInput.value = currentVal;
                
                // If the active state is break and the timer is not running, update output display immediately
                if (!isTimerRunning && activeTimerMode === 'break') {
                    timerSeconds = currentVal * 60;
                    updateTimerUI();
                }
            }
        }

        // Apply Focus/Break Custom Presets
        function applyTimerPreset(type) {
            // Stop any running timers safely
            if (isTimerRunning) {
                toggleTimer();
            }
            
            activeTimerMode = type;
            
            if (type === 'study') {
                const studyMins = parseInt(studyMinutesInput.value) || 25;
                timerSeconds = studyMins * 60;
                timerModeBadge.innerText = "Study Session";
                timerModeBadge.className = "text-[10px] font-bold px-2 py-1 rounded bg-student-50 dark:bg-student-950 text-student-600 dark:text-student-200 border border-student-100 dark:border-student-900/50 uppercase";
                showToast(`Study Time configured: ${studyMins} minutes`);
            } else {
                const breakMins = parseInt(breakMinutesInput.value) || 5;
                timerSeconds = breakMins * 60;
                timerModeBadge.innerText = "Break Session";
                timerModeBadge.className = "text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 uppercase";
                showToast(`Break Time configured: ${breakMins} minutes`);
            }
            
            updateTimerUI();
        }

        // Updates Pomodoro Time Numbers
        function updateTimerUI() {
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Starts or Stops Study Timer
        function toggleTimer() {
            if (isTimerRunning) {
                clearInterval(timerInterval);
                timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                timerStartBtn.className = timerStartBtn.className.replace('bg-amber-500', 'bg-student-600').replace('hover:bg-amber-600', 'hover:bg-student-700');
                isTimerRunning = false;
            } else {
                timerInterval = setInterval(() => {
                    if (timerSeconds > 0) {
                        timerSeconds--;
                        updateTimerUI();
                    } else {
                        clearInterval(timerInterval);
                        playFocusEndChime();
                        
                        if (activeTimerMode === 'study') {
                            showToast('Study session complete! Take a break. ☕');
                            // Auto transition selection UI to Break Mode
                            applyTimerPreset('break');
                        } else {
                            showToast('Break over! Ready to focus? 💪');
                            // Auto transition selection UI to Study Mode
                            applyTimerPreset('study');
                        }
                    }
                }, 1000);
                timerStartBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                timerStartBtn.className = timerStartBtn.className.replace('bg-student-600', 'bg-amber-500').replace('hover:bg-student-700', 'hover:bg-amber-600');
                isTimerRunning = true;
            }
        }

        // Reset timer defaults
        function resetTimer() {
            clearInterval(timerInterval);
            isTimerRunning = false;
            
            if (activeTimerMode === 'study') {
                const studyMins = parseInt(studyMinutesInput.value) || 25;
                timerSeconds = studyMins * 60;
            } else {
                const breakMins = parseInt(breakMinutesInput.value) || 5;
                timerSeconds = breakMins * 60;
            }
            
            updateTimerUI();
            timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            timerStartBtn.className = timerStartBtn.className.replace('bg-amber-500', 'bg-student-600').replace('hover:bg-amber-600', 'hover:bg-student-700');
            showToast('Timer reset to active configuration');
        }

        /* ==========================================
           BACKEND-READY LOCAL STORAGE INTERFACE
           ------------------------------------------
           These read/write modules are optimized to be
           swapped with RESTful Fetch or async/await API
           calls directly to your backend databases!
           ========================================== */
        // Load stored JSON array
        function loadTasks() {
            // BACKEND OPTIMIZATION:
            // const response = await fetch('/api/tasks');
            // tasks = await response.json();
            const storedTasks = localStorage.getItem('academix_tasks');
            if (storedTasks) {
                tasks = JSON.parse(storedTasks);
            } else {
                // Preset default assignments
                const todayStr = new Date().toISOString().substring(0, 10);
                tasks = [
                    { id: '1', title: 'Complete Physics Homework Assignment 3 🧪', category: 'Lab Work', priority: 'high', date: `${todayStr}T16:00`, completed: false },
                    { id: '2', title: 'Revise Integration Formulas for Calculus Exam ✍️', category: 'Exam Prep', priority: 'medium', date: `${todayStr}T10:00`, completed: true },
                    { id: '3', title: 'Group meeting for UX/UI Design Project 💻', category: 'Project', priority: 'low', date: '', completed: false }
                ];
                saveTasksToStorage();
            }
        }

        // Writes structural changes back into local memory
        function saveTasksToStorage() {
            // BACKEND OPTIMIZATION:
            // await fetch('/api/tasks', { method: 'POST', body: JSON.stringify(tasks), headers: { 'Content-Type': 'application/json' } });
            localStorage.setItem('academix_tasks', JSON.stringify(tasks));
        }

        /* ==========================================
           CRUD TASK DATABASE MANIPULATION
           ========================================== */
        // 1. SAVE/EDIT
        function saveTask(e) {
            e.preventDefault();
            
            const title = taskTitleInput.value.trim();
            const category = taskCategory.value;
            const priority = taskPriority.value;
            const date = taskDate.value;

            if (!title) return;

            if (currentEditId) {
                // Update mode
                tasks = tasks.map(task => {
                    if (task.id === currentEditId) {
                        return { ...task, title, category, priority, date };
                    }
                    return task;
                });
                showToast('Study task updated successfully!');
                currentEditId = null;
                submitBtnText.innerText = "Add to Academic Tasks";
                formSubmitBtn.className = formSubmitBtn.className.replace('from-emerald-600', 'from-student-600').replace('to-emerald-700', 'to-student-600');
            } else {
                // Create Mode
                const newTask = {
                    id: Date.now().toString(),
                    title,
                    category,
                    priority,
                    date,
                    completed: false
                };
                tasks.unshift(newTask);
                showToast('New academic task added! 📚');
            }

            saveTasksToStorage();
            taskForm.reset();
            renderApp();
        }

        // 2. TOGGLE COMPLETION
        function toggleTaskComplete(id) {
            tasks = tasks.map(task => {
                if (task.id === id) {
                    const nextState = !task.completed;
                    showToast(nextState ? 'Kudos! Task Completed! 🎉' : 'Task marked active again.');
                    return { ...task, completed: nextState };
                }
                return task;
            });
            saveTasksToStorage();
            renderApp();
        }

        // 3. SHOW CONFIRM DELETE OVERLAY
        function promptDeleteTask(id) {
            currentDeleteId = id;
            confirmModal.classList.remove('opacity-0', 'pointer-events-none');
            modalCard.classList.remove('translate-y-4');
        }

        // Hide overlay safely
        function closeDeleteModal() {
            confirmModal.classList.add('opacity-0', 'pointer-events-none');
            modalCard.classList.add('translate-y-4');
            currentDeleteId = null;
        }

        // Complete deletion run
        function executeDeleteTask() {
            if (currentDeleteId) {
                tasks = tasks.filter(task => task.id !== currentDeleteId);
                saveTasksToStorage();
                showToast('Task deleted successfully.');
                closeDeleteModal();
                renderApp();
            }
        }

        // Populate update form inputs
        function populateEditForm(id) {
            const taskToEdit = tasks.find(task => task.id === id);
            if (!taskToEdit) return;

            taskTitleInput.value = taskToEdit.title;
            taskCategory.value = taskToEdit.category;
            taskPriority.value = taskToEdit.priority;
            taskDate.value = taskToEdit.date;

            currentEditId = id;
            submitBtnText.innerText = "Update Study Task";
            formSubmitBtn.className = formSubmitBtn.className.replace('from-student-600', 'from-emerald-600').replace('to-student-600', 'to-emerald-700');
            
            // Focus and scroll smoothly up to the editing block
            window.scrollTo({ top: 0, behavior: 'smooth' });
            taskTitleInput.focus();
        }

        /* ==========================================
           HTML DYNAMIC LIST RENDERER
           ========================================== */
        function renderApp() {
            const searchTerm = searchInput.value.toLowerCase();

            let filteredTasks = tasks.filter(task => {
                // Search term match logic
                const matchesSearch = task.title.toLowerCase().includes(searchTerm);
                
                // Calendar Date filter match logic
                let matchesDate = true;
                if (selectedFilterDate) {
                    if (task.date) {
                        matchesDate = task.date.substring(0, 10) === selectedFilterDate;
                    } else {
                        matchesDate = false; // Tasks without date are excluded when date-filter is on
                    }
                }

                // Tab selection filtration match logic
                if (currentFilter === 'active') {
                    return matchesSearch && matchesDate && !task.completed;
                } else if (currentFilter === 'completed') {
                    return matchesSearch && matchesDate && task.completed;
                }
                return matchesSearch && matchesDate;
            });

            // Write HTML Cards
            if (filteredTasks.length === 0) {
                taskListContainer.innerHTML = `
                    <div class="text-center py-10 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 transition-all">
                        <div class="w-12 h-12 bg-student-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-student-600 dark:text-student-200">
                            <i class="fa-regular fa-folder-open text-lg"></i>
                        </div>
                        <div>
                            <h3 class="text-xs font-bold text-slate-700 dark:text-slate-300">No student tasks found</h3>
                            <p class="text-[10px] text-slate-400 mt-1">Try changing filters or add a new school task!</p>
                        </div>
                    </div>
                `;
            } else {
                taskListContainer.innerHTML = filteredTasks.map(task => {
                    let dueDateHtml = '';
                    let overdueAlert = false;

                    if (task.date) {
                        const dateObj = new Date(task.date);
                        overdueAlert = !task.completed && (dateObj < new Date());
                        const formattedDate = dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + ' at ' + dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
                        
                        dueDateHtml = `
                            <span class="due-date-meta flex items-center gap-1.5 text-[10px] font-semibold ${overdueAlert ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-slate-500'}">
                                <i class="fa-regular fa-calendar-days text-xs"></i> 
                                ${overdueAlert ? 'Overdue: ' : 'Due: '} ${formattedDate}
                            </span>
                        `;
                    }

                    // Priority color configuration classes
                    let priorityClass = '';
                    if (task.priority === 'high') priorityClass = 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
                    else if (task.priority === 'medium') priorityClass = 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
                    else priorityClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';

                    // Card accent border configurations
                    let cardBorderClass = 'border-l-4';
                    if (task.priority === 'high') cardBorderClass += ' border-l-rose-500';
                    else if (task.priority === 'medium') cardBorderClass += ' border-l-amber-500';
                    else cardBorderClass += ' border-l-emerald-500';

                    return `
                        <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-3 transition-all relative overflow-hidden ${cardBorderClass} ${task.completed ? 'opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md'}">
                            <!-- Tap checkbox -->
                            <div class="flex items-center cursor-pointer mt-1 select-none" onclick="toggleTaskComplete('${task.id}')">
                                <div class="w-5.5 h-5.5 rounded-lg border-2 ${task.completed ? 'bg-student-600 border-student-600' : 'border-slate-300 dark:border-slate-600 bg-transparent'} flex items-center justify-center transition-all duration-150">
                                    <i class="fa-solid fa-check text-white text-[10px] transition-opacity duration-150 ${task.completed ? 'opacity-100' : 'opacity-0'}"></i>
                                </div>
                            </div>
                            
                            <!-- Middle descriptive body text -->
                            <div class="flex-grow min-w-0">
                                <h4 class="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100 break-words cursor-pointer ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}" onclick="toggleTaskComplete('${task.id}')">
                                    ${escapeHTML(task.title)}
                                </h4>
                                <div class="flex flex-wrap gap-2 mt-2.5 items-center">
                                    <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-student-50/60 dark:bg-slate-800 text-student-600 dark:text-student-200 border border-student-100/50 dark:border-slate-700">${task.category}</span>
                                    <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${priorityClass}">${task.priority}</span>
                                    ${dueDateHtml}
                                </div>
                            </div>

                            <!-- Controls Trigger buttons (Optimized for target clearance) -->
                            <div class="flex gap-1">
                                <button class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-student-600 dark:hover:text-student-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer" onclick="populateEditForm('${task.id}')" aria-label="Edit Task">
                                    <i class="fa-solid fa-pen-to-square text-xs"></i>
                                </button>
                                <button class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer" onclick="promptDeleteTask('${task.id}')" aria-label="Delete Task">
                                    <i class="fa-solid fa-trash-can text-xs"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            calculateProgress();
        }

        // Sanitization script
        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            );
        }

        // Recalculates percent stats
        function calculateProgress() {
            // Only count goals assigned for selected date filter (if selected) to remain accurate
            let activeTasks = tasks;
            if (selectedFilterDate) {
                activeTasks = tasks.filter(t => t.date && t.date.substring(0, 10) === selectedFilterDate);
            }

            const total = activeTasks.length;
            const completed = activeTasks.filter(t => t.completed).length;
            const active = total - completed;

            // Update bottom filtration tab labels using ALL tasks to keep navigational clarity
            countAll.innerText = tasks.length;
            countActive.innerText = tasks.filter(t => !t.completed).length;
            countCompleted.innerText = tasks.filter(t => t.completed).length;

            let percentage = 0;
            if (total > 0) {
                percentage = Math.round((completed / total) * 100);
            }
            progressBar.style.width = percentage + '%';
            progressPercent.innerText = percentage + '%';
        }

        // Soft Custom alert toast launcher
        function showToast(message) {
            toastMsg.innerText = message;
            toast.classList.remove('translate-y-24');
            toast.classList.add('translate-y-0');
            setTimeout(() => {
                toast.classList.add('translate-y-24');
                toast.classList.remove('translate-y-0');
            }, 3000);
        }

        /* ==========================================
           LIGHT/DARK MODE SYSTEMS
           ========================================== */
        function initTheme() {
            const savedTheme = localStorage.getItem('academix_theme') || 'light';
            if (savedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            updateThemeIcon(savedTheme);
        }

        function toggleTheme() {
            const isDark = document.documentElement.classList.contains('dark');
            const newTheme = isDark ? 'light' : 'dark';
            
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            localStorage.setItem('academix_theme', newTheme);
            updateThemeIcon(newTheme);
        }

        function updateThemeIcon(theme) {
            if (theme === 'dark') {
                themeIcon.className = 'fa-solid fa-sun text-lg text-amber-400';
            } else {
                themeIcon.className = 'fa-solid fa-moon text-lg text-student-600';
            }
        }

        /* ==========================================
           EVENT REGISTER ENGINE
           ========================================== */
        // Core operations registration
        taskForm.addEventListener('submit', saveTask);
        searchInput.addEventListener('input', renderApp);

        // Filter tabs click registration
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('active', 'bg-student-50', 'text-student-600', 'border', 'border-student-100', 'dark:bg-slate-800', 'dark:border-slate-700', 'dark:text-student-200');
                    b.classList.add('bg-slate-50', 'text-slate-500', 'dark:bg-slate-950', 'dark:text-slate-400');
                });
                btn.classList.add('active', 'bg-student-50', 'text-student-600', 'border', 'border-student-100', 'dark:bg-slate-800', 'dark:border-slate-700', 'dark:text-student-200');
                btn.classList.remove('bg-slate-50', 'text-slate-500', 'dark:bg-slate-950', 'dark:text-slate-400');
                currentFilter = btn.dataset.filter;
                renderApp();
            });
        });

        // Custom numerical input validation listeners
        studyMinutesInput.addEventListener('change', () => {
            let val = parseInt(studyMinutesInput.value) || 25;
            val = Math.max(1, Math.min(180, val));
            studyMinutesInput.value = val;
            if (!isTimerRunning && activeTimerMode === 'study') {
                timerSeconds = val * 60;
                updateTimerUI();
            }
        });

        breakMinutesInput.addEventListener('change', () => {
            let val = parseInt(breakMinutesInput.value) || 5;
            val = Math.max(1, Math.min(60, val));
            breakMinutesInput.value = val;
            if (!isTimerRunning && activeTimerMode === 'break') {
                timerSeconds = val * 60;
                updateTimerUI();
            }
        });

        // Theme controllers
        themeToggleBtn.addEventListener('click', toggleTheme);

        // Native Calendar Picker change event
        calendarPicker.addEventListener('change', (e) => {
            if (e.target.value) {
                selectCalendarDate(e.target.value);
            }
        });

        // Reset and clear buttons
        resetDateFilterBtn.addEventListener('click', clearCalendarFilter);
        clearCalendarFilterBtn.addEventListener('click', clearCalendarFilter);

        // Clock operations
        timerStartBtn.addEventListener('click', toggleTimer);
        timerResetBtn.addEventListener('click', resetTimer);

        // Popups
        modalCancelBtn.addEventListener('click', closeDeleteModal);
        modalConfirmBtn.addEventListener('click', executeDeleteTask);

        // Close on overlay backdrop tap
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                closeDeleteModal();
            }
        });

        // Start initialization on window loaded
        window.onload = function() {
            updateHeaderDate();
            initTheme();
            loadTasks();
            loadNewQuote();
            generateCalendarStrip(new Date());
            
            // Set starting countdown to current customizable focus duration value
            const startingStudyMins = parseInt(studyMinutesInput.value) || 25;
            timerSeconds = startingStudyMins * 60;
            
            updateTimerUI();
            renderApp();
        };