/**
 * ProSigmaka AI Chat System
 * Advanced chat integration with API authentication and project management
 * */
// Delete all local storage temporarily for testing
localStorage.clear();

// Configuration for API Integration - Global scope
const API_CONFIG = {
    // Server configuration
    serverAddress: 'https://aivena-assist.prodemy.id',
    
    // API endpoints
    loginEndpoint: 'https://aivena-assist.prodemy.id/api/v1/token',
    projectsEndpoint: 'https://aivena-assist.prodemy.id/api/v1/projects',
    baseURL: 'https://aivena-assist.prodemy.id/api/v1',
    
    // Login credentials
    credentials: {
        email: 'desdrianton@gmail.com',
        password: '123123'
    },
    
    // Request timeout in milliseconds
    timeout: 30000,
    
    // Maximum retry attempts
    maxRetries: 3,
    
    // Retry delay in milliseconds
    retryDelay: 1000,
    
    // Token configuration
    tokenKey: 'prosigmaka_chat_token',
    tokenExpiryKey: 'prosigmaka_token_expiry'
};

// AI Chat functionality
const initChatFunctionality = () => {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatInput || !sendButton || !typingIndicator || !chatMessages) return;
    


    // API_CONFIG is now available globally

    // Markdown parsing utility
    function parseMarkdown(text) {
        if (!text) return '';
        
        // Convert text to string if it's not already
        let html = String(text);
        
        // Parse bold text (**text** or __text__)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Parse italic text (*text* or _text_)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Parse inline code (`code`)
        html = html.replace(/`(.*?)`/g, '<code class="bg-gray-600 px-1 py-0.5 rounded text-xs">$1</code>');
        
        // Parse links [text](url)
        html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" class="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Parse line breaks (double newline = paragraph, single newline = br)
        html = html.replace(/\n\n/g, '</p><p class="mb-2">');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraph if not already wrapped
        if (!html.startsWith('<p')) {
            html = '<p class="mb-2">' + html + '</p>';
        }
        
        // Parse numbered lists (1. item)
        html = html.replace(/(\d+)\.\s+(.*?)(?=<br>|\d+\.|$)/g, '<div class="ml-4 mb-1">$1. $2</div>');
        
        // Parse bullet points (- item or * item)
        html = html.replace(/^[-*]\s+(.*?)(?=<br>|[-*]|$)/gm, '<div class="ml-4 mb-1">• $1</div>');
        
        return html;
    }

    // UI Helper Functions
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex space-x-3 justify-end animate-fadeIn';
        messageDiv.innerHTML = `
            <div class="flex-1 max-w-xs sm:max-w-sm bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl rounded-br-none p-4 shadow-lg">
                <p class="text-white text-sm sm:text-base">${message}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addAIMessage(message) {
        // Parse markdown first
        const parsedMessage = parseMarkdown(message);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex space-x-3 animate-fadeIn';
        messageDiv.innerHTML = `
            <div class="flex-1 bg-blue-500/10 border border-cyan-400/20 rounded-2xl rounded-tl-none p-4 shadow-lg">
                <div class="text-gray-200 text-sm sm:text-base leading-relaxed">${parsedMessage}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        typingIndicator.classList.remove('hidden');
    }

    function hideTypingIndicator() {
        typingIndicator.classList.add('hidden');
    }

    function disableChatInput() {
        sendButton.disabled = true;
        chatInput.disabled = true;
        chatInput.placeholder = 'Menunggu respons...';
    }

    function enableChatInput() {
        sendButton.disabled = false;
        chatInput.disabled = false;
        chatInput.placeholder = 'Mulai chat dengan AI...';
        chatInput.focus();
    }

    function showErrorMessage(message) {
        // Create temporary error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    function addErrorMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex space-x-3 animate-fadeIn';
        messageDiv.innerHTML = `
            <div class="flex-1 bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-400/20 rounded-2xl rounded-tl-none p-4 shadow-lg">
                <p class="text-red-300 text-sm sm:text-base leading-relaxed">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    ${message}
                </p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Token Management Functions
    function getStoredToken() {
        const token = localStorage.getItem(API_CONFIG.tokenKey);
        const expiry = localStorage.getItem(API_CONFIG.tokenExpiryKey);
        
        if (!token || !expiry) {
            return null;
        }
        
        // Check if token is expired (with 5 minute buffer)
        const expiryDate = new Date(expiry);
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const now = new Date();
        
        if (now.getTime() >= (expiryDate.getTime() - bufferTime)) {
            // Token is expired or about to expire
            clearStoredToken();
            return null;
        }
        
        return token;
    }

    function storeToken(token, expiresIn = 3600) {
        // Store token and calculate expiry time
        const expiryDate = new Date();
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
        
        localStorage.setItem(API_CONFIG.tokenKey, token);
        localStorage.setItem(API_CONFIG.tokenExpiryKey, expiryDate.toISOString());
        
        console.log('Token stored successfully, expires at:', expiryDate.toISOString());
    }

    function clearStoredToken() {
        localStorage.removeItem(API_CONFIG.tokenKey);
        localStorage.removeItem(API_CONFIG.tokenExpiryKey);
        console.log('Token cleared from storage');
    }

    // Login function to get authentication token
    async function loginAndGetToken() {
        console.log('Attempting to login and get token...');
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            const response = await fetch(API_CONFIG.loginEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(API_CONFIG.credentials),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Login failed: HTTP ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Login response:', data);
            
            // Extract token from response - adjust based on actual API response structure
            let token = null;
            let expiresIn = 3600; // Default 1 hour
            
            // Common token response formats
            if (data.result.access_token) {
                token = data.result.access_token;
            }
            
            if (!token) {
                throw new Error('No token received from login response');
            }
            
            // Store the token
            storeToken(token, expiresIn);
            
            return token;
            
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Login request timed out');
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to authentication server');
            }
            
            throw error;
        }
    }

    // Get valid token (login if needed)
    async function getValidToken() {
        // First, try to get stored token
        let token = getStoredToken();
        
        if (token) {
            console.log('Using stored token');
            return token;
        }
        
        // If no valid stored token, login to get new one
        console.log('No valid stored token, logging in...');
        token = await loginAndGetToken();
        
        return token;
    }

    // Project Management Functions
    function getStoredProjectId() {
        return localStorage.getItem('prosigmaka_project_id');
    }

    function storeProjectId(projectId) {
        localStorage.setItem('prosigmaka_project_id', projectId);
        console.log('Project ID stored:', projectId);
    }

    // Fetch projects from API
    async function fetchProjects() {
        console.log('Fetching projects from API...');
        
        try {
            const token = await getValidToken();
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            const response = await fetch(API_CONFIG.projectsEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch projects: HTTP ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Projects API response:', data);
            
            return data;
            
        } catch (error) {
            console.error('Error fetching projects:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Projects request timed out');
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to projects API');
            }
            
            throw error;
        }
    }

    // Get or fetch project ID
    async function getProjectId() {
        // Check if we have a stored project ID
        let projectId = getStoredProjectId();
        
        if (projectId) {
            console.log('Using stored project ID:', projectId);
            return projectId;
        }
        
        try {
            // Fetch projects from API
            const projectsData = await fetchProjects();

            console.log('Projects data received:', projectsData)
            
            // Extract projects array from response
            let projects = [];

            console.log("juragan", projects)
            
            if (Array.isArray(projectsData.result)) {
                projects = projectsData.result;
                console.log('Projects found as root array, count:', projects.length);
            } else {
                console.warn('Unexpected projects API response structure:', projectsData);
            }
            
            console.log("juragan2", projects)

            if (projects.length === 0) {
                console.warn('No projects found in API response');
                return null;
            }
            
            // First, try to find project with name "AI Agent for www.prosigmaka.com"
            let selectedProject = projects.find(project => 
                project.name && project.name === "AI Agent for www.prosigmaka.com"
            );
            
            // If not found, use index 0 (first project)
            if (!selectedProject) {
                console.log('Project "AI Agent for www.prosigmaka.com" not found, using first project');
                selectedProject = projects[0];
            } else {
                console.log('Found target project "AI Agent for www.prosigmaka.com"');
            }
            
            // Extract project ID (adjust based on actual API response structure)
            let selectedProjectId = null;
            if (selectedProject.id) {
                selectedProjectId = selectedProject.id;
            }
            
            if (selectedProjectId) {
                console.log('Selected project:', {
                    id: selectedProjectId,
                    name: selectedProject.name || selectedProject.title || 'Unknown',
                    project: selectedProject
                });
                
                // Store the project ID for future use
                storeProjectId(selectedProjectId);
                
                return selectedProjectId;
            } else {
                console.warn('Could not extract project ID from project data:', selectedProject);
                return null;
            }
            
        } catch (error) {
            console.error('Failed to get project ID:', error);
            return null;
        }
    }

    // Function to manually select project by name or index
    async function selectProjectById(identifier) {
        try {
            const projectsData = await fetchProjects();

            console.log('Select project data:', projectsData)
            
            let projects = [];
            if (Array.isArray(projectsData)) {
                projects = projectsData;
            } else if (projectsData.data && Array.isArray(projectsData.data)) {
                projects = projectsData.data;
            } else if (projectsData.projects && Array.isArray(projectsData.projects)) {
                projects = projectsData.projects;
            }
            
            let selectedProject = null;
            
            // If identifier is a number, treat as index
            if (typeof identifier === 'number' && identifier >= 0 && identifier < projects.length) {
                selectedProject = projects[identifier];
            } else if (typeof identifier === 'string') {
                // Try to find by ID first, then by name
                selectedProject = projects.find(p => 
                    p.id === identifier || 
                    p.project_id === identifier || 
                    p._id === identifier ||
                    (p.name && p.name.toLowerCase().includes(identifier.toLowerCase())) ||
                    (p.title && p.title.toLowerCase().includes(identifier.toLowerCase()))
                );
            }
            
            if (selectedProject) {
                const projectId = selectedProject.id || selectedProject.project_id || selectedProject._id;
                storeProjectId(projectId);
                console.log('Project selected:', selectedProject);
                return projectId;
            } else {
                console.warn('Project not found with identifier:', identifier);
                return null;
            }
            
        } catch (error) {
            console.error('Error selecting project:', error);
            return null;
        }
    }

    // Conversation ID management functions
    function getStoredConversationId() {
        return localStorage.getItem('prosigmaka_conversation_id');
    }

    function storeConversationId(conversationId) {
        if (conversationId) {
            localStorage.setItem('prosigmaka_conversation_id', conversationId);
            console.log('Conversation ID stored:', conversationId);
        }
    }

    function clearConversationId() {
        localStorage.removeItem('prosigmaka_conversation_id');
        console.log('Conversation ID cleared');
    }

    // API call function with retry mechanism and token authentication
    async function callChatAPI(message, retryCount = 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        try {
            // Get valid authentication token
            const token = await getValidToken();
            
            // Get project ID
            const projectId = await getProjectId();
            if (!projectId) {
                throw new Error('Project ID is required for chat inference');
            }
            
            // Encode message for URL
            const encodedMessage = encodeURIComponent(message);
            
            // Check if we have stored conversation_id
            const storedConversationId = getStoredConversationId();
            
            // Build inference URL - add conversation_id only if it exists
            let inferenceURL = `${API_CONFIG.baseURL}/projects/${projectId}/inference?human_message=${encodedMessage}`;
            if (storedConversationId) {
                inferenceURL += `&conversation_id=${storedConversationId}`;
            }
            
            console.log('Sending chat request to:', inferenceURL);
            console.log('Request details:', {
                projectId: projectId,
                conversationId: storedConversationId || 'none',
                message: message,
                encodedMessage: encodedMessage
            });
            
            const response = await fetch(inferenceURL, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('Chat API response status:', response.status);
            
            // Handle authentication errors
            if (response.status === 401) {
                console.log('Authentication failed, clearing token and retrying...');
                clearStoredToken();
                
                // Retry once with fresh token
                if (retryCount === 0) {
                    return await callChatAPI(message, retryCount + 1);
                }
                
                throw new Error('Authentication failed - please refresh the page');
            }
            
            // Check if response is ok
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            console.log('Chat API response data:', data);
            
            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format');
            }
            
            // Store conversation_id from response if available
            if (data.result && data.result.conversation_id) {
                storeConversationId(data.result.conversation_id);
            }
            
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Chat API call error:', error);
            
            // Handle different error types
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Network connection failed');
            }
            
            // Handle token-related errors
            if (error.message.includes('Authentication failed') || 
                error.message.includes('Cannot connect to authentication server') ||
                error.message.includes('Login failed')) {
                throw new Error('Tidak dapat melakukan otentikasi. Silakan coba lagi atau hubungi administrator.');
            }
            
            // Retry mechanism for recoverable errors
            if (retryCount < API_CONFIG.maxRetries && isRetryableError(error)) {
                console.warn(`API call failed, retrying... (${retryCount + 1}/${API_CONFIG.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
                return await callChatAPI(message, retryCount + 1);
            }
            
            throw error;
        }
    }

    // Check if error is retryable
    function isRetryableError(error) {
        const retryableErrors = [
            'Network connection failed',
            'Request timed out',
            'HTTP 500',
            'HTTP 502',
            'HTTP 503',
            'HTTP 504'
        ];
        
        return retryableErrors.some(errorType => 
            error.message.includes(errorType)
        );
    }

    // Handle API errors with appropriate user feedback
    function handleChatError(error, originalMessage) {
        let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';
        let showFallback = true;
        
        if (error.message.includes('timed out')) {
            errorMessage = 'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.';
        } else if (error.message.includes('Network connection failed')) {
            errorMessage = 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.';
        } else if (error.message.includes('HTTP 429')) {
            errorMessage = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.';
        } else if (error.message.includes('HTTP 401') || error.message.includes('HTTP 403')) {
            errorMessage = 'Sesi Anda telah berakhir. Silakan refresh halaman.';
        } else if (error.message.includes('Authentication failed') || error.message.includes('otentikasi')) {
            errorMessage = 'Gagal melakukan otentikasi. Sistem akan menggunakan respons lokal.';
        } else if (error.message.includes('Login failed')) {
            errorMessage = 'Login ke server gagal. Menggunakan mode offline.';
        } else if (error.message.includes('Cannot connect to authentication server')) {
            errorMessage = 'Tidak dapat terhubung ke server otentikasi. Menggunakan mode offline.';
        } else if (error.message.includes('Project ID is required')) {
            errorMessage = 'Project tidak tersedia. Sistem akan menggunakan respons lokal.';
        } else if (error.message.includes('projects') && error.message.includes('inference')) {
            errorMessage = 'Layanan AI sedang tidak tersedia. Menggunakan respons lokal.';
        }
        
        // Log error for debugging
        console.error('Chat Error Details:', {
            error: error.message,
            originalMessage: originalMessage,
            timestamp: new Date().toISOString()
        });
        
        // Show error message to user
        addErrorMessage(errorMessage);
        
        // Provide fallback response
        if (showFallback) {
            setTimeout(() => {
                addAIMessage(getDefaultResponse(originalMessage));
            }, 1500);
        }
    }

    // Get default response for fallback scenarios
    function getDefaultResponse(message) {
        return 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi nanti atau hubungi tim kami di info@prosigmaka.com untuk bantuan langsung.';
    }

    // Enhanced sendMessage function with API integration
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        // Input validation
        if (!message) {
            showErrorMessage('Please enter a message');
            return;
        }
        
        if (message.length > 1000) {
            showErrorMessage('Message is too long. Please keep it under 1000 characters.');
            return;
        }
        
        // Check if previous request is still processing
        if (sendButton.disabled) {
            return;
        }
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input and prepare UI for response
        chatInput.value = '';
        showTypingIndicator();
        disableChatInput();
        
        try {
            // Call API with retry mechanism
            const response = await callChatAPI(message);
            
            // Handle successful response
            if (response && response.result.ai_message) {
                addAIMessage(response.result.ai_message);
            } else {
                // Handle empty or invalid response
                addAIMessage(getDefaultResponse(message));
            }
            
        } catch (error) {
            console.error('Chat API Error:', error);
            handleChatError(error, message);
        } finally {
            // Always clean up UI state
            hideTypingIndicator();
            enableChatInput();
        }
    }

    // Global functions for external access
    window.ChatAI = {
        // Core functions
        sendMessage,
        addAIMessage,
        addUserMessage,
        
        // Token management
        getValidToken,
        clearStoredToken: clearStoredToken,
        refreshToken: async function() {
            try {
                clearStoredToken();
                const token = await getValidToken();
                console.log('Token refreshed successfully');
                return token;
            } catch (error) {
                console.error('Failed to refresh token:', error);
                return null;
            }
        },
        
        // Project management
        getProjectId,
        selectProjectById,
        getCurrentProjectId: function() {
            const projectId = getStoredProjectId();
            console.log('Current project ID:', projectId);
            return projectId;
        },
        refreshProjectId: async function() {
            try {
                localStorage.removeItem('prosigmaka_project_id');
                const projectId = await getProjectId();
                console.log('Refreshed project ID:', projectId);
                return projectId;
            } catch (error) {
                console.error('Failed to refresh project ID:', error);
                return null;
            }
        },
        getProjects: async function() {
            try {
                console.log('Fetching projects list...');
                const projects = await fetchProjects();
                console.log('Projects:', projects);
                return projects;
            } catch (error) {
                console.error('Failed to get projects:', error);
                return null;
            }
        },
        
        // Conversation management
        getCurrentConversationId: function() {
            const conversationId = getStoredConversationId();
            console.log('Current conversation ID:', conversationId);
            return conversationId;
        },
        startNewConversation: function() {
            clearConversationId();
            console.log('Started new conversation - conversation ID cleared');
            return true;
        },
        
        // Utility functions
        clearSession: function() {
            clearStoredToken();
            clearConversationId();
            localStorage.removeItem('chat_session_id');
            localStorage.removeItem('prosigmaka_project_id');
            console.log('Chat session cleared');
        },
        buildInferenceURL: async function(message) {
            try {
                const projectId = await getProjectId();
                const encodedMessage = encodeURIComponent(message);
                const storedConversationId = getStoredConversationId();
                
                let url = `${API_CONFIG.baseURL}/projects/${projectId}/inference?human_message=${encodedMessage}`;
                if (storedConversationId) {
                    url += `&conversation_id=${storedConversationId}`;
                }
                
                console.log('Inference URL:', url);
                return url;
            } catch (error) {
                console.error('Failed to build inference URL:', error);
                return null;
            }
        },
        testAPI: async function(testMessage = 'Hello, this is a test message') {
            try {
                console.log('Testing chat API with message:', testMessage);
                const response = await callChatAPI(testMessage);
                console.log('Chat API test successful:', response);
                return response;
            } catch (error) {
                console.error('Chat API test failed:', error);
                return null;
            }
        }
    };
    
    // Event Handlers
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
};

