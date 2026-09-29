import { StorageHelper } from '../lib/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Tab Switching Logic
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      
      if (btn.dataset.tab === 'tracker') {
        renderContacts();
      }
    });
  });

  // Settings Logic
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    const settings = await StorageHelper.getSettings();
    document.getElementById('settings-provider').value = settings.provider;
    document.getElementById('settings-apikey').value = settings.apiKey;
    document.getElementById('settings-interval').value = settings.interval;
    document.getElementById('settings-max').value = settings.maxFollowUps;

    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await StorageHelper.saveSettings({
        provider: document.getElementById('settings-provider').value,
        apiKey: document.getElementById('settings-apikey').value,
        interval: parseInt(document.getElementById('settings-interval').value, 10),
        maxFollowUps: parseInt(document.getElementById('settings-max').value, 10)
      });
      alert('Settings saved!');
    });
  }

  // Add Contact Logic
  const addForm = document.getElementById('add-contact-form');
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newContact = {
        name: document.getElementById('contact-name').value,
        role: document.getElementById('contact-role').value,
        company: document.getElementById('contact-company').value,
        channel: document.getElementById('contact-channel').value,
        status: document.getElementById('contact-status').value,
      };
      await StorageHelper.addContact(newContact);
      addForm.reset();
      
      // Switch back to tracker tab
      document.querySelector('[data-tab="tracker"]').click();
    });
  }

  // Render Contacts Logic
  async function renderContacts() {
    const container = document.getElementById('contacts-container');
    container.innerHTML = '';
    
    const contacts = await StorageHelper.getContacts();
    
    if (contacts.length === 0) {
      container.innerHTML = '<div class="empty-state">No contacts added yet. Switch to the Add tab!</div>';
      return;
    }

    // Group by status
    const grouped = {
      'Follow-up due': [],
      'Sent': [],
      'Replied': [],
      'Closed': [],
      'Dropped': []
    };

    contacts.forEach(c => {
      if (grouped[c.status]) grouped[c.status].push(c);
    });

    for (const [status, group] of Object.entries(grouped)) {
      if (group.length === 0) continue;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'status-group';
      groupDiv.innerHTML = `<div class="status-header">${status} (${group.length})</div>`;

      group.forEach(contact => {
        const daysSince = Math.floor((new Date() - new Date(contact.lastActionDate)) / (1000 * 60 * 60 * 24));
        
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
          <div class="contact-header">
            <p class="contact-name">${contact.name}</p>
          </div>
          <p class="contact-meta">${contact.role} @ ${contact.company} • via ${contact.channel} • ${daysSince} days ago</p>
          <div class="contact-actions">
            ${status !== 'Replied' ? `<button class="action-btn" data-action="Replied" data-id="${contact.id}">Mark Replied</button>` : ''}
            ${status === 'Follow-up due' || status === 'Sent' ? `<button class="action-btn" data-action="Sent" data-id="${contact.id}">Log Follow-Up</button>` : ''}
            ${status !== 'Closed' && status !== 'Dropped' ? `<button class="action-btn" data-action="Closed" data-id="${contact.id}">Close</button>` : ''}
            ${status !== 'Dropped' ? `<button class="action-btn" data-action="Dropped" data-id="${contact.id}">Drop</button>` : ''}
          </div>
        `;
        groupDiv.appendChild(card);
      });
      container.appendChild(groupDiv);
    }

    // Bind action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const action = e.target.dataset.action;
        await StorageHelper.updateContactStatus(id, action);
        renderContacts();
      });
    });
  }

  // Initial render
  renderContacts();
});
