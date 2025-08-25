// Global variables
let materialItems = [];
let currentFilter = 'all';
let draggedElement = null;
let editingItemId = null;

// Default materials templates 
const DEFAULT_MATERIALS = {
  ascension: {
    character: {
      4: [
        { name: 'Character EXP Material', required: 171, image: '', obtained: 0 },
        { name: 'Elemental Gem', required: 46, image: '', obtained: 0 },
        { name: 'Local Specialty', required: 168, image: '', obtained: 0 },
        { name: 'Common Enemy Drop', required: 18, image: '', obtained: 0 }
      ],
      5: [
        { name: 'Character EXP Material', required: 171, image: '', obtained: 0 },
        { name: 'Elemental Gem', required: 46, image: '', obtained: 0 },
        { name: 'Local Specialty', required: 168, image: '', obtained: 0 },
        { name: 'Common Enemy Drop', required: 18, image: '', obtained: 0 },
        { name: 'Boss Material', required: 46, image: '', obtained: 0 }
      ]
    },
    weapon: {
      4: [
        { name: 'Weapon EXP Material', required: 605, image: '', obtained: 0 },
        { name: 'Weapon Ascension Material', required: 15, image: '', obtained: 0 },
        { name: 'Common Enemy Drop', required: 23, image: '', obtained: 0 }
      ],
      5: [
        { name: 'Weapon EXP Material', required: 605, image: '', obtained: 0 },
        { name: 'Weapon Ascension Material', required: 15, image: '', obtained: 0 },
        { name: 'Elite Enemy Drop', required: 23, image: '', obtained: 0 },
        { name: 'Weekly Boss Material', required: 6, image: '', obtained: 0 }
      ]
    }
  },
  talent: [
    { name: 'Talent Book', required: 114, image: '', obtained: 0 },
    { name: 'Common Enemy Drop', required: 18, image: '', obtained: 0 },
    { name: 'Weekly Boss Material', required: 18, image: '', obtained: 0 },
    { name: 'Crown of Insight', required: 3, image: '', obtained: 0 }
  ]
};

// Función para capitalizar texto
function capitalizeWords(text) {
  return text.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

function initializeApp() {
  loadFromLocalStorage();
  renderMaterials();
  setupEventListeners();
  setupDragAndDrop();
  setupFileInput();
  updateItemCounts();
  console.log('App initialized successfully');
}

// Load and save data
function loadFromLocalStorage() {
  const saved = localStorage.getItem('materialItems');
  if (saved) {
    try {
      materialItems = JSON.parse(saved);
      console.log('Data loaded from localStorage');
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      materialItems = [];
    }
  } else {
    materialItems = [];
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('materialItems', JSON.stringify(materialItems));
    console.log('Data saved to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// File input setup
function setupFileInput() {
  const fileInput = document.getElementById('imageFile');
  const fileLabel = document.querySelector('.file-input-label');
  const filePreview = document.getElementById('filePreview');
  const previewImage = document.getElementById('previewImage');
  const fileName = document.getElementById('fileName');

  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (JPG, PNG, SVG, etc.)');
          fileInput.value = '';
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          previewImage.src = e.target.result;
          fileName.textContent = file.name;
          filePreview.style.display = 'block';
          fileLabel.classList.add('has-file');
          fileLabel.innerHTML = '<span>📷 Change Image</span>';
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Event listeners
function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderMaterials();
    });
  });

  // Add button
  const addButton = document.getElementById('addButton');
  if (addButton) {
    addButton.addEventListener('click', function() {
      showAddModal();
    });
  }

  // Modal events
  setupModalEvents();

  // Type change event for showing/hiding element selector and material options
  const typeSelect = document.getElementById('itemType');
  const elementSelect = document.getElementById('itemElement');
  const levelSelector = document.getElementById('levelSelector');
  const talentMaterialsLabel = document.getElementById('talentMaterialsLabel');

  if (typeSelect) {
    typeSelect.addEventListener('change', function() {
      if (this.value === 'character') {
        elementSelect.style.display = 'block';
        elementSelect.required = true;
        levelSelector.style.display = 'block';
        talentMaterialsLabel.style.display = 'block';
      } else if (this.value === 'weapon') {
        elementSelect.style.display = 'none';
        elementSelect.required = false;
        levelSelector.style.display = 'block';
        talentMaterialsLabel.style.display = 'none';
        document.getElementById('talentMaterials').checked = false;
      } else {
        elementSelect.style.display = 'none';
        levelSelector.style.display = 'none';
        talentMaterialsLabel.style.display = 'none';
      }
    });
  }
}

