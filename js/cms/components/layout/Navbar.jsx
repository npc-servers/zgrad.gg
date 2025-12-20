/**
 * CMS Navbar Component
 */

import { currentUser, triggerLogout } from '../../store/state.js';
import API from '../../services/api.js';
import { Button } from '../ui/Button.jsx';

export function Navbar() {
    const user = currentUser.value;

    const handleLogout = async () => {
        // Stop all background processes first
        triggerLogout();
        
        // Call logout API BEFORE setting the blocking flag
        try {
            await API.logout();
        } catch (error) {
            // Ignore errors during logout - we're leaving anyway
            console.log('Logout request:', error.message);
        }
        
        // Now set the flag to block any further requests
        API.setLoggingOut(true);
        
        window.location.href = '/';
    };

    const avatarUrl = user?.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

    return (
        <nav className="cms-navbar">
            <div className="cms-navbar-container">
                <div className="cms-navbar-brand">
                    <img src="/images/logos/zgrad-logopiece-z.png" alt="ZGRAD Logo" className="cms-logo" />
                    <span className="cms-title">Composer</span>
                </div>
                <div className="cms-navbar-user">
                    {user && (
                        <div className="cms-user-info">
                            <img src={avatarUrl} alt={user.username} className="cms-user-avatar" />
                            <span className="cms-user-name">{user.username}</span>
                        </div>
                    )}
                    <Button variant="secondary" onClick={handleLogout}>
                        Logout
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </Button>
                </div>
            </div>
        </nav>
    );
}

