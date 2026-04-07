#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <fstream>
#include <ctime>
#include <sstream>
#include <chrono>
using namespace std;

struct Subject {
    string name;
    int difficulty;
    int daysLeft;
    int completion;
    double priority;
    int allocatedTime;
    string lastUpdated;
};

// ---------- Get current date as string ----------
string getCurrentDate() {
    time_t now = time(0);
    tm* ltm = localtime(&now);
    stringstream ss;
    ss << 1900 + ltm->tm_year << "-"
       << setw(2) << setfill('0') << 1 + ltm->tm_mon << "-"
       << setw(2) << setfill('0') << ltm->tm_mday;
    return ss.str();
}

// ---------- Calculate days between two dates ----------
int daysBetween(string date1, string date2) {
    tm tm1 = {}, tm2 = {};
    stringstream ss1(date1), ss2(date2);
    string year, month, day;
    
    getline(ss1, year, '-');
    getline(ss1, month, '-');
    getline(ss1, day, '-');
    tm1.tm_year = stoi(year) - 1900;
    tm1.tm_mon = stoi(month) - 1;
    tm1.tm_mday = stoi(day);
    
    getline(ss2, year, '-');
    getline(ss2, month, '-');
    getline(ss2, day, '-');
    tm2.tm_year = stoi(year) - 1900;
    tm2.tm_mon = stoi(month) - 1;
    tm2.tm_mday = stoi(day);
    
    time_t time1 = mktime(&tm1);
    time_t time2 = mktime(&tm2);
    
    return abs(difftime(time2, time1) / (60 * 60 * 24));
}

// ---------- Save data to file ----------
void saveData(vector<Subject>& data, const string& filename = "studysync_data.txt") {
    ofstream file(filename);
    if (file.is_open()) {
        file << data.size() << "\n";
        for (auto& s : data) {
            file << s.name << "\n"
                 << s.difficulty << "\n"
                 << s.daysLeft << "\n"
                 << s.completion << "\n"
                 << s.lastUpdated << "\n";
        }
        file.close();
        cout << "✅ Data saved successfully!\n";
    }
}

// ---------- Load data from file ----------
void loadData(vector<Subject>& data, const string& filename = "studysync_data.txt") {
    ifstream file(filename);
    if (file.is_open()) {
        int n;
        file >> n;
        file.ignore();
        
        data.clear();
        for (int i = 0; i < n; i++) {
            Subject s;
            getline(file, s.name);
            file >> s.difficulty;
            file >> s.daysLeft;
            file >> s.completion;
            file.ignore();
            getline(file, s.lastUpdated);
            
            s.allocatedTime = 0;
            s.priority = 0;
            data.push_back(s);
        }
        file.close();
        cout << "📂 Data loaded successfully!\n";
    }
}

// ---------- Update days based on date (FIXED) ----------
void updateDaysBasedOnDate(vector<Subject>& data) {
    string currentDate = getCurrentDate();
    bool daysChanged = false;
    
    for (auto& s : data) {
        if (s.lastUpdated != currentDate && s.daysLeft > 0 && s.completion < 100) {
            int daysPassed = daysBetween(s.lastUpdated, currentDate);
            if (daysPassed > 0) {
                int oldDays = s.daysLeft;
                s.daysLeft = max(0, s.daysLeft - daysPassed);
                s.lastUpdated = currentDate;
                daysChanged = true;
                
                cout << "  📅 " << s.name << ": " << oldDays << " → " << s.daysLeft << " days left (" << daysPassed << " day(s) passed)";
                if (s.daysLeft <= 0) {
                    cout << " ⚠️ EXAM TOMORROW!";
                }
                cout << endl;
            }
        }
    }
    
    if (daysChanged) {
        saveData(data);
        cout << "\n✅ Days updated for new day!\n";
    }
}

// ---------- Delete subject (NEW FEATURE) ----------
void deleteSubject(vector<Subject>& data) {
    if (data.empty()) {
        cout << "No subjects to delete.\n";
        return;
    }
    
    cout << "\nSubjects:\n";
    for (size_t i = 0; i < data.size(); i++) {
        cout << "  " << i + 1 << ". " << data[i].name << endl;
    }
    
    int index;
    cout << "Enter subject number to delete (0 to cancel): ";
    cin >> index;
    
    if (index > 0 && index <= data.size()) {
        cout << "Deleted: " << data[index - 1].name << endl;
        data.erase(data.begin() + index - 1);
        saveData(data);
    }
}

