// Добавляем HTML для модального окна
const modalHTML = `
    <div class="modal-overlay" id="deleteProjectModal">
        <div class="modal-container">
            <h3 class="modal-title">Вы точно хотите удалить проект?</h3>
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-cancel" id="cancelDelete">Нет</button>
                <button class="modal-btn modal-btn-confirm" id="confirmDelete">Да</button>
            </div>
        </div>
    </div>
`;

document.body.insertAdjacentHTML('beforeend', modalHTML);

// Функция для ожидания появления атрибута data-project-id
async function waitForProjectId() {
    return new Promise((resolve) => {
        // Проверяем, есть ли уже элемент с data-project-id
        const activeContent = document.querySelector('.content.active[data-project-id]');
        if (activeContent) {
            resolve(activeContent.dataset.projectId);
            return;
        }

        // Создаем observer для отслеживания изменений в DOM
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-project-id') {
                    const projectId = mutation.target.dataset.projectId;
                    if (projectId) {
                        observer.disconnect();
                        resolve(projectId);
                        return;
                    }
                }
                
                // Проверяем добавленные узлы
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches('.content.active[data-project-id]')) {
                        const projectId = node.dataset.projectId;
                        if (projectId) {
                            observer.disconnect();
                            resolve(projectId);
                            return;
                        }
                    }
                });
            }
        });

        // Настраиваем observer
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-project-id']
        });

        // Устанавливаем таймаут на случай, если атрибут так и не появится
        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, 10000); // 10 секунд таймаут
    });
}

// Функция для добавления кнопок удаления к проектам в навигации
async function initializeProjectDeleteButtons() {
    const projectId = await waitForProjectId();
    if (!projectId) return;

    // Находим все элементы проектов в навигации
    const projects = document.querySelectorAll('.nav_pro_item');
    
    projects.forEach(project => {
        addDeleteButton(project, projectId);
    });
}

// Функция для добавления кнопки удаления к элементу
function addDeleteButton(projectElement, projectId) {
    // Проверяем, нет ли уже кнопки удаления
    if (projectElement.querySelector('.delete-project-btn')) return;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-project-btn';
    deleteButton.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
    `;
    
    // Получаем project id из атрибута data-content
    const projectDataId = projectElement.getAttribute('data-content');
    
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        showDeleteModal(projectDataId); // Используем ID из data-content
    });
    
    projectElement.style.position = 'relative';
    projectElement.appendChild(deleteButton);
}

// Функция для отображения модального окна
function showDeleteModal(projectId) {
    const modal = document.getElementById('deleteProjectModal');
    modal.classList.add('active');
    
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    
    const handleConfirm = () => {
        deleteProject(projectId);
        modal.classList.remove('active');
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        cleanup();
    };
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

// Функция для удаления проекта
async function deleteProject(projectId) {
    try {
        const response = await fetch('api/delete_project.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ projectId }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Обновляем список проектов
            await loadActiveProjects();
            
            // Если есть другие проекты, выбираем первый
            const remainingProjects = document.querySelectorAll('.nav_pro_item');
            if (remainingProjects.length > 0) {
                remainingProjects[0].click(); // Активируем первый проект
            } else {
                // Если проектов нет, переключаемся на страницу Launch
                const launchElement = document.querySelector('[data-content="1"]');
                if (launchElement) {
                    launchElement.click();
                }
            }
            
            showNotification('Проект успешно удален', 'success');
        } else {
            showError(data.message || 'Ошибка при удалении проекта');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Произошла ошибка при удалении проекта');
    }
}

async function showNotification(message) {
    let errorContainer = document.querySelector('.error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'success-message';
    errorElement.textContent = message;
    
    errorContainer.appendChild(errorElement);

    setTimeout(() => {
        errorElement.classList.add('removing');
        
        errorElement.addEventListener('animationend', () => {
            errorElement.remove();
            
            if (errorContainer.children.length === 0) {
                errorContainer.remove();
            }
        });
    }, 5000);
}

async function showError(message) {
    let errorContainer = document.querySelector('.error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    errorContainer.appendChild(errorElement);

    setTimeout(() => {
        errorElement.classList.add('removing');
        
        errorElement.addEventListener('animationend', () => {
            errorElement.remove();
            
            if (errorContainer.children.length === 0) {
                errorContainer.remove();
            }
        });
    }, 5000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeProjectDeleteButtons);

// Слушаем изменения активного контента
document.addEventListener('click', (e) => {
    if (e.target.closest('.nav_pro_item, .nav_item_con')) {
        // Инициализируем кнопки удаления заново
        initializeProjectDeleteButtons();
    }
});