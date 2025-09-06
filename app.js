// Data management functions
function getTasks() {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
}
function saveTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
function addTask(task) {
    const tasks = getTasks();
    // Using a simple random ID generator for better uniqueness than Date.now()
    task.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    task.createdAt = new Date().toISOString();
    tasks.push(task);
    saveTasks(tasks);
    return task;
}
function updateTask(updatedTask) {
    const tasks = getTasks();
    const index = tasks.findIndex(task => task.id === updatedTask.id);
    if (index !== -1) {
        tasks[index] = {...tasks[index], ...updatedTask};
        saveTasks(tasks);
        return true;
    }
    return false;
}
function deleteTask(id) {
    const tasks = getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    saveTasks(filteredTasks);
    return filteredTasks.length !== tasks.length;
}
// UI rendering functions
function renderTaskList() {
    const tasks = getTasks();
    const container = document.getElementById('tasks-container');
    if (tasks.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No tasks yet. Add a new task to get started!</div>';
        return;
    }
    container.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-info">
                <h3>${task.title}</h3>
                <div class="task-meta">
                    <span><i class="far fa-calendar"></i> ${task.dueDate || 'No due date'}</span>
                    <span><i class="fas fa-tag"></i> ${task.status}</span>
                    <span><i class="fas fa-clock"></i> ${task.timeEstimate ? task.timeEstimate + 'h' : 'No estimate'}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="btn btn-secondary" onclick="editTask('${task.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteTaskHandler('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}
function renderKanbanBoard() {
    const tasks = getTasks();
    const statuses = ['To Do', 'In Progress', 'Review', 'Done'];
    const container = document.getElementById('kanban-container');

    const truncateText = (text, length) => {
        if (!text || text.length <= length) return text || '';
        return text.substring(0, length) + '...';
    };

    container.innerHTML = statuses.map(status => {
        const statusTasks = tasks.filter(task => task.status === status);
        return `
            <div class="kanban-column">
                <div class="column-header">
                    <div class="column-title">${status}</div>
                    <div class="task-count">${statusTasks.length}</div>
                </div>
                <div class="kanban-tasks" data-status="${status}">
                    ${statusTasks.map(task => `
                        <div class="kanban-task" draggable="true" data-task-id="${task.id}">
                            <div class="kanban-task-header">
                                <h4>${task.title}</h4>
                                <button class="btn btn-secondary btn-sm" onclick="editTask('${task.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                            <p class="kanban-task-description">${truncateText(task.description, 50)}</p>
                            <div class="kanban-task-footer">
                                <span class="task-due"><i class="far fa-calendar"></i> ${task.dueDate || 'No due date'}</span>
                                <span class="task-estimate"><i class="fas fa-clock"></i> ${task.timeEstimate ? task.timeEstimate + 'h' : 'N/A'}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    setupDragAndDrop();
}
function setupDragAndDrop() {
    const tasks = document.querySelectorAll('.kanban-task');
    const columns = document.querySelectorAll('.kanban-tasks');
    tasks.forEach(task => {
        task.addEventListener('dragstart', () => {
            task.classList.add('dragging');
        });
        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
        });
    });
    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                column.appendChild(draggable);
            } else {
                column.insertBefore(draggable, afterElement);
            }
        });
        column.addEventListener('drop', () => {
            const draggable = document.querySelector('.dragging');
            if (draggable) {
                const taskId = draggable.dataset.taskId;
                const newStatus = column.dataset.status;
                const tasks = getTasks();
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex].status = newStatus;
                    saveTasks(tasks);
                    renderKanbanBoard(); // Re-render the board to reflect changes
                }
            }
        });
    });
}
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-task:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function openModal() {
    document.getElementById('task-modal').classList.add('active');
    const dueDateInput = document.getElementById('due-date');
    if (!document.getElementById('task-id').value) {
        const today = new Date();
        const nextSunday = new Date(today.setDate(today.getDate() + (7 - today.getDay()) % 7));
        dueDateInput.value = nextSunday.toISOString().split('T')[0];
    }
}
function closeModal() {
    document.getElementById('task-modal').classList.remove('active');
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').textContent = 'Add New Task';
    document.getElementById('comments-section').style.display = 'none';
    document.querySelector('.modal-content').classList.remove('edit-mode');
}

