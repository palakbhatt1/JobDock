export const StorageHelper = {
  async getContacts() {
    const data = await chrome.storage.local.get("contacts");
    return data.contacts || [];
  },
  async setContacts(contacts) {
    await chrome.storage.local.set({ contacts });
  },
  async addContact(contact) {
    const contacts = await this.getContacts();
    contact.id = Date.now().toString();
    contact.lastActionDate = new Date().toISOString();
    contacts.push(contact);
    await this.setContacts(contacts);
  },
  async updateContactStatus(id, newStatus) {
    const contacts = await this.getContacts();
    const contact = contacts.find(c => c.id === id);
    if (contact) {
      contact.status = newStatus;
      contact.lastActionDate = new Date().toISOString();
      await this.setContacts(contacts);
    }
  },
  async deleteContact(id) {
    const contacts = await this.getContacts();
    const newContacts = contacts.filter(c => c.id !== id);
    await this.setContacts(newContacts);
  },
  async getSettings() {
    const data = await chrome.storage.local.get("settings");
    return data.settings || {
      provider: 'gemini',
      apiKey: '',
      interval: 3,
      maxFollowUps: 2
    };
  },
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
  }
};
