document.addEventListener('DOMContentLoaded', function() {
    initDiscordSection();
});

function initDiscordSection() {
    fetchDiscordData()
        .then(data => {
            updateDiscordStats(data);
            renderMembers(data);
        })
        .catch(error => {
            console.error('Error fetching Discord data:', error);
            // Show fallback content if there's an error
            document.querySelector('.discord-members').innerHTML = `
                <div class="error-container">
                    <div class="error-message">Failed to load Discord data. Please try again later.</div>
                    <a href="https://discord.gg/npc" class="discord-button">
                        Join our Discord
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36" fill="currentColor">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                        </svg>
                    </a>
                </div>
            `;
        });
}

async function fetchDiscordData() {
    try {
        const response = await fetch('https://discord.com/api/guilds/539289943004938251/widget.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching Discord data:', error);
        throw error;
    }
}

function updateDiscordStats(data) {
    // Use presence_count for the accurate count of online members
    const onlineCount = data.presence_count || 0;
    
    // Update server name
    document.getElementById('discord-server-name').textContent = data.name;
    
    // Update online members count in header
    document.querySelector('.members-count').textContent = `${onlineCount} online`;
}

function renderMembers(data) {
    const membersList = document.querySelector('.members-list');
    membersList.innerHTML = '';
    
    // Display up to 10 members
    const membersToShow = data.members.slice(0, 10);
    
    membersToShow.forEach(member => {
        const statusClass = getStatusClass(member.status);
        const gameStatus = member.game ? `Playing ${member.game.name}` : 'Online';
        
        const memberElement = document.createElement('div');
        memberElement.className = 'member';
        memberElement.innerHTML = `
            <div class="member-avatar">
                <img src="${member.avatar_url}" alt="${member.username}">
            </div>
            <div class="member-info">
                <div class="member-name">${member.username}</div>
                <div class="member-status">
                    <div class="status-indicator ${statusClass}"></div>
                    <div class="status-text">${member.game ? gameStatus : member.status}</div>
                </div>
            </div>
        `;
        
        membersList.appendChild(memberElement);
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'online':
            return 'status-online';
        case 'idle':
            return 'status-idle';
        case 'dnd':
            return 'status-dnd';
        default:
            return 'status-online';
    }
} 