// ---------- Edit subject (NEW FEATURE) ----------
void editSubject(vector<Subject>& data) {
    if (data.empty()) {
        cout << "No subjects to edit.\n";
        return;
    }
    
    cout << "\nSubjects:\n";
    for (size_t i = 0; i < data.size(); i++) {
        cout << "  " << i + 1 << ". " << data[i].name 
             << " (Progress: " << data[i].completion << "%, Days: " << data[i].daysLeft << ")\n";
    }
    
    int index;
    cout << "Enter subject number to edit (0 to cancel): ";
    cin >> index;
    
    if (index > 0 && index <= data.size()) {
        Subject& s = data[index - 1];
        cout << "\nEditing: " << s.name << endl;
        cout << "New name (current: " << s.name << "): ";
        cin.ignore();
        getline(cin, s.name);
        
        cout << "New difficulty 1-5 (current: " << s.difficulty << "): ";
        cin >> s.difficulty;
        
        cout << "New completion % (current: " << s.completion << "): ";
        cin >> s.completion;
        
        cout << "New days left (current: " << s.daysLeft << "): ";
        cin >> s.daysLeft;
        
        saveData(data);
        cout << "✅ Subject updated!\n";
    }
}

// ---------- Difficulty Label ----------
string difficultyLabel(int d) {
    if (d <= 2) return "Easy";
    if (d == 3) return "Medium";
    return "Hard";
}

// ---------- Sort by priority ----------
bool comparePriority(const Subject &a, const Subject &b) {
    return a.priority > b.priority;
}

// ---------- Calculate priority ----------
double calculatePriority(const Subject &s) {
    if (s.daysLeft <= 0 || s.completion >= 100) {
        return -1;
    }
    
    double remaining = 100 - s.completion;
    double difficultyFactor = s.difficulty * 15.0;
    double completionFactor = remaining * 0.8;
    
    double priority = difficultyFactor + completionFactor;
    
    if (s.daysLeft > 0) {
        double urgencyFactor = (remaining / max(1, s.daysLeft)) * 10;
        priority += urgencyFactor;
        
        if (s.daysLeft <= 3 && remaining > 0) {
            priority += 50;
        } else if (s.daysLeft <= 7 && remaining > 0) {
            priority += 25;
        }
    }
    
    return max(0.0, priority);
}

// ---------- Display subject list ----------
void displaySubjects(const vector<Subject>& data) {
    cout << "\n📋 Current Subjects:\n";
    cout << string(60, '-') << "\n";
    for (auto& s : data) {
        cout << "  " << s.name << " | Difficulty: " << s.difficulty << "/5"
             << " | Progress: " << s.completion << "%"
             << " | Days left: " << s.daysLeft;
        if (s.completion >= 100) {
            cout << " ✅ COMPLETED";
        } else if (s.daysLeft <= 0) {
            cout << " ⚠️ EXAM TODAY!";
        }
        cout << endl;
    }
    cout << string(60, '-') << "\n";
}

