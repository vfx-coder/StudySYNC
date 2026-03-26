// ============= DATA STORAGE =============
let subjects = [];
let studyHours = 0;
let lastCheckDate = null;

// ============= DATE FUNCTIONS =============
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function updateDateDisplay() {
    const today = getCurrentDate();
    document.getElementById('dateInfo').innerHTML = `
        📅 Today's Date: ${formatDate(today)}
        ${lastCheckDate !== today ? '<span class="warning"> ⚠️ New day detected! Days will update automatically.</span>' : ''}
    `;
}

// ============= CHECK FOR NEW DAY =============
function checkForNewDay() {
    const today = getCurrentDate();
    
    if (lastCheckDate !== today && lastCheckDate !== null) {
        // New day detected - decrease days left for all incomplete subjects
        let daysChanged = false;
        subjects.forEach(subject => {
            if (subject.daysLeft > 0 && subject.completion < 100) {
                const oldDays = subject.daysLeft;
                subject.daysLeft--;
                daysChanged = true;
                console.log(`${subject.name}: ${oldDays} → ${subject.daysLeft} days left`);
            }
        });
        
        if (daysChanged) {
            saveData();
            showNotification('📅 New day! Days left updated automatically.', 'warning');
            updateSubjectList();
        }
        
        lastCheckDate = today;
        localStorage.setItem('studysync_lastcheck', today);
    } else if (lastCheckDate === null) {
        lastCheckDate = today;
        localStorage.setItem('studysync_lastcheck', today);
    }
    
    updateDateDisplay();
}

// ============= DATA SAVE/LOAD =============
function saveData() {
    const data = {
        subjects: subjects,
        lastCheckDate: lastCheckDate
    };
    localStorage.setItem('studysync_data', JSON.stringify(data));
    console.log('✅ Data saved');
}

function loadData() {
    const saved = localStorage.getItem('studysync_data');
    if (saved) {
        const data = JSON.parse(saved);
        subjects = data.subjects || [];
        lastCheckDate = data.lastCheckDate || null;
        console.log('📂 Data loaded');
    } else {
        subjects = [];
        lastCheckDate = null;
        console.log('📂 No saved data found');
    }
    
    // Check for new day after loading
    checkForNewDay();
    updateSubjectList();
}

function resetAllData() {
    if (confirm('⚠️ This will delete ALL subjects and progress! Are you sure?')) {
        localStorage.removeItem('studysync_data');
        localStorage.removeItem('studysync_lastcheck');
        localStorage.removeItem('studysync_routine');
        subjects = [];
        lastCheckDate = null;
        saveData();
        updateSubjectList();
        loadDailyChecklist();
        document.getElementById('studyPlan').innerHTML = '';
        document.getElementById('studyHoursDisplay').innerHTML = '';
        document.getElementById('checkStatus').innerHTML = '';
        updateDateDisplay();
        showNotification('All data reset!', 'success');
    }
}

// ============= THEME =============
function toggleTheme() {
    document.body.classList.toggle('dark');
    const btn = document.querySelector('.theme-btn');
    if (document.body.classList.contains('dark')) {
        btn.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        btn.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('.theme-btn').textContent = '☀️ Light Mode';
    }
}

// ============= ROUTINE FUNCTIONS =============
function saveRoutineValues() {
    const routine = {
        collegeStart: document.getElementById('collegeStart').value,
        collegeEnd: document.getElementById('collegeEnd').value,
        chillTime: document.getElementById('chillTime').value,
        sleepTime: document.getElementById('sleepTime').value,
        studyHours: studyHours
    };
    localStorage.setItem('studysync_routine', JSON.stringify(routine));
}

function loadRoutineValues() {
    const savedRoutine = localStorage.getItem('studysync_routine');
    if (savedRoutine) {
        const routine = JSON.parse(savedRoutine);
        if (routine.collegeStart) document.getElementById('collegeStart').value = routine.collegeStart;
        if (routine.collegeEnd) document.getElementById('collegeEnd').value = routine.collegeEnd;
        if (routine.chillTime) document.getElementById('chillTime').value = routine.chillTime;
        if (routine.sleepTime) document.getElementById('sleepTime').value = routine.sleepTime;
        if (routine.studyHours) studyHours = routine.studyHours;
        updateStudyHoursDisplay();
    }
}

function calculateStudyHours() {
    const start = parseInt(document.getElementById('collegeStart').value);
    const end = parseInt(document.getElementById('collegeEnd').value);
    const chill = parseInt(document.getElementById('chillTime').value);
    const sleep = parseInt(document.getElementById('sleepTime').value);

    if (isNaN(start) || isNaN(end) || isNaN(chill) || isNaN(sleep)) {
        alert('Please fill all routine fields');
        return;
    }

    let collegeHours = end - start;
    if (collegeHours < 0) collegeHours += 24;

    studyHours = 24 - collegeHours - chill - sleep;
    
    saveRoutineValues();
    updateStudyHoursDisplay();
}

