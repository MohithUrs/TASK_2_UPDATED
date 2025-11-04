const firebaseConfig = {
    apiKey: "AIzaSyDvhOWfhg98Lh0HjBmMr-GGMtNt7M3l2iI",
    authDomain: "sports-5192b.firebaseapp.com",
    databaseURL: "https://sports-5192b-default-rtdb.firebaseio.com",
    projectId: "sports-5192b",
    storageBucket: "sports-5192b.firebasestorage.app",
    messagingSenderId: "834964443975",
    appId: "1:834964443975:web:877b1b64943e5bd7797262",
    measurementId: "G-DDFZXL4J9V"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let playersData = []; 
let selectedGender = '';
let selectedRole = '';
let editMode = false;
let deleteCandidateId = null;
let searchQuery = '';

// Initialize create player modal when document is ready
// Function to create a new bullet point container
function createBulletPoint(value = '') {
    const container = document.createElement('div');
    container.className = 'bullet-point-container';
    
    container.innerHTML = `
        <textarea class="bullet-point-textarea form-control" placeholder="Enter stat or description point">${value}</textarea>
        <div class="bullet-controls">
            <button type="button" class="bullet-btn remove-bullet" title="Remove point">×</button>
        </div>
    `;

    container.querySelector('.remove-bullet').addEventListener('click', () => {
        if (document.querySelectorAll('.bullet-point-container').length > 1) {
            container.remove();
        } else {
            container.querySelector('textarea').value = '';
        }
    });

    container.querySelector('textarea').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.getElementById('addBulletBtn').click();
        }
    });
    
    return container;
}

// Function to initialize the description container
function initializeDescription() {
    const container = document.getElementById('descriptionContainer');
    const addButton = document.getElementById('addBulletBtn');
    
    if (!container || !addButton) return;

    // Clear existing content
    container.innerHTML = '';
    
    // Add first bullet point
    container.appendChild(createBulletPoint());
    
    // Add button click handler
    addButton.addEventListener('click', () => {
        const newPoint = createBulletPoint();
        container.appendChild(newPoint);
        newPoint.querySelector('textarea').focus();
    });
}

// Function to populate bullet points when editing
function populateDescription(description) {
    const container = document.getElementById('descriptionContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (description) {
        const points = description.split('\n').filter(point => point.trim());
        points.forEach(point => {
            container.appendChild(createBulletPoint(point.trim()));
        });
    }
    
    if (container.children.length === 0) {
        container.appendChild(createBulletPoint());
    }
}

// Function to collect all bullet points
function getDescription() {
    const points = Array.from(document.querySelectorAll('.bullet-point-textarea'))
        .map(textarea => textarea.value.trim())
        .filter(text => text !== '');
    return points.join('\n');
}

document.addEventListener('DOMContentLoaded', function() {
    const createPlayerModal = document.getElementById('createPlayerModal');
    const createBtn = document.getElementById('createPlayerBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    // When user clicks the Create Player button, ensure editMode is false
    if (createBtn) {
        createBtn.addEventListener('click', function () {
            editMode = false;
            const sportInput = document.getElementById('playerSport');
            if (sportInput) sportInput.value = selectedSport;
            // prepare modal for create
            document.getElementById('playerForm').reset();
            document.getElementById('modalTitle').textContent = 'Create New Player';
            document.getElementById('submitBtn').textContent = 'Submit';
            const styleEl = document.getElementById('playerStyle');
            if (styleEl) styleEl.disabled = true;
            updateRoleOptions();
            updateNationalityOptions();
            initializeDescription();
        });
    }

    // bind confirm delete button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            confirmDelete();
        });
    }
});

// Determine sport based on page
const selectedSport = document.title.includes('Cricket') ? 'CRICKET' : 'FOOTBALL';

// Create reference based on sport - storing separately
const playersRef = selectedSport === 'CRICKET' 
    ? database.ref('cricket') 
    : database.ref('football');

// Get user role from session
const userRole = sessionStorage.getItem('userRole');

// Listen for changes in the sport-specific database
playersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        playersData = Object.keys(data).map(key => ({
            id: key, 
            ...data[key]
        }));
    } else {
        playersData = [];
    }
    
    if (selectedGender) {
        showPlayers();
    }
});