// ---------- Main function ----------
int main() {
    int choice;
    
    cout << "===== Welcome to StudySync (Exam Mode) =====\n";
    cout << "🎯 Smart Study Planner with Priority System\n\n";
    cout << "1. Start New Session\n";
    cout << "2. Load Previous Session\n";
    cout << "3. Manage Subjects (Edit/Delete)\n";
    cout << "Enter choice: ";
    cin >> choice;
    
    vector<Subject> data;
    
    if (choice == 2 || choice == 3) {
        loadData(data);
        if (data.empty()) {
            cout << "No saved data found. Starting new session...\n";
            choice = 1;
        } else {
            cout << "\n📅 Current Date: " << getCurrentDate() << "\n";
            cout << "Checking for date changes...\n";
            updateDaysBasedOnDate(data);
            displaySubjects(data);
            
            if (choice == 3) {
                int manageChoice;
                cout << "\n1. Delete Subject\n2. Edit Subject\nEnter choice: ";
                cin >> manageChoice;
                if (manageChoice == 1) deleteSubject(data);
                else if (manageChoice == 2) editSubject(data);
                else cout << "Invalid choice\n";
            }
        }
    }
    
    if (choice == 1 || data.empty()) {
        // ===== DAILY ROUTINE =====
        int collegeStart, collegeEnd, chillTime, sleepTime;
        
        cout << "\n--- Daily Routine Setup ---\n";
        cout << "College start hour (0-23): ";
        cin >> collegeStart;
        cout << "College end hour (0-23): ";
        cin >> collegeEnd;
        cout << "Daily chill/personal time (hours): ";
        cin >> chillTime;
        cout << "Daily sleep time (hours): ";
        cin >> sleepTime;

        int collegeHours = collegeEnd - collegeStart;
        if (collegeHours < 0) collegeHours += 24;

        int totalStudyHours = 24 - collegeHours - chillTime - sleepTime;

        if (totalStudyHours <= 0) {
            cout << "\n❌ No available study hours! Adjust chill/sleep time.\n";
            return 0;
        }

        cout << "\n✅ Available Study Hours per Day: " << totalStudyHours << " hrs\n";
        
        // ===== SUBJECT INPUT =====
        int n;
        cout << "\nEnter number of subjects: ";
        cin >> n;

        data.resize(n);
        string currentDate = getCurrentDate();

        for (int i = 0; i < n; i++) {
            cout << "\n--- Subject " << i + 1 << " ---\n";
            cout << "Name: ";
            cin >> data[i].name;
            cout << "Difficulty (1-5, 5=Hardest): ";
            cin >> data[i].difficulty;
            cout << "Current Completion % (0-100): ";
            cin >> data[i].completion;
            cout << "Days left for exam: ";
            cin >> data[i].daysLeft;
            
            data[i].allocatedTime = 0;
            data[i].priority = 0;
            data[i].lastUpdated = currentDate;
            
            if (data[i].completion < 0) data[i].completion = 0;
            if (data[i].completion > 100) data[i].completion = 100;
            if (data[i].daysLeft < 0) data[i].daysLeft = 0;
        }
        
        saveData(data);
    }
    
    // ===== Get study hours for current session =====
    int collegeStart2, collegeEnd2, chillTime2, sleepTime2;
    cout << "\n--- Enter Today's Routine ---\n";
    cout << "College start hour (0-23): ";
    cin >> collegeStart2;
    cout << "College end hour (0-23): ";
    cin >> collegeEnd2;
    cout << "Daily chill/personal time (hours): ";
    cin >> chillTime2;
    cout << "Daily sleep time (hours): ";
    cin >> sleepTime2;
    
    int collegeHours2 = collegeEnd2 - collegeStart2;
    if (collegeHours2 < 0) collegeHours2 += 24;
    int totalStudyHours = 24 - collegeHours2 - chillTime2 - sleepTime2;
    
    if (totalStudyHours <= 0) {
        cout << "\n❌ No study hours available!\n";
        return 0;
    }
    
    cout << "\n✅ Today's Study Hours: " << totalStudyHours << " hrs\n";
    
    // ===== DAILY CHECK-IN =====
    cout << "\n" << string(50, '=') << "\n";
    cout << "📝 DAILY CHECK-IN\n";
    cout << string(50, '=') << "\n";
    
    vector<int> studiedIndices;
    for (size_t i = 0; i < data.size(); i++) {
        if (data[i].completion < 100 && data[i].daysLeft > 0) {
            char studied;
            cout << "Did you study " << data[i].name << " today? (y/n): ";
            cin >> studied;
            if (studied == 'y' || studied == 'Y') {
                studiedIndices.push_back(i);
            }
        }
    }
    
    for (int idx : studiedIndices) {
        int oldCompletion = data[idx].completion;
        data[idx].completion += 20;
        if (data[idx].completion > 100) data[idx].completion = 100;
        cout << "\n✅ " << data[idx].name << ": " << oldCompletion << "% → " << data[idx].completion << "%\n";
    }
    
    string today = getCurrentDate();
    for (auto& s : data) {
        s.lastUpdated = today;
    }
    
    saveData(data);
    
    // ===== GENERATE STUDY PLAN =====
    cout << "\n" << string(50, '=') << "\n";
    cout << "📚 TODAY'S SMART STUDY PLAN\n";
    cout << string(50, '=') << "\n";
    
    for (auto& s : data) {
        s.priority = calculatePriority(s);
        s.allocatedTime = 0;
    }
    
    sort(data.begin(), data.end(), comparePriority);
    
    cout << "\n🎯 Priority Order:\n";
    for (auto& s : data) {
        if (s.priority >= 0 && s.completion < 100) {
            cout << "  " << s.name << " → Score: " << fixed << setprecision(1) << s.priority;
            cout << " | Need: " << (100 - s.completion) << "%";
            cout << " | Days: " << s.daysLeft;
            cout << endl;
        }
    }
    
    int remainingHours = totalStudyHours;
    vector<Subject*> activeSubjects;
    double totalPriority = 0;
    
    for (auto& s : data) {
        if (s.priority >= 0 && s.completion < 100 && s.daysLeft > 0) {
            totalPriority += s.priority;
            activeSubjects.push_back(&s);
        }
    }
    
    if (totalPriority > 0 && !activeSubjects.empty()) {
        for (auto* s : activeSubjects) {
            if (remainingHours <= 0) break;
            
            double proportion = s->priority / totalPriority;
            int allocated = max(1, (int)(proportion * totalStudyHours));
            int hoursNeeded = (100 - s->completion + 9) / 10;
            allocated = min(allocated, hoursNeeded);
            allocated = min(allocated, remainingHours);
            
            s->allocatedTime = allocated;
            remainingHours -= allocated;
        }
    }
    
    if (remainingHours > 0 && !activeSubjects.empty()) {
        int index = 0;
        while (remainingHours > 0 && index < (int)activeSubjects.size() * 2) {
            Subject* s = activeSubjects[index % activeSubjects.size()];
            int hoursNeeded = (100 - s->completion + 9) / 10;
            if (s->allocatedTime < hoursNeeded) {
                s->allocatedTime++;
                remainingHours--;
            }
            index++;
        }
    }
    
    cout << "\n📖 YOUR STUDY PLAN:\n";
    int totalAllocated = 0;
    
    for (auto& s : data) {
        if (s.allocatedTime > 0) {
            int oldCompletion = s.completion;
            int newCompletion = min(100, s.completion + s.allocatedTime * 10);
            int remainingAfterToday = 100 - newCompletion;
            int daysNeededAfter = (remainingAfterToday + 9) / 10;
            
            cout << "\n  📚 " << s.name << "\n";
            cout << "     ⏰ Study: " << s.allocatedTime << " hour(s)\n";
            cout << "     Priority Score: " << fixed << setprecision(1) << s.priority << "\n";
            cout << "     📈 Progress: " << oldCompletion << "% → " << newCompletion << "%\n";
            
            if (s.daysLeft > 0) {
                cout << "     📅 " << s.daysLeft << " days left\n";
                if (newCompletion < 100) {
                    cout << "     ⏳ Need " << daysNeededAfter << " more day(s)\n";
                    if (daysNeededAfter > s.daysLeft) {
                        cout << "     ⚠️  WARNING: Not enough days!\n";
                    }
                } else {
                    cout << "     ✅ Will complete today!\n";
                }
            }
            
            totalAllocated += s.allocatedTime;
        }
    }
    
    cout << "\n⏱️  Time Usage: " << totalAllocated << " / " << totalStudyHours << " hours\n";
    
    cout << "\n" << string(50, '=') << "\n";
    cout << "📊 FINAL STATUS\n";
    cout << string(50, '=') << "\n";
    
    for (auto& s : data) {
        cout << "  " << s.name << ": " << s.completion << "%";
        if (s.completion >= 100) {
            cout << " ✅ COMPLETED!";
        } else if (s.daysLeft <= 0) {
            cout << " ⚠️ EXAM DAY!";
        } else {
            cout << " | " << s.daysLeft << " days left";
            int daysNeeded = (100 - s.completion + 9) / 10;
            if (daysNeeded <= s.daysLeft) {
                cout << " | Can complete in " << daysNeeded << " days";
            } else {
                cout << " | ⚠️ Need " << daysNeeded << " days, only " << s.daysLeft << " left!";
            }
        }
        cout << endl;
    }
    
    saveData(data);
    
    cout << "\n💡 Next Steps:\n";
    cout << "  • Run the program again tomorrow for automatic day reduction\n";
    cout << "  • Data will be saved and loaded automatically\n";
    cout << "  • Use option 3 from main menu to edit/delete subjects\n";
    cout << "\n✨ Keep studying! Consistency is key! ✨\n";
    
    return 0;
}
