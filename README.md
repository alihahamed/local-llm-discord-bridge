# Local LLM Discord Bridge

A sophisticated Discord bot that integrates local language model processing with natural language understanding to provide intelligent, context-aware responses in Discord channels.

## Overview

Local LLM Discord Bridge is a Node.js-based Discord bot designed to bridge user interactions on Discord with a local large language model (LLM) instance. Utilizing advanced natural language processing (NLP) techniques, the bot classifies user intents and generates personalized responses through a local LLM, creating an engaging conversational experience.

The bot employs a hybrid approach combining rule-based intent classification with generative AI capabilities, ensuring responsive and contextually appropriate interactions.

## Features

- **Local LLM Integration**: Connects to a local Ollama instance running Llama 3.2 for generating intelligent responses
- **NLP-Powered Intent Recognition**: Uses Node-NLP for accurate classification of user intents with customizable training corpora
- **Discord.js Integration**: Seamless integration with Discord's API for real-time message processing
- **Modular Architecture**: Easily extensible system with customizable system prompts and intent handling
- **Training Data Management**: Built-in support for corpus-based model training and persistence

## Prerequisites

- Node.js (v14 or higher)
- Discord Bot Token (obtain from Discord Developer Portal)
- Local Ollama instance running Llama 3.2 model
- npm package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd local-llm-discord-bridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```

4. Ensure Ollama is running locally with the Llama 3.2 model:
   ```bash
   ollama serve
   ollama run llama3.2
   ```

## Configuration

### Training Corpus

Edit `corpus.json` to customize the bot's intent recognition. Each intent should include:
- `intent`: Unique identifier for the intent
- `utterances`: Array of example phrases that trigger the intent

### System Prompts

Modify the intent-to-system-prompt mapping in `index.js` to customize response behaviors for different recognized intents.

### LLM Configuration

The bot connects to Ollama at `http://127.0.0.1:11434/api/generate`. Ensure your local instance is accessible at this endpoint.

## Usage

1. Start the bot:
   ```bash
   node index.js
   ```

2. Invite the bot to your Discord server using the OAuth2 URL generated in the Discord Developer Portal.

3. Mention the bot in messages (e.g., `@YourBot hello`) to trigger responses.

The bot will:
- Analyze incoming messages mentioning it
- Classify the intent using the trained NLP model
- Generate a system prompt corresponding to the intent
- Query the local LLM with the user message and system prompt
- Respond with the generated text in the Discord channel

## Project Structure

```
.
├── index.js           # Main application file
├── corpus.json        # NLP training data
├── model.nlp          # Trained NLP model
├── package.json       # Node.js dependencies
├── .env              # Environment variables
└── README.md         # Project documentation
```

## Dependencies

- `discord.js`: Discord API integration
- `node-nlp`: Natural language processing and intent classification
- `dotenv`: Environment variable management
- `express`: Web framework (future extensibility)
- `nodemailer`: Email functionality (future features)

## Development

### Training the NLP Model

The bot automatically trains or loads the NLP model on startup. To retrain:

1. Delete `model.nlp`
2. Edit `corpus.json` as needed
3. Restart the bot

### Customization

- Modify intent handling in `index.js` to add new behaviors
- Extend the corpus for improved intent recognition
- Integrate additional APIs or services as needed

## Contributing

Contributions are welcome. Please fork the repository and submit a pull request for review.

## License

ISC License - See package.json for details.

## Support

For issues or questions, please open an issue on the GitHub repository.
