# Chatbot Setup Guide

The AgriReach chatbot uses OpenAI's GPT-4o-mini model to provide helpful assistance to users.

## Prerequisites

1. An OpenAI account
2. An OpenAI API key

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy your API key (you won't be able to see it again!)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here
```

**Important:** 
- Never commit your API key to version control
- Keep your API key secure
- The `.env.local` file is already in `.gitignore`

### 3. Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

## Testing

1. Open the chat widget (bottom-right corner)
2. Click on the "Chatbot" tab
3. Send a message to test the chatbot

## Troubleshooting

### Error: "OpenAI API key is not configured"

- Make sure you've added `OPENAI_API_KEY` to your `.env.local` file
- Restart your development server after adding the key
- Check that the key starts with `sk-`

### Error: "Failed to get response"

- Check your OpenAI API key is valid
- Ensure you have credits in your OpenAI account
- Check the browser console and server logs for more details

### Chatbot not responding

- Verify your OpenAI account has available credits
- Check the network tab in browser dev tools
- Review server logs for API errors

## Cost Considerations

- GPT-4o-mini is a cost-effective model
- Each conversation uses approximately 500 tokens max
- Monitor your usage in the OpenAI dashboard
- Set up billing alerts to avoid unexpected charges

## Model Information

- **Model**: GPT-4o-mini
- **Max Tokens**: 500 per response
- **Purpose**: General assistance for AgriReach platform questions