const roleOptions = {
    'CRICKET': {
        'roles': ['BATTER', 'BOWLER', 'WICKETKEEPER', 'ALLROUNDER'],
        'styles': {
            'BATTER': ['Right Hand Batsmen', 'Left Hand Batsmen'],
            'BOWLER': ['Right Arm Spin', 'Left Arm Spin', 'Right Arm Fast', 'Left Arm Fast'],
            'WICKETKEEPER': ['Right Hand Keeper', 'Left Hand Keeper'],
            'ALLROUNDER': ['Batting Allrounder', 'Bowling Allrounder']
        }
    },
    'FOOTBALL': {
        'roles': ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'],
        'styles': {
            'GOALKEEPER': ['Left', 'Right'],
            'DEFENDER': ['Left Foot', 'Right Foot', 'Both Foot'],
            'MIDFIELDER': ['Left Foot', 'Right Foot', 'Both Foot'],
            'FORWARD': ['Left Foot', 'Right Foot', 'Both Foot']
        }
    }
};

function updateRoleOptions() {
    const sportSelect = document.getElementById('playerSport');
    const roleSelect = document.getElementById('playerRole');
    const styleSelect = document.getElementById('playerStyle');
    
    roleSelect.innerHTML = '<option value="">Select Role</option>';
    styleSelect.innerHTML = '<option value="">Select Role First</option>';
    styleSelect.disabled = true;

    const sport = sportSelect.value;
    if (sport && roleOptions[sport]) {
        roleSelect.disabled = false;
        roleOptions[sport].roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            roleSelect.appendChild(option);
        });
    } else {
        roleSelect.disabled = true;
    }
}

function updateNationalityOptions() {
    const natSelect = document.getElementById('playerNationality');
    if (!natSelect) return;
    natSelect.innerHTML = '<option value="">Select Nationality</option>';
    const cricketNats = ['India','England','Australia','West Indies','South Africa','Pakistan','Srilanka','Others'];
    const footballNats = ['India','Portugal','Brazil','Italy','Germany','Morocco','Argentina','Others'];
    const list = (selectedSport === 'CRICKET') ? cricketNats : footballNats;
    list.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        natSelect.appendChild(opt);
    });
}

function updateStyleOptions() {
    const sportSelect = document.getElementById('playerSport');
    const roleSelect = document.getElementById('playerRole');
    const styleSelect = document.getElementById('playerStyle');
    styleSelect.innerHTML = '<option value="">Select Style</option>';
    
    const sport = sportSelect.value;
    const role = roleSelect.value;
    
    if (sport && role && roleOptions[sport] && roleOptions[sport].styles[role]) {
        styleSelect.disabled = false;
        roleOptions[sport].styles[role].forEach(style => {
            const option = document.createElement('option');
            option.value = style;
            option.textContent = style;
            styleSelect.appendChild(option);
        });
    } else {
        styleSelect.disabled = true;
        styleSelect.innerHTML = '<option value="">Select Role First</option>';
    }
}

function calculateAge(dob) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function selectGender(gender) {
    selectedGender = gender;
    // Update gender tab highlighting
    document.querySelectorAll('#genderTabs .nav-link').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    showPlayers();
}

function selectRole(role) {
    selectedRole = role;
    showPlayers();
    setActiveTab(event.target);
}

function showAllPlayers() {
    selectedRole = 'ALL';
    showPlayers();
    setActiveTab(event.target);
}