function updateStudyHoursDisplay() {
    const display = document.getElementById('studyHoursDisplay');
    if (studyHours <= 0) {
        display.innerHTML = '<span class="warning">⚠️ No study hours available! Adjust your routine.</span>';
    } else {
        display.innerHTML = `<strong>✅ Available Study Hours: ${studyHours} hours/day</strong>`;
    }
}

// ============= SUBJECT FUNCTIONS =============
function addSubject() {
    const name = document.getElementById('subjectName').value.trim();
    const difficulty = parseInt(document.getElementById('difficulty').value);
    const completion = parseInt(document.getElementById('completion').value);
    const daysLeft = parseInt(document.getElementById('daysLeft').value);

    if (!name) {
        alert('Please enter subject name');
        return;
    }
    
    if (isNaN(daysLeft) || daysLeft <= 0) {
        alert('Please enter valid days left for exam');
        return;
    }

    if (isNaN(completion) || completion < 0 || completion > 100) {
        alert('Please enter valid completion percentage (0-100)');
        return;
    }

    subjects.push({
        id: Date.now(),
        name: name,
        difficulty: difficulty,
        completion: completion,
        daysLeft: daysLeft,
        lastUpdated: getCurrentDate()
    });

    saveData();
    updateSubjectList();
    loadDailyChecklist();
    
    document.getElementById('subjectName').value = '';
    document.getElementById('completion').value = '0';
    document.getElementById('daysLeft').value = '';
    
    showNotification('Subject added successfully!', 'success');
}

function deleteSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        subjects = subjects.filter(s => s.id !== id);
        saveData();
        updateSubjectList();
        loadDailyChecklist();
        showNotification('Subject deleted!', 'success');
    }
}

function updateSubjectList() {
    const container = document.getElementById('subjectList');
    
    if (subjects.length === 0) {
        container.innerHTML = '<p>No subjects added yet</p>';
        return;
    }
    
    container.innerHTML = subjects.map(sub => `
        <div class="subject-item">
            <div>
                <strong>${sub.name}</strong><br>
                <small>⭐ Difficulty: ${sub.difficulty}/5 | 📊 ${sub.completion}% | 📅 ${sub.daysLeft} days left</small>
            </div>
            <button class="delete-btn" onclick="deleteSubject(${sub.id})">Delete</button>
        </div>
    `).join('');
}

// ============= DAILY CHECKLIST =============
function loadDailyChecklist() {
    const container = document.getElementById('dailyChecklist');
    const activeSubjects = subjects.filter(s => s.completion < 100 && s.daysLeft > 0);
    
    if (activeSubjects.length === 0) {
        container.innerHTML = '<p>🎉 All subjects completed! Great job!</p>';
        return;
    }
    
    container.innerHTML = `
        <h4>📝 Did you study these subjects today?</h4>
        ${activeSubjects.map(sub => `
            <div class="checklist-item">
                <input type="checkbox" id="check_${sub.id}" value="${sub.id}">
                <label for="check_${sub.id}">
                    <strong>${sub.name}</strong><br>
                    Current: ${sub.completion}% | Days Left: ${sub.daysLeft}
                </label>
            </div>
        `).join('')}
        <small style="color: var(--warning); margin-top: 10px; display: block;">
            ⚠️ If you don't study, days will decrease but progress won't increase!
        </small>
    `;
}

function submitDailyCheck() {
    const checkboxes = document.querySelectorAll('#dailyChecklist input[type="checkbox"]');
    const studiedIds = [];
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            studiedIds.push(parseInt(cb.value));
        }
    });
    
    // Update subjects based on what was studied
    let updated = false;
    subjects.forEach(subject => {
        if (studiedIds.includes(subject.id)) {
            const oldCompletion = subject.completion;
            subject.completion = Math.min(100, subject.completion + 20); // 2 hours = 20%
            if (oldCompletion !== subject.completion) {
                updated = true;
                console.log(`${subject.name}: ${oldCompletion}% → ${subject.completion}%`);
            }
        }
        subject.lastUpdated = getCurrentDate();
    });
    
    if (updated) {
        saveData();
        updateSubjectList();
        showNotification('Progress updated!', 'success');
    } else if (studiedIds.length === 0 && subjects.length > 0) {
        showNotification('No subjects marked as studied. Days will still decrease tomorrow.', 'warning');
    }
    
    // Mark today's check as done
    const today = getCurrentDate();
    localStorage.setItem('studysync_lastcheck', today);
    lastCheckDate = today;
    
    document.getElementById('checkStatus').innerHTML = `
        <div class="alert alert-success">
            ✅ Check-in complete! Progress updated.
        </div>
    `;
    
    loadDailyChecklist();
    
    if (studyHours > 0) {
        generatePlan();
    }
    
    setTimeout(() => {
        document.getElementById('checkStatus').innerHTML = '';
    }, 3000);
}

// ============= PRIORITY CALCULATION =============
function calculatePriority(subject) {
    if (subject.daysLeft <= 0 || subject.completion >= 100) {
        return -1;
    }
    
    const remaining = 100 - subject.completion;
    const difficultyFactor = subject.difficulty * 15;
    const urgencyFactor = (remaining / Math.max(1, subject.daysLeft)) * 10;
    const completionFactor = remaining * 0.8;
    
    let priority = difficultyFactor + completionFactor + urgencyFactor;
    
    if (subject.daysLeft <= 3 && remaining > 0) {
        priority += 50;
    } else if (subject.daysLeft <= 7 && remaining > 0) {
        priority += 25;
    }
    
    return priority;
}

