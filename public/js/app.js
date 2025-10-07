function showMessage(message, type = 'info') {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  setTimeout(() => {
    messagesDiv.innerHTML = '';
  }, 5000);
}

function showSaveIndicator(element, success = true) {
  const indicator = document.createElement('span');
  indicator.className = `save-indicator ms-2 ${success ? 'text-success' : 'text-danger'}`;
  indicator.innerHTML = success
    ? '<i class="bi bi-check-circle"></i>'
    : '<i class="bi bi-x-circle"></i>';

  element.appendChild(indicator);
  setTimeout(() => indicator.classList.add('show'), 10);

  setTimeout(() => {
    indicator.classList.remove('show');
    setTimeout(() => indicator.remove(), 300);
  }, 2000);
}

/* CREATE — Add a new game */
document.getElementById('addGameForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const game = {
    title: document.getElementById('gameTitle').value.trim(),
    platform: document.getElementById('platform').value.trim(),
    status: document.getElementById('status').value.trim()
  };

  if (!game.title || !game.platform) {
    showMessage('Please provide a Game Title and Platform.', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game)
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(`Game "${game.title}" added successfully!`, 'success');
      document.getElementById('addGameForm').reset();
      loadGames();
    } else {
      showMessage(`Error: ${result.error || 'Failed to add game.'}`, 'danger');
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, 'danger');
  }
});

/* READ — Load all games*/
async function loadGames() {
  try {
    const response = await fetch('/api/games');
    const games = await response.json();

    const gamesList = document.getElementById('gamesList');

    if (!Array.isArray(games) || games.length === 0) {
      gamesList.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="bi bi-arrow-up-circle fs-1"></i>
          <p>Click "Seed Database" to load sample games, then try inline editing!</p>
        </div>
      `;
      showMessage('No games found. Try seeding the database!', 'info');
      return;
    }

    gamesList.innerHTML = games.map(game => `
      <div class="card mb-3 game-card" data-game-id="${game._id}">
        <div class="card-body">
          <div class="row align-items-center g-3">
            <div class="col-md-4">
              <strong>Title:</strong>
              <div
                class="editable-field"
                data-field="title"
                data-game-id="${game._id}"
                title="Click to edit Title"
              >${game.title || ''}</div>
            </div>

            <div class="col-md-3">
              <strong>Platform:</strong>
              <div
                class="editable-field"
                data-field="platform"
                data-game-id="${game._id}"
                title="Click to edit Platform"
              >${game.platform || ''}</div>
            </div>

            <div class="col-md-3">
              <strong>Status:</strong>
              <div
                class="editable-field"
                data-field="status"
                data-game-id="${game._id}"
                title="Click to edit Status"
              >${game.status || ''}</div>
            </div>

            <div class="col-md-2 text-end">
              <button class="btn btn-outline-danger btn-sm"
                      onclick="deleteGame('${game._id}', '${(game.title || '').replace(/'/g, "\\'")}')">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>

            <div class="col-12">
              <small class="text-muted">
                <i class="bi bi-tag"></i> ID: ${game._id}
              </small>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    addInlineEditListeners();
    showMessage(`Loaded ${games.length} game(s). Click any field to edit!`, 'info');
  } catch (error) {
    showMessage(`Error loading games: ${error.message}`, 'danger');
  }
}

/* Inline editing */
function addInlineEditListeners() {
  document.querySelectorAll('.editable-field').forEach(field => {
    field.addEventListener('click', function () {
      if (this.querySelector('input')) return; // already editing

      const currentValue = this.textContent.trim();
      const fieldName = this.getAttribute('data-field'); // 'title' | 'platform' | 'status'
      const gameId = this.getAttribute('data-game-id');

      // Input element
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentValue;
      input.className = 'form-control form-control-sm';

      // Editing style
      this.classList.add('editing');
      this.innerHTML = '';
      this.appendChild(input);

      input.focus();
      input.select();

      const saveEdit = async () => {
        const newValue = input.value.trim();

        if (!newValue) {
          this.textContent = currentValue;
          this.classList.remove('editing');
          showMessage('Value cannot be empty', 'warning');
          return;
        }

        if (newValue === currentValue) {
          this.textContent = currentValue;
          this.classList.remove('editing');
          return;
        }

        const ok = await updateGameField(gameId, fieldName, newValue);

        if (ok) {
          this.textContent = newValue;
          showSaveIndicator(this, true);
        } else {
          this.textContent = currentValue;
          showSaveIndicator(this, false);
        }

        this.classList.remove('editing');
      };

      input.addEventListener('blur', saveEdit);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') {
          this.textContent = currentValue;
          this.classList.remove('editing');
        }
      });
    });
  });
}

/* UPDATE — single field*/
async function updateGameField(gameId, field, value) {
  try {
    const updateData = { [field]: value };
    const response = await fetch(`/api/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(`${field[0].toUpperCase() + field.slice(1)} updated successfully!`, 'success');
      return true;
    } else {
      showMessage(`Error: ${result.error || 'Update failed.'}`, 'danger');
      return false;
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, 'danger');
    return false;
  }
}

/* DELETE — remove a game*/
async function deleteGame(id, title) {
  if (!confirm(`Delete "${title}"?`)) return;

  try {
    const response = await fetch(`/api/games/${id}`, { method: 'DELETE' });
    const result = await response.json();

    if (response.ok) {
      showMessage(`Game "${title}" deleted.`, 'success');

      // Smooth removal
      const card = document.querySelector(`[data-game-id="${id}"]`);
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-16px)';
        setTimeout(() => card.remove(), 250);
      }
    } else {
      showMessage(`Error: ${result.error || 'Delete failed.'}`, 'danger');
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, 'danger');
  }
}

/*Seed & Cleanup*/
async function seedDatabase() {
  if (!confirm('This will add sample games to the database. Continue?')) return;

  try {
    showMessage('Seeding database...', 'info');
    const response = await fetch('/api/seed', { method: 'POST' });
    const result = await response.json();

    if (response.ok) {
      showMessage(result.message || 'Database seeded!', 'success');
      loadGames();
    } else {
      showMessage(`Error: ${result.error || 'Seed failed.'}`, 'danger');
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, 'danger');
  }
}

async function cleanupDatabase() {
  if (!confirm('This will DELETE ALL games. Are you sure?')) return;

  try {
    showMessage('Cleaning database...', 'info');
    const response = await fetch('/api/cleanup', { method: 'DELETE' });
    const result = await response.json();

    if (response.ok) {
      showMessage(result.message || 'All games deleted.', 'success');
      loadGames();
    } else {
      showMessage(`Error: ${result.error || 'Cleanup failed.'}`, 'danger');
    }
  } catch (error) {
    showMessage(`Network error: ${error.message}`, 'danger');
  }
}

/* Boot */
window.addEventListener('load', loadGames);