function setupModalEvents() {
  const modal = document.getElementById('addModal');
  const form = document.getElementById('addForm');
  const cancelBtn = document.getElementById('cancelButton');
  const editMaterialsModal = document.getElementById('editMaterialsModal');
  const saveMaterialsBtn = document.getElementById('saveMaterialsButton');
  const cancelMaterialsBtn = document.getElementById('cancelMaterialsButton');

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideAddModal);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideAddModal();
      }
    });
  }

  if (editMaterialsModal) {
    editMaterialsModal.addEventListener('click', function(e) {
      if (e.target === editMaterialsModal) {
        hideEditMaterialsModal();
      }
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const fileInput = document.getElementById('imageFile');
      const previewImage = document.getElementById('previewImage');
      
      const itemData = {
        name: formData.get('name').trim(),
        type: formData.get('type'),
        rarity: parseInt(formData.get('rarity')),
        element: formData.get('element') || null,
        imageUrl: fileInput.files[0] ? previewImage.src : getDefaultImage(formData.get('type')),
        notes: formData.get('notes').trim(),
        currentLevel: formData.get('currentLevel') ? parseInt(formData.get('currentLevel')) : 1,
        targetLevel: formData.get('targetLevel') ? parseInt(formData.get('targetLevel')) : 90,
        includeAscension: formData.get('ascensionMaterials') === 'on',
        includeTalent: formData.get('talentMaterials') === 'on'
      };
      
      if (itemData.name && itemData.type && itemData.rarity) {
        if (editingItemId) {
          updateItem(itemData);
        } else {
          addItem(itemData);
        }
        hideAddModal();
        resetForm();
      } else {
        alert('Please fill in all required fields (Name, Type, Rarity)');
      }
    });
  }

  // Materials editor events
  if (saveMaterialsBtn) {
    saveMaterialsBtn.addEventListener('click', saveMaterialsChanges);
  }

  if (cancelMaterialsBtn) {
    cancelMaterialsBtn.addEventListener('click', hideEditMaterialsModal);
  }
}

function getDefaultImage(type) {
  if (type === 'character') {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%23e5a6b2" cx="50" cy="50" r="40"/><text y="60" x="50" text-anchor="middle" fill="white" font-size="30">⚔️</text></svg>';
  } else {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5a6b2" width="100" height="100" rx="10"/><text y="60" x="50" text-anchor="middle" fill="white" font-size="30">⚔️</text></svg>';
  }
}

// Modal functions
function showAddModal(itemId = null) {
  const modal = document.getElementById('addModal');
  const modalTitle = document.getElementById('modalTitle');
  const submitButton = document.getElementById('submitButton');

  if (itemId) {
    editingItemId = itemId;
    const item = materialItems.find(item => item.id === itemId);
    if (item) {
      modalTitle.textContent = 'Edit Item';
      submitButton.textContent = 'Update Item';
      populateForm(item);
    }
  } else {
    editingItemId = null;
    modalTitle.textContent = 'Add New Item';
    submitButton.textContent = 'Add Item';
    resetForm();
  }

  modal.classList.add('show');
}

function hideAddModal() {
  const modal = document.getElementById('addModal');
  modal.classList.remove('show');
  editingItemId = null;
}

function populateForm(item) {
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemType').value = item.type;
  document.getElementById('itemRarity').value = item.rarity;
  document.getElementById('itemElement').value = item.element || '';
  document.getElementById('itemNotes').value = item.notes || '';
  document.getElementById('currentLevel').value = item.currentLevel || 1;
  document.getElementById('targetLevel').value = item.targetLevel || 90;
  document.getElementById('ascensionMaterials').checked = item.includeAscension !== false;
  document.getElementById('talentMaterials').checked = item.includeTalent || false;

  // Trigger type change event to show/hide fields
  const typeEvent = new Event('change');
  document.getElementById('itemType').dispatchEvent(typeEvent);

  // Handle image
  if (item.imageUrl && !item.imageUrl.startsWith('data:image/svg+xml')) {
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const filePreview = document.getElementById('filePreview');
    const fileLabel = document.querySelector('.file-input-label');

    previewImage.src = item.imageUrl;
    fileName.textContent = 'Current image';
    filePreview.style.display = 'block';
    fileLabel.classList.add('has-file');
    fileLabel.innerHTML = '<span>📷 Change Image</span>';
  }
}