// ============= STUDY PLAN =============
function generatePlan() {
    if (studyHours <= 0) {
        alert('Please calculate study hours first!');
        return;
    }
    
    const activeSubjects = subjects.filter(s => s.completion < 100 && s.daysLeft > 0);
    
    if (activeSubjects.length === 0) {
        document.getElementById('studyPlan').innerHTML = '<div class="card"><h3>🎉 Congratulations!</h3><p>All subjects are completed!</p></div>';
        return;
    }
    
    // Calculate priorities
    activeSubjects.forEach(sub => {
        sub.priority = calculatePriority(sub);
    });
    
    // Sort by priority
    activeSubjects.sort((a, b) => b.priority - a.priority);
    
    // Distribute time proportionally
    let totalPriority = activeSubjects.reduce((sum, sub) => sum + sub.priority, 0);
    let remainingHours = studyHours;
    const allocation = [];
    
    for (let sub of activeSubjects) {
        if (remainingHours <= 0) break;
        
        let allocated = Math.floor((sub.priority / totalPriority) * studyHours);
        allocated = Math.max(1, Math.min(allocated, remainingHours));
        
        const hoursNeeded = Math.ceil((100 - sub.completion) / 10);
        allocated = Math.min(allocated, hoursNeeded);
        
        allocation.push({
            ...sub,
            allocatedHours: allocated
        });
        
        remainingHours -= allocated;
    }
    
    // Distribute remaining hours
    let index = 0;
    while (remainingHours > 0 && index < allocation.length * 2) {
        const sub = allocation[index % allocation.length];
        const hoursNeeded = Math.ceil((100 - sub.completion) / 10);
        if (sub.allocatedHours < hoursNeeded) {
            sub.allocatedHours++;
            remainingHours--;
        }
        index++;
    }
    
    displayPlan(allocation);
}

function displayPlan(allocation) {
    const container = document.getElementById('studyPlan');
    const totalAllocated = allocation.reduce((sum, sub) => sum + sub.allocatedHours, 0);
    
    if (allocation.length === 0) {
        container.innerHTML = '<p>No active subjects to study!</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="stats">
            <strong>📊 Total Study Time: ${totalAllocated} / ${studyHours} hours</strong>
        </div>
        ${allocation.map(sub => {
            const newCompletion = Math.min(100, sub.completion + sub.allocatedHours * 10);
            const remainingAfterToday = 100 - newCompletion;
            const daysNeededAfter = Math.ceil(remainingAfterToday / 10);
            
            return `
                <div class="plan-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong>📚 ${sub.name}</strong>
                        <span class="${getPriorityClass(sub.priority)}">${getPriorityLabel(sub.priority)}</span>
                    </div>
                    <div style="margin: 10px 0;">
                        ⏰ <strong>Study: ${sub.allocatedHours} hour${sub.allocatedHours !== 1 ? 's' : ''}</strong>
                    </div>
                    <div>Priority Score: ${sub.priority.toFixed(1)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${sub.completion}%"></div>
                    </div>
                    <div>Current: ${sub.completion}% → After Study: ${newCompletion}%</div>
                    ${sub.daysLeft > 0 ? `
                        <div>📅 ${sub.daysLeft} days left until exam</div>
                        ${newCompletion < 100 ? `
                            <div>⏳ Need ${daysNeededAfter} more ${daysNeededAfter === 1 ? 'day' : 'days'} to complete</div>
                            ${daysNeededAfter > sub.daysLeft ? '<div class="warning">⚠️ WARNING: Not enough days left!</div>' : ''}
                        ` : '<div class="success">✅ Will be completed today!</div>'}
                    ` : ''}
                </div>
            `;
        }).join('')}
        ${totalAllocated < studyHours ? `
            <div class="stats warning">
                ⚠️ ${studyHours - totalAllocated} hours unused (subjects near completion)
            </div>
        ` : ''}
    `;
}

// ============= HELPER FUNCTIONS =============
function getPriorityClass(priority) {
    if (priority >= 70) return 'priority-high';
    if (priority >= 40) return 'priority-medium';
    return 'priority-low';
}

function getPriorityLabel(priority) {
    if (priority >= 70) return '🔴 HIGH PRIORITY';
    if (priority >= 40) return '🟡 MEDIUM PRIORITY';
    return '🟢 LOW PRIORITY';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4caf50' : (type === 'warning' ? '#ffa500' : '#ff4d4d')};
        color: white;
        border-radius: 6px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// ============= INITIALIZATION =============
window.onload = () => {
    loadTheme();
    loadData();
    loadRoutineValues();
    loadDailyChecklist();
    updateDateDisplay();
    
    // Auto-calculate if routine values exist
    if (document.getElementById('collegeStart').value) {
        calculateStudyHours();
    }
};

// Add animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
