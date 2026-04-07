// ============= DATA STORAGE =============
let subjects = [];
let studyHours = 0;
let lastCheckDate = null;

// ============= DATE FUNCTIONS WITH FIX =============
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function updateDateDisplay() {
    const today = getCurrentDate();
    const formattedDate = formatDate(today);
    const hasGap = lastCheckDate && lastCheckDate !== today;
    document.getElementById('dateInfo').innerHTML = `
        <i class="fas fa-calendar-alt"></i> <strong>${formattedDate}</strong>
        ${hasGap ? '<span style="color: var(--warning); margin-left: 10px;"><i class="fas fa-exclamation-triangle"></i> ⚠️ New day detected! Days will update automatically.</span>' : ''}
    `;
}

// ============= CHECK FOR NEW DAY WITH FIX =============
function checkForNewDay() {
    const today = getCurrentDate();
    
    if (lastCheckDate && lastCheckDate !== today) {
        const daysPassed = daysBetween(lastCheckDate, today);
        let daysChanged = false;
        
        subjects.forEach(subject => {
            if (subject.daysLeft > 0 && subject.completion < 100) {
                const oldDays = subject.daysLeft;
                subject.daysLeft = Math.max(0, subject.daysLeft - daysPassed);
                if (oldDays !== subject.daysLeft) {
                    daysChanged = true;
                    console.log(`${subject.name}: ${oldDays} → ${subject.daysLeft} days left (${daysPassed} day(s) passed)`);
                }
            }
        });
        
        if (daysChanged) {
            saveData();
            showNotification(`📅 ${daysPassed} day(s) passed! Days left updated automatically.`, 'warning');
            updateSubjectList();
            loadDailyChecklist();
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
    
    checkForNewDay();
    updateSubjectList();
    loadDailyChecklist();
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
        showNotification('All data reset successfully!', 'success');
    }
}

// ============= THEME =============
function toggleTheme() {
    document.body.classList.toggle('dark');
    const btn = document.querySelector('.theme-btn');
    if (document.body.classList.contains('dark')) {
        btn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        localStorage.setItem('theme', 'dark');
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('.theme-btn').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
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
        showNotification('Please fill all routine fields!', 'warning');
        return;
    }

    let collegeHours = end - start;
    if (collegeHours < 0) collegeHours += 24;

    studyHours = 24 - collegeHours - chill - sleep;
    
    if (studyHours <= 0) {
        showNotification('⚠️ No study hours available! Adjust your routine.', 'warning');
    } else {
        showNotification(`✅ You have ${studyHours} hours to study today!`, 'success');
    }
    
    saveRoutineValues();
    updateStudyHoursDisplay();
}

function updateStudyHoursDisplay() {
    const display = document.getElementById('studyHoursDisplay');
    if (studyHours <= 0) {
        display.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span class="warning">⚠️ No study hours available! Adjust your routine.</span>';
    } else {
        display.innerHTML = `<i class="fas fa-check-circle"></i> <strong>✅ Available Study Hours: ${studyHours} hours/day</strong>`;
    }
}

// ============= SUBJECT FUNCTIONS =============
function addSubject() {
    const name = document.getElementById('subjectName').value.trim();
    const difficulty = parseInt(document.getElementById('difficulty').value);
    const completion = parseInt(document.getElementById('completion').value);
    const daysLeft = parseInt(document.getElementById('daysLeft').value);

    if (!name) {
        showNotification('Please enter subject name!', 'warning');
        return;
    }
    
    if (isNaN(daysLeft) || daysLeft <= 0) {
        showNotification('Please enter valid days left for exam!', 'warning');
        return;
    }

    if (isNaN(completion) || completion < 0 || completion > 100) {
        showNotification('Please enter valid completion percentage (0-100)!', 'warning');
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
    
    showNotification(`✅ "${name}" added successfully!`, 'success');
}

function deleteSubject(id) {
    const subject = subjects.find(s => s.id === id);
    if (confirm(`Are you sure you want to delete "${subject.name}"?`)) {
        subjects = subjects.filter(s => s.id !== id);
        saveData();
        updateSubjectList();
        loadDailyChecklist();
        showNotification(`🗑️ "${subject.name}" deleted!`, 'success');
    }
}

function updateSubjectList() {
    const container = document.getElementById('subjectList');
    
    if (subjects.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No subjects added yet. Add your first subject above!</p></div>';
        return;
    }
    
    container.innerHTML = subjects.map(sub => `
        <div class="subject-item">
            <div>
                <strong><i class="fas fa-book"></i> ${escapeHtml(sub.name)}</strong><br>
                <small>
                    <i class="fas fa-star"></i> Difficulty: ${'⭐'.repeat(sub.difficulty)} | 
                    <i class="fas fa-chart-line"></i> ${sub.completion}% | 
                    <i class="fas fa-hourglass-half"></i> ${sub.daysLeft} days left
                </small>
            </div>
            <button class="delete-btn" onclick="deleteSubject(${sub.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `).join('');
}

// ============= DAILY CHECKLIST =============
function loadDailyChecklist() {
    const container = document.getElementById('dailyChecklist');
    const activeSubjects = subjects.filter(s => s.completion < 100 && s.daysLeft > 0);
    
    if (activeSubjects.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>🎉 All subjects completed! Great job!</p></div>';
        return;
    }
    
    container.innerHTML = `
        <p><strong><i class="fas fa-question-circle"></i> Which subjects did you study today?</strong></p>
        ${activeSubjects.map(sub => `
            <div class="checklist-item">
                <input type="checkbox" id="check_${sub.id}" value="${sub.id}">
                <label for="check_${sub.id}">
                    <strong>${escapeHtml(sub.name)}</strong><br>
                    <small>📊 Current: ${sub.completion}% | 📅 Days Left: ${sub.daysLeft}</small>
                </label>
            </div>
        `).join('')}
        <small style="color: var(--warning); margin-top: 10px; display: block;">
            <i class="fas fa-info-circle"></i> ⚠️ If you don't study, days will decrease but progress won't increase!
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
    
    let updated = false;
    subjects.forEach(subject => {
        if (studiedIds.includes(subject.id)) {
            const oldCompletion = subject.completion;
            subject.completion = Math.min(100, subject.completion + 20);
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
        showNotification('Progress updated successfully! Keep going! 🎯', 'success');
    } else if (studiedIds.length === 0 && subjects.length > 0) {
        showNotification('No subjects marked as studied. Days will still decrease tomorrow.', 'warning');
    }
    
    const today = getCurrentDate();
    localStorage.setItem('studysync_lastcheck', today);
    lastCheckDate = today;
    
    document.getElementById('checkStatus').innerHTML = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> ✅ Check-in complete! Progress updated.
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

// ============= PRIORITY CALCULATION (IMPROVED) =============
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

// ============= STUDY PLAN (IMPROVED) =============
function generatePlan() {
    if (studyHours <= 0) {
        showNotification('Please calculate your study hours first!', 'warning');
        return;
    }
    
    const activeSubjects = subjects.filter(s => s.completion < 100 && s.daysLeft > 0);
    
    if (activeSubjects.length === 0) {
        document.getElementById('studyPlan').innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>🎉 Congratulations!</h3>
                    <p>All subjects are completed! Take a break or add new subjects.</p>
                </div>
            </div>
        `;
        return;
    }
    
    activeSubjects.forEach(sub => {
        sub.priority = calculatePriority(sub);
    });
    
    activeSubjects.sort((a, b) => b.priority - a.priority);
    
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
            <i class="fas fa-clock"></i> <strong>📊 Total Study Time: ${totalAllocated} / ${studyHours} hours</strong>
        </div>
        ${allocation.map((sub, idx) => {
            const newCompletion = Math.min(100, sub.completion + sub.allocatedHours * 10);
            const remainingAfterToday = 100 - newCompletion;
            const daysNeededAfter = Math.ceil(remainingAfterToday / 10);
            const delay = idx * 0.1;
            
            return `
                <div class="plan-card" style="animation-delay: ${delay}s">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong><i class="fas fa-book"></i> ${escapeHtml(sub.name)}</strong>
                        <span class="${getPriorityClass(sub.priority)}">${getPriorityLabel(sub.priority)}</span>
                    </div>
                    <div style="margin: 10px 0;">
                        <i class="fas fa-hourglass-half"></i> <strong>Study: ${sub.allocatedHours} hour${sub.allocatedHours !== 1 ? 's' : ''}</strong>
                    </div>
                    <div><i class="fas fa-chart-simple"></i> Priority Score: ${sub.priority.toFixed(1)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${sub.completion}%"></div>
                    </div>
                    <div><i class="fas fa-arrow-trend-up"></i> Current: ${sub.completion}% → After Study: ${newCompletion}%</div>
                    ${sub.daysLeft > 0 ? `
                        <div><i class="fas fa-calendar"></i> 📅 ${sub.daysLeft} days left until exam</div>
                        ${newCompletion < 100 ? `
                            <div><i class="fas fa-hourglass-start"></i> ⏳ Need ${daysNeededAfter} more ${daysNeededAfter === 1 ? 'day' : 'days'} to complete</div>
                            ${daysNeededAfter > sub.daysLeft ? '<div class="warning"><i class="fas fa-exclamation-triangle"></i> ⚠️ WARNING: Not enough days left!</div>' : ''}
                        ` : '<div class="success"><i class="fas fa-check-circle"></i> ✅ Will be completed today!</div>'}
                    ` : ''}
                </div>
            `;
        }).join('')}
        ${totalAllocated < studyHours ? `
            <div class="stats warning">
                <i class="fas fa-info-circle"></i> ⚠️ ${studyHours - totalAllocated} hours unused (subjects near completion)
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#48bb78' : (type === 'warning' ? '#ed8936' : '#f56565');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${bgColor};
        color: white;
        border-radius: 12px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle')}"></i> ${message}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============= INITIALIZATION =============
window.onload = () => {
    loadTheme();
    loadData();
    loadRoutineValues();
    loadDailyChecklist();
    updateDateDisplay();
    
    if (document.getElementById('collegeStart').value) {
        calculateStudyHours();
    }
};

// Add animations to style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
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
