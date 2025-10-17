// DOM Elements
        const themeToggle = document.getElementById('themeToggle');
        const taskInput = document.getElementById('taskInput');
        const dueDate = document.getElementById('dueDate');
        const priority = document.getElementById('priority');
        const category = document.getElementById('category');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskList = document.getElementById('taskList');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('searchInput');
        const taskCounter = document.getElementById('taskCounter');
        const clearCompletedBtn = document.getElementById('clearCompletedBtn');
        const exportPdfBtn = document.getElementById('exportPdfBtn');

        // Set minimum date to today
        dueDate.min = new Date().toISOString().split('T')[0];

        // State
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        let currentFilter = 'all';
        let searchQuery = '';

        // Initialize the app
        function init() {
            renderTasks();
            updateTaskCounter();
            
            // Set up event listeners
            addTaskBtn.addEventListener('click', addTask);
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') addTask();
            });
            
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFilter = btn.dataset.filter;
                    renderTasks();
                });
            });
            
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                renderTasks();
            });
            
            clearCompletedBtn.addEventListener('click', clearCompletedTasks);
            
            themeToggle.addEventListener('click', toggleTheme);
            
            // Check for saved theme preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }

        // Add a new task
        function addTask() {
            const text = taskInput.value.trim();
            if (!text) return;
            
            const newTask = {
                id: Date.now(),
                text: text,
                completed: false,
                dueDate: dueDate.value,
                priority: priority.value,
                category: category.value.trim(),
                createdAt: new Date().toISOString()
            };
            
            tasks.unshift(newTask);
            saveTasks();
            renderTasks();
            updateTaskCounter();
            
            // Reset input fields
            taskInput.value = '';
            dueDate.value = '';
            priority.value = 'low';
            category.value = '';
            
            // Focus back to task input
            taskInput.focus();
        }

        // Render tasks based on current filter and search
        function renderTasks() {
            let filteredTasks = tasks;
            
            // Apply filter
            if (currentFilter === 'active') {
                filteredTasks = filteredTasks.filter(task => !task.completed);
            } else if (currentFilter === 'completed') {
                filteredTasks = filteredTasks.filter(task => task.completed);
            }
            
            // Apply search
            if (searchQuery) {
                filteredTasks = filteredTasks.filter(task => 
                    task.text.toLowerCase().includes(searchQuery) || 
                    (task.category && task.category.toLowerCase().includes(searchQuery))
                );
            }
            
            // Render tasks or empty state
            if (filteredTasks.length === 0) {
                taskList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No tasks found</h3>
                        <p>${searchQuery || currentFilter !== 'all' ? 'Try changing your search or filter' : 'Add a new task to get started'}</p>
                    </div>
                `;
                return;
            }
            
            taskList.innerHTML = filteredTasks.map(task => `
                <div class="task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-content">
                        <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                        <div class="task-meta">
                            ${task.dueDate ? `<span><i class="far fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ''}
                            ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners to task elements
            document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', toggleTaskCompletion);
            });
            
            document.querySelectorAll('.task-text').forEach(taskText => {
                taskText.addEventListener('click', enableTaskEditing);
            });
            
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const taskItem = btn.closest('.task-item');
                    const taskText = taskItem.querySelector('.task-text');
                    enableTaskEditing({ target: taskText });
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', deleteTask);
            });
        }

        // Toggle task completion status
        function toggleTaskCompletion(e) {
            const taskId = parseInt(e.target.closest('.task-item').dataset.id);
            const task = tasks.find(t => t.id === taskId);
            task.completed = e.target.checked;
            saveTasks();
            renderTasks();
            updateTaskCounter();
        }

        // Enable editing for a task
        function enableTaskEditing(e) {
            const taskText = e.target;
            const taskItem = taskText.closest('.task-item');
            const taskId = parseInt(taskItem.dataset.id);
            const task = tasks.find(t => t.id === taskId);
            
            // Create input field
            const input = document.createElement('input');
            input.type = 'text';
            input.value = task.text;
            input.classList.add('task-text', 'editing');
            
            // Replace text with input
            taskText.replaceWith(input);
            input.focus();
            input.select();
            
            // Save on Enter or blur
            const saveEdit = () => {
                const newText = input.value.trim();
                if (newText && newText !== task.text) {
                    task.text = newText;
                    saveTasks();
                }
                renderTasks();
            };
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            });
            
            input.addEventListener('blur', saveEdit);
        }

        // Delete a task
        function deleteTask(e) {
            const taskId = parseInt(e.target.closest('.task-item').dataset.id);
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            updateTaskCounter();
        }

        // Clear all completed tasks
        function clearCompletedTasks() {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
            updateTaskCounter();
        }

        // Update task counter
        function updateTaskCounter() {
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.completed).length;
            taskCounter.textContent = `${completedTasks} of ${totalTasks} tasks completed`;
        }

        // Toggle dark/light mode
        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            
            if (document.body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                localStorage.setItem('darkMode', null);
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }

        // Save tasks to localStorage
        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        // Format date for display
        function formatDate(dateString) {
            const options = { month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }

        // Initialize the application
        init();
function exportTasksToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("📋 Todo List", 14, 20);

    // Add generation date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 14, 28);

    // Table headers
    const headers = ["#", "Task", "Status", "Due Date", "Priority", "Category"];
    const colWidths = [10, 70, 30, 30, 20, 30];
    let startY = 35;

    // Draw headers
    doc.setFont(undefined, 'bold');
    let x = 14;
    headers.forEach((header, i) => {
        doc.text(header, x, startY);
        x += colWidths[i];
    });

    // Draw tasks
    doc.setFont(undefined, 'normal');
    let y = startY + 7;
    tasks.forEach((task, index) => {
        const status = task.completed ? "✔ Completed" : "❌ Pending";
        const due = task.dueDate ? formatDate(task.dueDate) : "No due date";
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const categoryText = task.category ? task.category : "None";

        let x = 14;
        const row = [
            (index + 1).toString(),
            task.text,
            status,
            due,
            priorityText,
            categoryText
        ];

        row.forEach((cell, i) => {
            // Wrap text if too long
            const textLines = doc.splitTextToSize(cell, colWidths[i] - 2);
            doc.text(textLines, x, y);
            x += colWidths[i];
        });

        y += 7 * Math.max(1, doc.splitTextToSize(task.text, colWidths[1] - 2).length);

        // Page break
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save(`Todo_List_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Add event listener
exportPdfBtn.addEventListener('click', exportTasksToPDF);