function openUploadModal() {
    document.getElementById('upload-modal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.remove('active');
}

function editTask(id) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        document.querySelector('#task-modal .modal-content').classList.add('edit-mode');
        document.getElementById('task-id').value = task.id;
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description || '';
        document.getElementById('due-date').value = task.dueDate || '';
        document.getElementById('time-estimate').value = task.timeEstimate || '';
        document.getElementById('status').value = task.status;
        document.getElementById('modal-title').textContent = 'Edit Task';
        
        const commentsSection = document.getElementById('comments-section');
        commentsSection.style.display = 'block';
        renderComments(id);

        openModal();
    }
}
function deleteTaskHandler(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        if (deleteTask(id)) {
            renderTaskList();
            renderKanbanBoard();
        }
    }
}
function setupCSVImport() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('csv-file');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    function highlight() {
        dropZone.classList.add('drag-over');
    }
    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    function handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const csv = e.target.result;
            processCSV(csv);
        };
        reader.readAsText(file);
    }
    function processCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) continue;
            const task = {};
            headers.forEach((header, index) => {
                task[header] = values[index];
            });
            if (task.title) {
                addTask(task);
            }
        }
        renderTaskList();
        renderKanbanBoard();
        alert('CSV imported successfully!');
        closeUploadModal();
    }
}
function renderComments(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    const commentsList = document.getElementById('comments-list');
    if (task && task.comments && task.comments.length > 0) {
        commentsList.innerHTML = task.comments.map((comment, index) => `
            <div class="comment">
                <div class="comment-header">
                    <span>${new Date(comment.date).toLocaleString()}</span>
                    <div class="comment-actions">
                        <button onclick="editComment('${taskId}', ${index})">Edit</button>
                    </div>
                </div>
                <div class="comment-body">${comment.text}</div>
            </div>
        `).join('');
    } else {
        commentsList.innerHTML = '<p>No comments yet.</p>';
    }
}

function addComment(taskId, text) {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        if (!tasks[taskIndex].comments) {
            tasks[taskIndex].comments = [];
        }
        tasks[taskIndex].comments.push({ text: text, date: new Date() });
        saveTasks(tasks);
        renderComments(taskId);
    }
}

function editComment(taskId, commentIndex) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    const comment = task.comments[commentIndex];
    
    const newText = prompt("Edit your comment:", comment.text);
    if (newText !== null && newText.trim() !== '') {
        task.comments[commentIndex].text = newText;
        task.comments[commentIndex].date = new Date();
        saveTasks(tasks);
        renderComments(taskId);
    }
}

function updateLogoText(pageId) {
    const logo = document.querySelector('.logo');
    if (pageId === 'task-list') {
        logo.textContent = 'Detailed View';
    } else if (pageId === 'kanban-board') {
        logo.textContent = 'Dashboard';
    }
}

function initApp() {
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            localStorage.setItem('activeView', pageId);
            updateLogoText(pageId);
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
            if (pageId === 'kanban-board') {
                renderKanbanBoard();
            } else {
                renderTaskList();
            }
        });
    });
    document.getElementById('add-task-btn').addEventListener('click', openModal);
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('upload-tasks-btn').addEventListener('click', openUploadModal);
    document.getElementById('close-upload-modal').addEventListener('click', closeUploadModal);
    document.getElementById('task-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const taskId = document.getElementById('task-id').value;
        const task = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            dueDate: document.getElementById('due-date').value,
            timeEstimate: document.getElementById('time-estimate').value,
            status: document.getElementById('status').value
        };
        if (taskId) {
            task.id = taskId;
            const tasks = getTasks();
            const existingTask = tasks.find(t => t.id === taskId);
            task.comments = existingTask.comments;
            updateTask(task);
        } else {
            addTask(task);
        }
        closeModal();
        renderTaskList();
        renderKanbanBoard();
    });

    document.getElementById('comment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const taskId = document.getElementById('task-id').value;
        const commentText = document.getElementById('new-comment').value;
        addComment(taskId, commentText);
        document.getElementById('new-comment').value = '';
    });

    setupCSVImport();

    const activeView = localStorage.getItem('activeView') || 'task-list';
    updateLogoText(activeView);
    document.querySelector(`.nav-btn[data-page="${activeView}"]`).click();
}
document.addEventListener('DOMContentLoaded', initApp);
