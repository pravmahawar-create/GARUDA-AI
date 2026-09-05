require('dotenv').config();
const mongoose = require('mongoose');

async function checkLatest() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/garuda_ai';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    const convs = await mongoose.connection.db.collection('conversations')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray();

    convs.forEach(c => {
      console.log('\n=== THREAD:', c.threadId, '| Updated:', c.updatedAt);
      if (c.messages && c.messages.length) {
        c.messages.slice(-5).forEach(m => {
          const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
          console.log(`[${m.role}] (${m.createdAt}): ${content}`);
        });
      }
    });
    await mongoose.disconnect();
  } catch (e) {
    console.error('Local Mongo error, checking Render cloud API...', e.message);
    const fetch = globalThis.fetch;
    const res = await fetch('https://garuda-ai-xfif.onrender.com/api/conversations?limit=3');
    const data = await res.json();
    console.log('Render conversations:', JSON.stringify(data, null, 2));
  }
}

checkLatest();