function showPlayers() {
    const tableBody = document.getElementById('playersTableBody');
    const noPlayers = document.getElementById('noPlayersMessage');
    const tableWrapper = document.getElementById('tableWrapper');
    const tableTitle = document.getElementById('tableTitle');

    let filtered = playersData.filter(p => p.gender === selectedGender);

    if (selectedRole && selectedRole !== 'ALL') {
        filtered = filtered.filter(p => p.role === selectedRole);
    }

    // Apply search filter and track matches
    let searchMatches = [];
    const hasSearch = searchQuery && searchQuery.trim() !== '';
    
    if (hasSearch) {
        const query = searchQuery.toLowerCase().trim();
        const tempFiltered = [];
        
        filtered.forEach(p => {
            const fName = p.firstName || (p.name ? p.name.split(' ')[0] : '');
            const lName = p.lastName || (p.name ? p.name.split(' ').slice(1).join(' ') : '');
            const fullName = `${fName} ${lName}`.toLowerCase().trim();
            const id = (p.id || '').toLowerCase();
            const role = (p.role || '').toLowerCase();
            
            const isMatch = id.includes(query) || fullName.includes(query) || role.includes(query);
            if (isMatch) {
                searchMatches.push(p.id);
                tempFiltered.push(p);
            }
        });
        
        filtered = tempFiltered;
    }

    const genderText = selectedGender === 'MALE' ? 'MENS' : 'WOMENS';
    tableTitle.textContent = `${selectedSport} - ${genderText} - ${selectedRole || 'ALL PLAYERS'}`;
    tableBody.innerHTML = '';
    
    if (filtered.length === 0) {
        noPlayers.style.display = 'block';
        noPlayers.textContent = hasSearch ? 'No players found matching your search.' : 'No players found. Click "Create Player" to add players.';
        tableWrapper.style.display = 'none';
    } else {
        noPlayers.style.display = 'none';
        tableWrapper.style.display = 'block';
        
        filtered.forEach(player => {
            const actionColumn = userRole === 'admin' 
                ? `<td>
                      <button class="btn btn-sm btn-primary me-2" onclick="editPlayer('${player.id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="deletePlayer('${player.id}')">Delete</button>
                   </td>`
                : '';
            const fName = player.firstName || (player.name ? player.name.split(' ')[0] : '');
            const lName = player.lastName || (player.name ? player.name.split(' ').slice(1).join(' ') : '');
            const displayName = `${fName} ${lName}`.trim();

            // Add highlight class if this player matches the search
            const highlightClass = (hasSearch && searchMatches.includes(player.id)) ? 'highlight-row' : '';

            const row = document.createElement('tr');
            if (highlightClass) {
                row.className = highlightClass;
            }
            
            row.innerHTML = `
                <td>${player.id}</td>
                <td><a href="#" onclick="showDescription('${player.id}');return false;">${displayName || player.name || ''}</a></td>
                <td>${player.dob || ''}</td>
                <td>${player.age || ''}</td>
                <td>${player.gender || ''}</td>
                <td>${player.role || ''}</td>
                <td>${player.style || ''}</td>
                ${actionColumn}
            `;
            
            tableBody.appendChild(row);
        });
    }
}

function validateForm() {
    const form = document.getElementById('playerForm');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.type === 'radio') {
            const radioGroup = form.querySelector(`input[name="${input.name}"]:checked`);
            if (!radioGroup) {
                isValid = false;
            }
        } else {
            if (!input.value) {
                isValid = false;
                input.classList.add('is-invalid');
            } else if ((input.id === 'playerFirstName' || input.id === 'playerLastName') && !/^[A-Za-z]+$/.test(input.value)) {
                isValid = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
            }
        }
    });
    
    return isValid;
}

