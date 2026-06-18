const bcrypt = require('bcryptjs');
const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'User',
  collection: 'users',
  refs: { institution: 'Institution', committee: 'Committee' },
  selectExclude: ['password'],
  unique: ['email'],
  async beforeSave(doc) {
    if (doc.password && !String(doc.password).startsWith('$2')) {
      doc.password = await bcrypt.hash(doc.password, 12);
    }
  },
  methods: {
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    },
    getFullName() {
      return `${this.firstName} ${this.lastName}`;
    },
  },
});
