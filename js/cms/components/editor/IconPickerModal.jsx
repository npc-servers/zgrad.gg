/**
 * Icon Picker Modal Component
 * Allows users to search and select icons from Iconify
 */

import { useState, useEffect, useRef } from 'preact/hooks';

export function IconPickerModal({ isOpen, onClose, onSelectIcon }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [icons, setIcons] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState('favorites');
    const [favorites, setFavorites] = useState([]);
    const searchDebounceRef = useRef(null);
    
    // Popular icon collections
    const collections = [
        { id: 'favorites', name: 'Favorites' },
        { id: 'mdi', name: 'Material Design' },
        { id: 'fa6-solid', name: 'Font Awesome' },
        { id: 'heroicons', name: 'Heroicons' },
        { id: 'lucide', name: 'Lucide' },
        { id: 'tabler', name: 'Tabler' },
    ];

    // Load favorites from cookies on mount
    useEffect(() => {
        const savedFavorites = getCookie('iconFavorites');
        if (savedFavorites) {
            try {
                setFavorites(JSON.parse(savedFavorites));
            } catch (e) {
                console.error('Error loading favorites:', e);
            }
        }
    }, []);

    // Cookie helper functions
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const setCookie = (name, value, days = 365) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    };

    // Favorites management
    const toggleFavorite = (icon) => {
        const isFavorite = favorites.some(fav => fav.fullName === icon.fullName);
        let newFavorites;
        
        if (isFavorite) {
            newFavorites = favorites.filter(fav => fav.fullName !== icon.fullName);
        } else {
            newFavorites = [...favorites, icon];
        }
        
        setFavorites(newFavorites);
        setCookie('iconFavorites', JSON.stringify(newFavorites));
    };

    const isFavorite = (iconFullName) => {
        return favorites.some(fav => fav.fullName === iconFullName);
    };

    useEffect(() => {
        // Track if this effect is still active (for async cleanup)
        let isActive = true;
        
        // Clear any pending debounced search
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }
        
        if (isOpen && searchQuery.length > 0 && selectedCollection !== 'favorites') {
            // Debounce the search to prevent excessive API calls while typing
            searchDebounceRef.current = setTimeout(() => {
                if (isActive) {
                    searchIcons(searchQuery, isActive);
                }
            }, 300);
        } else if (selectedCollection === 'favorites') {
            setIcons(favorites);
        } else {
            setIcons([]);
        }
        
        // Cleanup function - cancel pending updates and debounced searches
        return () => {
            isActive = false;
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = null;
            }
        };
    }, [searchQuery, selectedCollection, isOpen, favorites]);

    // Calculate dynamic height for icon results based on number of icons
    const getResultsStyle = () => {
        const iconCount = icons.length;
        if (iconCount === 0) return {};
        
        // Estimate rows needed (assuming ~8 icons per row at 500px width)
        const iconsPerRow = 8;
        const rows = Math.ceil(iconCount / iconsPerRow);
        const rowHeight = 58; // ~50px icon + 8px gap
        const calculatedHeight = Math.min(Math.max(rows * rowHeight + 24, 150), 450);
        
        return { height: `${calculatedHeight}px` };
    };

    const searchIcons = async (query, isActive = true) => {
        if (!query || query.trim().length === 0) {
            setIcons([]);
            return;
        }

        setIsLoading(true);
        try {
            // Search using Iconify API
            const response = await fetch(
                `https://api.iconify.design/search?query=${encodeURIComponent(query)}&prefix=${selectedCollection}&limit=50`
            );
            
            // Check if we should still update state
            if (!isActive) return;
            
            const data = await response.json();
            
            // Check again after parsing JSON
            if (!isActive) return;
            
            if (data.icons && data.icons.length > 0) {
                // Use the simple, proven approach: direct SVG URLs
                const iconResults = data.icons.slice(0, 30).map((iconIdentifier) => {
                    // Check if the icon already has a collection prefix
                    let fullName;
                    let iconName;
                    
                    if (iconIdentifier.includes(':')) {
                        // Already has collection prefix (e.g., "mdi:home")
                        fullName = iconIdentifier;
                        iconName = iconIdentifier.split(':')[1];
                    } else {
                        // No prefix, add it
                        fullName = `${selectedCollection}:${iconIdentifier}`;
                        iconName = iconIdentifier;
                    }
                    
                    // Direct URL approach (proven to work in servers.html)
                    const iconUrl = `https://api.iconify.design/${fullName}.svg`;
                    
                    return {
                        name: iconName,
                        fullName: fullName,
                        url: iconUrl,
                    };
                });
                
                setIcons(iconResults);
            } else {
                setIcons([]);
            }
        } catch (error) {
            // Only log if still active (not cancelled)
            if (isActive) {
                console.error('Error fetching icons:', error);
                setIcons([]);
            }
        } finally {
            if (isActive) {
                setIsLoading(false);
            }
        }
    };

    const handleSelectIcon = async (icon) => {
        try {
            // Fetch the SVG data from the URL
            const response = await fetch(icon.url);
            const svgData = await response.text();
            onSelectIcon(svgData, icon.fullName);
        } catch (error) {
            console.error('Error fetching icon SVG:', error);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setIcons([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="cms-modal" style={{ display: 'flex' }}>
            <div className="cms-modal-content cms-icon-picker-content" style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="cms-modal-header">
                    <h2 className="cms-modal-title">Insert Icon</h2>
                    <button
                        type="button"
                        className="cms-modal-close"
                        onClick={handleClose}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="cms-modal-body">
                    <div className="cms-icon-search">
                        <div className="cms-icon-collections">
                            {collections.map((collection) => (
                                <label key={collection.id}>
                                    <input
                                        type="radio"
                                        name="collection"
                                        value={collection.id}
                                        checked={selectedCollection === collection.id}
                                        onChange={(e) => setSelectedCollection(e.target.value)}
                                    />
                                    {collection.name}
                                </label>
                            ))}
                        </div>

                        {selectedCollection !== 'favorites' && (
                            <>
                                <label className="cms-label" style={{ marginTop: '12px' }}>Search Icons</label>
                                <input
                                    type="text"
                                    className="cms-input"
                                    placeholder="Type to search icons... (e.g., 'home', 'user', 'settings')"
                                    value={searchQuery}
                                    onInput={(e) => setSearchQuery(e.target.value)}
                                />
                            </>
                        )}
                    </div>

                    <div className="cms-icon-results" style={getResultsStyle()}>
                        {selectedCollection === 'favorites' && favorites.length === 0 && (
                            <div className="cms-icon-placeholder">
                                No favorites yet. Click the heart on any icon to add it to favorites.
                            </div>
                        )}

                        {selectedCollection !== 'favorites' && !searchQuery && (
                            <div className="cms-icon-placeholder">
                                Type a search term to find icons
                            </div>
                        )}
                        
                        {selectedCollection !== 'favorites' && isLoading && searchQuery && (
                            <div className="cms-icon-loading">
                                Loading icons...
                            </div>
                        )}
                        
                        {selectedCollection !== 'favorites' && !isLoading && searchQuery && icons.length === 0 && (
                            <div className="cms-icon-placeholder">
                                No icons found. Try a different search term.
                            </div>
                        )}
                        
                        {icons.length > 0 && icons.map((icon) => (
                            <div key={icon.fullName} className="cms-icon-item-wrapper">
                                <button
                                    type="button"
                                    className="cms-icon-item"
                                    onClick={() => handleSelectIcon(icon)}
                                    title={icon.fullName}
                                >
                                    <img src={icon.url} alt={icon.name} />
                                </button>
                                <button
                                    type="button"
                                    className={`cms-icon-favorite-btn ${isFavorite(icon.fullName) ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(icon);
                                    }}
                                    title={isFavorite(icon.fullName) ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    {isFavorite(icon.fullName) ? '❤️' : '🤍'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