function resetForm() {
  const form = document.getElementById('addForm');
  const fileInput = document.getElementById('imageFile');
  const fileLabel = document.querySelector('.file-input-label');
  const filePreview = document.getElementById('filePreview');

  form.reset();
  if (fileInput) fileInput.value = '';
  if (filePreview) filePreview.style.display = 'none';
  if (fileLabel) {
    fileLabel.classList.remove('has-file');
    fileLabel.innerHTML = '<span>📷 Choose Image (JPG, PNG, SVG...)</span>';
  }

  // Hide optional fields
  document.getElementById('itemElement').style.display = 'none';
  document.getElementById('levelSelector').style.display = 'none';
  document.getElementById('talentMaterialsLabel').style.display = 'none';
}

// Materials editor modal
function showEditMaterialsModal(itemId) {
  const modal = document.getElementById('editMaterialsModal');
  const item = materialItems.find(item => item.id === itemId);
  
  if (!item) return;

  editingItemId = itemId;
  renderMaterialsEditor(item);
  modal.classList.add('show');
}

function hideEditMaterialsModal() {
  const modal = document.getElementById('editMaterialsModal');
  modal.classList.remove('show');
  editingItemId = null;
}

function renderMaterialsEditor(item) {
  initializeCatalog();
  renderCurrentMaterials();
}

function addMaterialRow() {
  const item = materialItems.find(item => item.id === editingItemId);
  if (!item) return;
  
  if (!item.materials) item.materials = [];
  
  item.materials.push({ name: '', required: 0, obtained: 0, image: '' });
  renderCurrentMaterials();
}

function removeMaterialRow(index) {
  const item = materialItems.find(item => item.id === editingItemId);
  if (!item || !item.materials) return;
  
  item.materials.splice(index, 1);
  renderCurrentMaterials();
}

function saveMaterialsChanges() {
  saveToLocalStorage();
  renderMaterials();
  hideEditMaterialsModal();
}

// Item management
function addItem(itemData) {
  const newItem = {
    id: Date.now(),
    ...itemData,
    completed: false,
    materials: generateMaterials(itemData)
  };
  
  materialItems.push(newItem);
  saveToLocalStorage();
  renderMaterials();
  updateItemCounts();
}

function updateItem(itemData) {
  const index = materialItems.findIndex(item => item.id === editingItemId);
  if (index !== -1) {
    const existingItem = materialItems[index];
    materialItems[index] = {
      ...existingItem,
      ...itemData,
      materials: existingItem.materials || generateMaterials(itemData)
    };
    saveToLocalStorage();
    renderMaterials();
    updateItemCounts();
  }
}

function deleteItem(itemId) {
  if (confirm('Are you sure you want to delete this item?')) {
    const index = materialItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
      materialItems.splice(index, 1);
      saveToLocalStorage();
      renderMaterials();
      updateItemCounts();
    }
  }
}

function toggleComplete(itemId) {
  const item = materialItems.find(item => item.id === itemId);
  if (item) {
    item.completed = !item.completed;
    saveToLocalStorage();
    renderMaterials();
    updateItemCounts();
  }
}

function generateMaterials(itemData) {
  let materials = [];
  
  if (itemData.includeAscension) {
    const template = DEFAULT_MATERIALS.ascension[itemData.type];
    if (template && template[itemData.rarity]) {
      materials = materials.concat(JSON.parse(JSON.stringify(template[itemData.rarity])));
    }
  }
  
  if (itemData.includeTalent && itemData.type === 'character') {
    materials = materials.concat(JSON.parse(JSON.stringify(DEFAULT_MATERIALS.talent)));
  }
  
  return materials;
}

// Rendering
function renderMaterials() {
  const inProgressContainer = document.getElementById('inProgressContainer');
  const completedContainer = document.getElementById('completedContainer');
  
  inProgressContainer.innerHTML = '';
  completedContainer.innerHTML = '';
  
  const filteredItems = materialItems.filter(item => {
    // Si el filtro es "completed", solo mostrar items completados
    if (currentFilter === 'completed') {
      return item.completed;
    }
    
    // Para todos los otros filtros, EXCLUIR items completados
    if (item.completed) {
      return false;
    }
    
    // Aplicar los filtros normales solo a items no completados
    if (currentFilter === 'all') return true;
    if (currentFilter === 'in-progress') return !item.completed;
    if (currentFilter.includes('-')) {
      const [type, rarity] = currentFilter.split('-');
      return item.type === type && item.rarity.toString() === rarity;
    }
    return item.element === currentFilter;
  });
  
  filteredItems.forEach(item => {
    const itemElement = createItemElement(item);
    if (item.completed) {
      completedContainer.appendChild(itemElement);
    } else {
      inProgressContainer.appendChild(itemElement);
    }
  });
  
  updateItemCounts();
}