// API Connection Test and Initialization
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        
        // Use global API_CONFIG for testing
        console.log('Using API configuration:', {
            endpoint: API_CONFIG.loginEndpoint,
            credentials: API_CONFIG.credentials
        });
        
        // Test login endpoint
        const loginResponse = await fetch(API_CONFIG.loginEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(API_CONFIG.credentials)
        });
        
        if (loginResponse.ok) {
            console.log('✅ API connection successful');
            console.log('Login endpoint is reachable and credentials are valid');
            
            // Auto-login to get initial token and project ID if ChatAI is available
            if (window.ChatAI) {
                await window.ChatAI.getValidToken();
                console.log('✅ Initial token obtained successfully');
                
                const projectId = await window.ChatAI.getProjectId();
                if (projectId) {
                    console.log('✅ Project ID obtained successfully:', projectId);
                } else {
                    console.warn('⚠️ Could not obtain project ID, chat will work without project context');
                }
            }
            
            return true;
        } else {
            console.warn('⚠️ API connection test failed:', loginResponse.status, loginResponse.statusText);
            return false;
        }
        
    } catch (error) {
        console.error('❌ API connection test error:', error.message);
        return false;
    }
}

// Initialize chat system
async function initializeChatSystem() {
    // Initialize basic chat functionality
    initChatFunctionality();
    
    // Test API connection in background
    const isConnected = await testAPIConnection();
    
    if (isConnected && window.ChatAI) {
        console.log('💬 Chat system initialized with API integration');
        
        // Add welcome message indicating API is connected
        setTimeout(() => {
            window.ChatAI.addAIMessage('Halo! Saya adalah AI Assistant dari ProSigmaka. Saya siap membantu Anda dengan informasi tentang layanan kami!');
        }, 1000);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChatSystem);
} else {
    // DOM already loaded
    initializeChatSystem();
}

// Legacy compatibility - keep old global functions for backward compatibility
window.refreshChatToken = function() {
    return window.ChatAI ? window.ChatAI.refreshToken() : null;
};

window.clearChatSession = function() {
    return window.ChatAI ? window.ChatAI.clearSession() : null;
};

window.getProjects = function() {
    return window.ChatAI ? window.ChatAI.getProjects() : null;
};

window.getCurrentProjectId = function() {
    return window.ChatAI ? window.ChatAI.getCurrentProjectId() : null;
};

window.selectProject = function(identifier) {
    return window.ChatAI ? window.ChatAI.selectProjectById(identifier) : null;
};

window.refreshProjectId = function() {
    return window.ChatAI ? window.ChatAI.refreshProjectId() : null;
};

window.getCurrentConversationId = function() {
    return window.ChatAI ? window.ChatAI.getCurrentConversationId() : null;
};

window.startNewConversation = function() {
    return window.ChatAI ? window.ChatAI.startNewConversation() : null;
};

window.buildInferenceURL = function(message) {
    return window.ChatAI ? window.ChatAI.buildInferenceURL(message) : null;
};

window.testChatAPI = function(testMessage) {
    return window.ChatAI ? window.ChatAI.testAPI(testMessage) : null;
};