// Function to show toast messages
function showToast(message, type = 'primary') {
    const toast = document.getElementById('messageToast');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set the message
    toastMessage.textContent = message;
    
    // Update toast background color based on type
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    
    // Create and show the toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function savePlayer() {
    if (userRole !== 'admin') {
        showToast('Only administrators can create or edit players.', 'danger');
        return;
    }

    if (!validateForm()) {
        showToast('Please fill all required fields correctly.', 'warning');
        return;
    }

    const id = document.getElementById('playerId').value;
    const firstName = document.getElementById('playerFirstName').value.trim();
    const lastName = document.getElementById('playerLastName').value.trim();
    const name = `${firstName} ${lastName}`.trim();
    const dob = document.getElementById('playerDOB').value;
    const role = document.getElementById('playerRole').value;
    const style = document.getElementById('playerStyle').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const nationality = document.getElementById('playerNationality') ? document.getElementById('playerNationality').value : '';
    const description = getDescription();
    const age = calculateAge(dob);
    const sport = document.getElementById('playerSport').value;

    const playerData = { firstName, lastName, name, dob, age, gender, role, style, nationality, description };

    if (editMode) {
        playersRef.child(id).update(playerData)
            .then(() => showToast('Player updated successfully!', 'success'))
            .catch((error) => showToast('Error updating player: ' + error.message, 'danger'));
        editMode = false;
    } else {
        let nextId = 1;
        if (playersData && playersData.length > 0) {
            const maxId = playersData.reduce((max, p) => {
                const currentId = parseInt(p.id, 10);
                return currentId > max ? currentId : max;
            }, 0);
            nextId = maxId + 1;
        }
        
        const newPlayerId = String(nextId).padStart(2, '0');
        
        playersRef.child(newPlayerId).set(playerData)
            .then(() => showToast('Player created successfully!', 'success'))
            .catch((error) => showToast('Error creating player: ' + error.message, 'danger'));
    }

    const modalElement = document.getElementById('createPlayerModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
    
    document.getElementById('playerForm').reset();
    document.getElementById('modalTitle').textContent = 'Create New Player';
    document.getElementById('submitBtn').textContent = 'Submit';
    document.getElementById('playerStyle').disabled = true;
}

function editPlayer(id) {
    if (userRole !== 'admin') {
        showToast('Only administrators can edit players.', 'danger');
        return;
    }

    const player = playersData.find(p => p.id === id);
    if (!player) return;

    editMode = true;
    document.getElementById('modalTitle').textContent = 'Edit Player';
    document.getElementById('submitBtn').textContent = 'Update';
    document.getElementById('playerId').value = player.id;
    document.getElementById('playerFirstName').value = player.firstName || '';
    document.getElementById('playerLastName').value = player.lastName || '';
    document.getElementById('playerDOB').value = player.dob || '';
    
    const sportSelect = document.getElementById('playerSport');
    if (sportSelect.tagName === 'SELECT') {
         sportSelect.value = selectedSport;
    }
   
    updateRoleOptions();
    document.getElementById('playerRole').value = player.role || '';
    updateStyleOptions();
    document.getElementById('playerStyle').value = player.style || '';
    document.querySelector(`input[name="gender"][value="${player.gender}"]`).checked = true;
    // nationality and description
    updateNationalityOptions();
    const natEl = document.getElementById('playerNationality');
    if (natEl) natEl.value = player.nationality || '';
    populateDescription(player.description);

    new bootstrap.Modal(document.getElementById('createPlayerModal')).show();
}

function showDescription(id) {
    const player = playersData.find(p => p.id === id);
    if (!player) return;
    const titleEl = document.getElementById('descriptionTitle');
    const bodyEl = document.getElementById('descriptionBody');
    if (titleEl) titleEl.textContent = `${player.firstName || ''} ${player.lastName || ''}`.trim() || player.name || 'Player Description';
    if (bodyEl) {
        const nat = player.nationality ? `<p><strong>Nationality:</strong> ${player.nationality}</p>` : '';
        let desc = '<p>No description available.</p>';
        if (player.description) {
            const points = player.description.split('\n').filter(point => point.trim());
            if (points.length > 0) {
                desc = '<ul>' + points.map(point => `<li>${point.trim()}</li>`).join('') + '</ul>';
            }
        }
        bodyEl.innerHTML = `${nat}${desc}`;
    }
    const descModalEl = document.getElementById('descriptionModal');
    if (descModalEl) new bootstrap.Modal(descModalEl).show();
}

// Delete flow: open confirm modal and perform delete on confirm
function deletePlayer(id) {
    // store id and show confirmation modal
    deleteCandidateId = id;
    const deleteModalEl = document.getElementById('deleteConfirmModal');
    if (deleteModalEl) {
        new bootstrap.Modal(deleteModalEl).show();
    }
}

function confirmDelete() {
    if (!deleteCandidateId) return;
    playersRef.child(deleteCandidateId).remove()
        .then(() => {
            showToast('Player deleted successfully!', 'success');
            // refresh the table
            showPlayers();
        })
        .catch((err) => {
            showToast('Error deleting player: ' + (err.message || err), 'danger');
        })
        .finally(() => {
            const deleteModalEl = document.getElementById('deleteConfirmModal');
            const modalInstance = bootstrap.Modal.getInstance(deleteModalEl);
            if (modalInstance) modalInstance.hide();
            deleteCandidateId = null;
        });
}

// ===== Tab highlight helper =====
function setActiveTab(button) {
    document.querySelectorAll('#roleTabs .nav-link').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Search functionality
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchQuery = searchInput.value;
        showPlayers();
    }
}