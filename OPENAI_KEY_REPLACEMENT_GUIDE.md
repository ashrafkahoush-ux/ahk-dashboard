# 🔑 OpenAI API Key Replacement Guide

## Current Status
Your OpenAI API key is returning a `401 Unauthorized` error, which means:
- The key has expired
- The key was revoked
- The key format is incorrect
- Billing may have lapsed

## Steps to Get a New Key

### 1. Visit OpenAI Platform
Go to: https://platform.openai.com/api-keys

### 2. Sign In
Log in with your OpenAI account (ashraf.kahoush@gmail.com or your OpenAI account email)

### 3. Create New API Key
1. Click "**+ Create new secret key**"
2. Give it a name: "**AHK Dashboard**" or "**Emma AI Assistant**"
3. Set permissions: **All** (or at minimum: Model capabilities)
4. Click "**Create secret key**"

### 4. Copy the Key
**IMPORTANT:** The key will only be shown ONCE!
- It will look like: `sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
- Copy it immediately - you won't see it again

### 5. Update .env.local
Replace BOTH occurrences in your `.env.local` file:

**Line 19:**
```bash
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

**Line 87:**
```bash
OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

### 6. Restart Backend
After updating the key:
1. Stop the backend (Ctrl+C in the backend terminal)
2. Start it again: `node server/index.js`
3. You'll see: `✅ OPENAI_API_KEY: Loaded`

### 7. Verify
Run this test:
```powershell
node test_all_apis.js
```

You should see:
```
✅ OpenAI Configuration: PASS
✅ OpenAI API Call: PASS
```

---

## Quick Test Command
After updating the key, test it quickly:

```powershell
$env:OPENAI_API_KEY="your-new-key-here"; node -e "const OpenAI = require('openai'); const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY}); openai.chat.completions.create({model: 'gpt-4', messages: [{role: 'user', content: 'Hello'}], max_tokens: 5}).then(r => console.log('✅ OpenAI Working:', r.choices[0].message.content)).catch(e => console.error('❌ Error:', e.message));"
```

---

## Billing Check
If the key still doesn't work, check your billing:
1. Go to: https://platform.openai.com/account/billing
2. Verify you have an active payment method
3. Check your usage limits and quotas

---

## Alternative: Use Existing Key from Yesterday
You mentioned you created a key yesterday. Look for it in:
- Your OpenAI dashboard: https://platform.openai.com/api-keys
- Your email (OpenAI sends confirmation emails)
- Your password manager or notes

If you find it, just copy it to `.env.local` lines 19 and 87.

---

**Need Help?** I can test the key after you update it by running `node test_all_apis.js`