function createItemElement(item) {
  const element = document.createElement('div');
  element.className = `material-item ${item.completed ? 'completed' : ''}`;
  element.dataset.id = item.id;
  
  const completionPercentage = calculateCompletionPercentage(item);
  
  // Crear tags adicionales para ascension y talent materials
  let additionalTags = '';
  if (item.includeAscension) {
    additionalTags += '<span class="item-tag">Ascension Materials</span>';
  }
  if (item.includeTalent) {
    additionalTags += '<span class="item-tag">Talent Materials</span>';
  }
  
  element.innerHTML = `
    <div class="drag-handle">::</div>
    <img src="${item.imageUrl}" alt="${item.name}" class="item-image" />
    <div class="item-content">
      <div class="item-header">
        <div class="item-title">
          <h3 class="item-name ${item.completed ? 'completed' : ''}">${item.name}</h3>
          <div class="level-selectors">
            <select class="level-select" data-id="${item.id}" data-field="currentLevel">
              <option value="1" ${item.currentLevel === 1 ? 'selected' : ''}>1</option>
              <option value="20" ${item.currentLevel === 20 ? 'selected' : ''}>20</option>
              <option value="40" ${item.currentLevel === 40 ? 'selected' : ''}>40</option>
              <option value="50" ${item.currentLevel === 50 ? 'selected' : ''}>50</option>
              <option value="60" ${item.currentLevel === 60 ? 'selected' : ''}>60</option>
              <option value="70" ${item.currentLevel === 70 ? 'selected' : ''}>70</option>
              <option value="80" ${item.currentLevel === 80 ? 'selected' : ''}>80</option>
              <option value="90" ${item.currentLevel === 90 ? 'selected' : ''}>90</option>
            </select>
            <span class="level-arrow">→</span>
            <select class="level-select" data-id="${item.id}" data-field="targetLevel">
              <option value="20" ${item.targetLevel === 20 ? 'selected' : ''}>20</option>
              <option value="40" ${item.targetLevel === 40 ? 'selected' : ''}>40</option>
              <option value="50" ${item.targetLevel === 50 ? 'selected' : ''}>50</option>
              <option value="60" ${item.targetLevel === 60 ? 'selected' : ''}>60</option>
              <option value="70" ${item.targetLevel === 70 ? 'selected' : ''}>70</option>
              <option value="80" ${item.targetLevel === 80 ? 'selected' : ''}>80</option>
              <option value="90" ${item.targetLevel === 90 ? 'selected' : ''}>90</option>
            </select>
          </div>
        </div>
        <div class="item-meta">
          <span class="item-rarity">${'★'.repeat(item.rarity)}</span>
          <span class="item-tag">${capitalizeWords(item.type)}</span>
          ${item.element ? `<span class="item-element">${capitalizeWords(item.element)}</span>` : ''}
          ${additionalTags}
        </div>
      </div>
      
      ${item.materials && item.materials.length > 0 ? `
        <div class="materials-grid">
          ${item.materials.map(material => {
            const isComplete = material.obtained >= material.required;
            const countClass = isComplete ? 'complete' : 'incomplete';
            return `
              <div class="material-slot">
                <img src="${material.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1e7e0" width="100" height="100" rx="10"/></svg>'}" alt="${material.name}" class="material-image" />
                <div class="material-name">${material.name}</div>
                <div class="material-count ${countClass}">${material.obtained}/${material.required}</div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      
      <div class="item-actions">
        <div class="completion-controls">
          <label class="checkbox-label">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleComplete(${item.id})">
            Mark as completed
          </label>
          <span class="completion-percentage">${completionPercentage}% materials (${Math.round(completionPercentage)}%)</span>
        </div>
        <div class="action-buttons">
          <button class="btn-edit" onclick="showAddModal(${item.id})">Edit</button>
          <button class="btn-edit-materials" onclick="showEditMaterialsModal(${item.id})">Edit Materials</button>
          <button class="btn-delete" onclick="deleteItem(${item.id})">⌫</button>
        </div>
      </div>
    </div>
  `;
  
  // Add level selector event listeners
  element.querySelectorAll('.level-select').forEach(select => {
    select.addEventListener('change', function() {
      const itemId = parseInt(this.dataset.id);
      const field = this.dataset.field;
      const value = parseInt(this.value);
      
      const item = materialItems.find(item => item.id === itemId);
      if (item) {
        item[field] = value;
        saveToLocalStorage();
      }
    });
  });
  
  return element;
}

function calculateCompletionPercentage(item) {
  if (!item.materials || item.materials.length === 0) return 100;
  
  let totalRequired = 0;
  let totalObtained = 0;
  
  item.materials.forEach(material => {
    totalRequired += material.required;
    totalObtained += Math.min(material.obtained, material.required);
  });
  
  return totalRequired === 0 ? 100 : Math.round((totalObtained / totalRequired) * 100);
}

function updateItemCounts() {
  let inProgressCount = 0;
  let completedCount = 0;
  
  if (currentFilter === 'completed') {
    // Si estamos en el filtro completed, solo contar items completados
    completedCount = materialItems.filter(item => item.completed).length;
    inProgressCount = 0;
  } else {
    // Para otros filtros, contar solo items no completados que pasen el filtro
    const filteredInProgress = materialItems.filter(item => {
      if (item.completed) return false; // Excluir completados
      
      if (currentFilter === 'all') return true;
      if (currentFilter === 'in-progress') return true;
      if (currentFilter.includes('-')) {
        const [type, rarity] = currentFilter.split('-');
        return item.type === type && item.rarity.toString() === rarity;
      }
      return item.element === currentFilter;
    });
    
    inProgressCount = filteredInProgress.length;
    completedCount = 0;
  }
  
  document.getElementById('inProgressCount').textContent = `${inProgressCount} items`;
  document.getElementById('completedCount').textContent = `${completedCount} items`;
}

// Drag and drop functionality
function setupDragAndDrop() {
  const containers = document.querySelectorAll('.materials-container');
  
  containers.forEach(container => {
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
  });
  
  // Make items draggable
  document.addEventListener('click', function(e) {
    if (e.target.closest('.drag-handle')) {
      const item = e.target.closest('.material-item');
      if (item) {
        item.draggable = true;
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
      }
    }
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  
  if (draggedElement) {
    const itemId = parseInt(draggedElement.dataset.id);
    const item = materialItems.find(item => item.id === itemId);
    
    if (item) {
      const isCompletedContainer = e.currentTarget.id === 'completedContainer';
      item.completed = isCompletedContainer;
      
      saveToLocalStorage();
      renderMaterials();
      updateItemCounts();
    }
  }
}

// Materials Catalog Data - VACÍO PARA QUE AGREGUES TUS PROPIOS MATERIALES
const MATERIALS_CATALOG = {
  'ascension-gems': [],
  'weekly-boss': [],
  'normal-boss': [],
  'elite-drops': [],
  'general-drops': [],
  'local-specialties': [],
  'talent-books': [],
  'others': []
};

let currentCatalogCategory = 'ascension-gems';
let selectedCatalogItems = [];

// Initialize catalog functionality
function initializeCatalog() {
  const catalogTabs = document.querySelectorAll('.catalog-tab');
  catalogTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      catalogTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      currentCatalogCategory = this.dataset.category;
      renderCatalogMaterials();
    });
  });
  
  renderCatalogMaterials();
  loadCatalogFromStorage();
}

function loadCatalogFromStorage() {
  const saved = localStorage.getItem('materialsCatalog');
  if (saved) {
    try {
      const catalogData = JSON.parse(saved);
      Object.assign(MATERIALS_CATALOG, catalogData);
      renderCatalogMaterials();
    } catch (error) {
      console.error('Error loading catalog from storage:', error);
    }
  }
}

function saveCatalogToStorage() {
  try {
    localStorage.setItem('materialsCatalog', JSON.stringify(MATERIALS_CATALOG));
  } catch (error) {
    console.error('Error saving catalog to storage:', error);
  }
}

function renderCatalogMaterials() {
  const catalogContainer = document.getElementById('catalogMaterials');
  const materials = MATERIALS_CATALOG[currentCatalogCategory] || [];
  
  let html = '';
  
  // Botón para agregar nuevo material al catálogo
  html += `
    <div class="catalog-material-item add-new-material" onclick="showAddMaterialToCatalog()">
      <div class="catalog-material-image add-icon">+</div>
      <div class="catalog-material-name">Add New</div>
    </div>
  `;
  
  // Materiales existentes
  materials.forEach(material => {
    html += `
      <div class="catalog-material-item" data-id="${material.id}" onclick="toggleCatalogSelection('${material.id}')">
        <img src="${material.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1e7e0" width="100" height="100" rx="10"/></svg>'}" 
             alt="${material.name}" class="catalog-material-image" />
        <div class="catalog-material-name">${material.name}</div>
        <button type="button" class="remove-catalog-material" onclick="removeMaterialFromCatalog(event, '${material.id}')">×</button>
      </div>
    `;
  });
  
  catalogContainer.innerHTML = html;
}

function showAddMaterialToCatalog() {
  const name = prompt('Material name:');
  if (!name || !name.trim()) return;
  
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        addMaterialToCatalog(name.trim(), e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      addMaterialToCatalog(name.trim(), '');
    }
  };
  fileInput.click();
}

