class HotelChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.imageInput = document.getElementById('imageInput');
        this.loading = document.getElementById('loading');
        
        // Update these with your actual Flask routes
        this.API_ENDPOINT = window.location.origin;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.sendBtn.addEventListener('click', () => this.handleUserInput());
        this.voiceBtn.addEventListener('click', () => this.startVoiceRecognition());
        this.imageBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
    }

    async handleUserInput() {
        const userMessage = this.userInput.value.trim();
        if (!userMessage) return;

        this.addMessage(userMessage, 'user');
        this.userInput.value = '';
        await this.getHotelResponse(userMessage);
    }

    startVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            this.addMessage('Voice recognition is not supported in your browser.', 'bot');
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            this.voiceBtn.style.backgroundColor = '#ff4444';
            this.addMessage('Listening...', 'bot');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.userInput.value = transcript;
            this.handleUserInput();
        };

        recognition.onerror = (event) => {
            this.addMessage('Error occurred in voice recognition: ' + event.error, 'bot');
            this.voiceBtn.style.backgroundColor = '#2c3e50';
        };

        recognition.onend = () => {
            this.voiceBtn.style.backgroundColor = '#2c3e50';
        };

        recognition.start();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'image-preview';
            
            this.addMessage('', 'user', img);
            await this.processImage(file);
        };
        reader.readAsDataURL(file);
    }

    async processImage(file) {
        try {
            this.loading.style.display = 'block';
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.API_ENDPOINT}/api/process-image`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            this.addMessage(data.message, 'bot');
        } catch (error) {
            this.addMessage('Error processing image. Please try again.', 'bot');
        } finally {
            this.loading.style.display = 'none';
        }
    }

    async getHotelResponse(query) {
        try {
            this.loading.style.display = 'block';
            const response = await fetch(`${this.API_ENDPOINT}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            
            if (data.error) {
                this.addMessage(data.message, 'bot');
            } else {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message bot-message';
                messageDiv.innerHTML = data.message;
                this.chatMessages.appendChild(messageDiv);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }
        } catch (error) {
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        } finally {
            this.loading.style.display = 'none';
        }
    }

    addMessage(message, sender, element = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        if (element) {
            messageDiv.appendChild(element);
        }
        
        if (message) {
            const textDiv = document.createElement('div');
            textDiv.textContent = message;
            messageDiv.appendChild(textDiv);
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HotelChatBot();
});