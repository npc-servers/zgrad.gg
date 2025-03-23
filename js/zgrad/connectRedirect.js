// Check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
}

// Function to get server info based on the current page
function getServerInfo() {
    const path = window.location.pathname;
    return window.getServerByPath ? window.getServerByPath(path) : null;
}

// Function to update the page with server info
function updateServerInfo() {
    const server = getServerInfo();
    if (!server) return;
    
    // Update title
    const titleElement = document.querySelector('.title');
    if (titleElement) {
        titleElement.textContent = `CONNECTING TO ${server.title.replace('ZGRAD ', '')}`;
    }
    
    // Update server IP display
    const serverIpElement = document.getElementById('server-ip');
    if (serverIpElement) {
        serverIpElement.textContent = `connect ${server.ip}:${server.port}`;
    }
}

// Function to copy server command to clipboard
function copyIP() {
    const serverCommand = document.getElementById('server-ip').textContent;
    navigator.clipboard.writeText(serverCommand).then(() => {
        showToast();
        
        // Add visual feedback
        const copyBtn = document.getElementById('copy-ip-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
        
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Function to show and hide toast notification
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only proceed on desktop devices
    if (!isMobileDevice()) {
        // Update the page with server info
        updateServerInfo();
        
        // Get server for redirect
        const server = getServerInfo();
        
        if (server) {
            // Automatically trigger Steam redirect after a short delay
            setTimeout(() => {
                window.location.href = `steam://connect/${server.ip}:${server.port}`;
            }, 1500);
        } else {
            console.error('Server data not available for redirect');
        }
        
        // Add event listener to copy button
        const copyBtn = document.getElementById('copy-ip-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyIP);
        }
    }
}); 