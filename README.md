# AutoBlog Pro - Desktop Application

**AI-Powered Blog Generation for Windows & Mac**

## Customer Flow

### 1. Purchase (on autoblogpro.in)
- Visit autoblogpro.in
- Enter email → Receive OTP  
- Pay $29 via Stripe
- Receive download link via email

### 2. Install & Activate
- Download installer (.exe for Windows / .dmg for Mac)
- Install AutoBlog Pro
- Open application
- **License Activation Screen:**
  - Enter your email
  - Enter license key (from purchase email)
  - Click "Activate" (validates against autoblogpro.in)

### 3. Configure Settings
- **Settings Screen:**
  - Enter OpenAI API key
  - Enter website URL
  - (Optional) WordPress credentials for auto-publishing

### 4. Generate Blogs
- Dashboard opens
- Enter blog topic
- AI generates complete blog post
- Publish to WordPress or export

Thank you for purchasing AutoBlog Pro! This software enables you to automatically generate and publish high-quality blog posts using AI.

## Features

- 🤖 **AI-Powered Content Generation** - Uses OpenAI GPT to create professional blog posts
- 🌐 **Industry Detection** - Automatically analyzes your website to determine your industry
- 📅 **Blog Post Scheduling** - Schedule posts for automatic publishing
- 🔄 **Auto-Publishing** - Publish directly to your website or export for manual upload
- 🔐 **Secure & Private** - All data stored locally on your computer
- 🎨 **Embeddable Widget** - Add a blog feed widget to any page on your website

## Quick Start

### Prerequisites

- Node.js 18 or higher ([Download here](https://nodejs.org/))
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Extract the files** to a folder on your computer

2. **Open a terminal/command prompt** in the extracted folder

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

5. **Open your browser** to:
   ```
   http://localhost:3000
   ```

### First-Time Setup

1. **Create your admin account** - The first time you open AutoBlog Pro, you'll be prompted to create a username and password

2. **Configure your settings:**
   - Enter your website URL
   - Add your OpenAI API key
   - Customize your blog settings

3. **Generate your first blog post!**

## How to Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** in your account settings
4. Click **"Create new secret key"**
5. Copy the key and paste it into AutoBlog Pro settings
6. Add billing information to OpenAI (required for API usage)

### Pricing Notes

- OpenAI charges per API usage (typically $0.10 - $0.50 per blog post)
- You pay OpenAI directly - not us
- Monitor your usage at [OpenAI Usage](https://platform.openai.com/usage)

## Using AutoBlog Pro

### Generating Blog Posts

1. Click **"Generate New Post"**
2. Enter a topic or let AI choose based on your industry
3. Review and edit the generated content
4. Schedule for publishing or publish immediately

### Scheduling Posts

1. Go to **"Scheduled Posts"** tab
2. Set the date and time for publication
3. AutoBlog Pro will auto-publish at the scheduled time (app must be running)

### Publishing Options

- **Direct Publishing** - Publish to WordPress sites automatically
- **Manual Export** - Download HTML/Markdown for manual upload
- **Widget Code** - Get embed code for your website

### Embedding the Blog Feed

1. Go to **"Settings" → "Widget"**
2. Copy the generated code snippet
3. Paste it into your website's HTML where you want the blog feed to appear

## Troubleshooting

### App Won't Start

- Make sure Node.js is installed (`node --version`)
- Try deleting `node_modules` folder and run `npm install` again

### Can't Generate Posts

- Check your OpenAI API key is correct
- Ensure you have billing set up with OpenAI
- Check your internet connection

### Posts Not Publishing

- Verify your website URL is correct
- For WordPress, ensure you have the REST API enabled
- Check that the app is running during scheduled publish times

## Technical Support

For questions or issues:
- Email: support@autoblogpro.com
- Documentation: https://docs.autoblogpro.com

## Security & Privacy

- All data is stored locally on your computer
- We never see your blog posts or API keys
- Your OpenAI key stays between you and OpenAI

## Updates

We'll email you when new versions are available. To update:
1. Download the new version
2. Extract to a new folder
3. Copy your `database.sqlite` file from the old folder to keep your data

---

**Enjoy creating amazing content with AutoBlog Pro!**