function addMaterialToCatalog(name, imageUrl) {
  const newMaterial = {
    id: Date.now().toString(),
    name: name,
    image: imageUrl
  };
  
  MATERIALS_CATALOG[currentCatalogCategory].push(newMaterial);
  saveCatalogToStorage();
  renderCatalogMaterials();
}

function removeMaterialFromCatalog(event, materialId) {
  event.stopPropagation();
  if (confirm('Remove this material from catalog?')) {
    MATERIALS_CATALOG[currentCatalogCategory] = MATERIALS_CATALOG[currentCatalogCategory].filter(mat => mat.id !== materialId);
    saveCatalogToStorage();
    renderCatalogMaterials();
  }
}

function toggleCatalogSelection(materialId) {
  const element = document.querySelector(`[data-id="${materialId}"]`);
  const isSelected = element.classList.contains('selected');
  
  if (isSelected) {
    element.classList.remove('selected');
    selectedCatalogItems = selectedCatalogItems.filter(id => id !== materialId);
  } else {
    element.classList.add('selected');
    selectedCatalogItems.push(materialId);
  }
}

function addSelectedMaterials() {
  const item = materialItems.find(item => item.id === editingItemId);
  if (!item || selectedCatalogItems.length === 0) return;
  
  if (!item.materials) item.materials = [];
  
  selectedCatalogItems.forEach(itemId => {
    let foundMaterial = null;
    for (const category in MATERIALS_CATALOG) {
      const found = MATERIALS_CATALOG[category].find(mat => mat.id === itemId);
      if (found) {
        foundMaterial = found;
        break;
      }
    }
    
    if (foundMaterial && !item.materials.find(mat => mat.name === foundMaterial.name)) {
      item.materials.push({
        name: foundMaterial.name,
        required: 1,
        obtained: 0,
        image: foundMaterial.image
      });
    }
  });
  
  selectedCatalogItems = [];
  document.querySelectorAll('.catalog-material-item.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  renderCurrentMaterials();
}

function renderCurrentMaterials() {
  const item = materialItems.find(item => item.id === editingItemId);
  const editor = document.getElementById('materialsEditor');
  
  if (!item || !item.materials || item.materials.length === 0) {
    editor.innerHTML = '<div style="text-align: center; color: #999; padding: 2rem;">No materials added yet</div>';
    return;
  }
  
  editor.innerHTML = item.materials.map((material, index) => `
    <div class="current-material-item">
      <button type="button" class="current-material-remove" onclick="removeCurrentMaterial(${index})">×</button>
      <img src="${material.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1e7e0" width="100" height="100" rx="10"/></svg>'}" 
           alt="${material.name}" class="catalog-material-image" />
      <div class="catalog-material-name">${material.name}</div>
      <div style="margin-top: 0.5rem; font-size: 0.75rem;">
        <input type="number" value="${material.obtained}" style="width: 40px; margin-right: 5px;" 
               onchange="updateMaterialCount(${index}, 'obtained', this.value)" />
        /
        <input type="number" value="${material.required}" style="width: 40px; margin-left: 5px;" 
               onchange="updateMaterialCount(${index}, 'required', this.value)" />
      </div>
    </div>
  `).join('');
}

function removeCurrentMaterial(index) {
  const item = materialItems.find(item => item.id === editingItemId);
  if (item && item.materials) {
    item.materials.splice(index, 1);
    renderCurrentMaterials();
  }
}

function updateMaterialCount(index, field, value) {
  const item = materialItems.find(item => item.id === editingItemId);
  if (item && item.materials && item.materials[index]) {
    item.materials[index][field] = parseInt(value) || 0;
  }
}