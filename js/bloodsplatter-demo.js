// Bloodsplatter Animation Demo/Test Script
// This file can be used to manually trigger animations for testing

// Demo functions for testing bloodsplatter animations
window.BloodsplatterDemo = {
    
    // Trigger all bloodsplatter animations at once (for testing)
    triggerAllSplatters: function() {
        const bloodsplatterElements = document.querySelectorAll([
            '.bloodsplatter-decoration-left',
            '.bloodsplatter-decoration-right',
            '.bloodsplatter-decoration-ragdoll',
            '.bloodsplatter-decoration-medical',
            '.bloodsplatter-decoration-gore',
            '.bloodsplatter-decoration-cw',
            '.bloodsplatter-decoration-classes'
        ].join(', '));
        
        bloodsplatterElements.forEach((element, index) => {
            const img = element.querySelector('img');
            if (!img) return;
            
            // Determine splatter type
            let splatterType = '';
            for (const className of element.classList) {
                if (className.startsWith('bloodsplatter-decoration-')) {
                    splatterType = className;
                    break;
                }
            }
            
            // Get config (simplified version for demo with noise patterns)
            const configs = {
                'bloodsplatter-decoration-left': { centerX: 80, centerY: 30, duration: 0.4 },
                'bloodsplatter-decoration-right': { centerX: 20, centerY: 70, duration: 0.3 },
                'bloodsplatter-decoration-ragdoll': { centerX: 75, centerY: 40, duration: 0.5 },
                'bloodsplatter-decoration-medical': { centerX: 25, centerY: 35, duration: 0.4 },
                'bloodsplatter-decoration-gore': { centerX: 70, centerY: 60, duration: 0.5 },
                'bloodsplatter-decoration-cw': { centerX: 30, centerY: 45, duration: 0.45 },
                'bloodsplatter-decoration-classes': { centerX: 65, centerY: 25, duration: 0.55 }
            };
            
            const config = configs[splatterType];
            if (!config) return;
            
            // Animate with delay using noise patterns
            gsap.delayedCall(index * 0.05, () => {
                // Get unique seed for this splatter
                const seed = window.BloodsplatterAnimations?.getSplatterSeed ? 
                    window.BloodsplatterAnimations.getSplatterSeed(splatterType) : 
                    Math.random() * 100;
                
                gsap.to(img, {
                    duration: config.duration,
                    ease: "power3.out",
                    onUpdate: function() {
                        const progress = this.progress() * 150; // Match main animation
                        // Use the noise function if available, fallback to simple reveal
                        if (window.BloodsplatterAnimations?.createNoisyRevealPath) {
                            const noisyPath = window.BloodsplatterAnimations.createNoisyRevealPath(
                                progress, config.centerX, config.centerY, seed
                            );
                            img.style.clipPath = noisyPath;
                        } else {
                            // Fallback to simple polygon
                            img.style.clipPath = `polygon(${config.centerX}% ${config.centerY}%)`;
                        }
                    },
                    onComplete: () => {
                        element.classList.add('bloodsplatter-revealed');
                    }
                });
                
                // No additional effects - just the reveal
            });
        });
        
        console.log('🩸 Triggered all bloodsplatter reveals');
    },
    
    // Reset all animations to initial state
    resetAllSplatters: function() {
        const bloodsplatterElements = document.querySelectorAll([
            '.bloodsplatter-decoration-left',
            '.bloodsplatter-decoration-right',
            '.bloodsplatter-decoration-ragdoll',
            '.bloodsplatter-decoration-medical',
            '.bloodsplatter-decoration-gore',
            '.bloodsplatter-decoration-cw',
            '.bloodsplatter-decoration-classes'
        ].join(', '));
        
        bloodsplatterElements.forEach(element => {
            const img = element.querySelector('img');
            if (!img) return;
            
            // Determine splatter type
            let splatterType = '';
            for (const className of element.classList) {
                if (className.startsWith('bloodsplatter-decoration-')) {
                    splatterType = className;
                    break;
                }
            }
            
            // Reset to hidden state using noise patterns
            const configs = {
                'bloodsplatter-decoration-left': { centerX: 80, centerY: 30 },
                'bloodsplatter-decoration-right': { centerX: 20, centerY: 70 },
                'bloodsplatter-decoration-ragdoll': { centerX: 75, centerY: 40 },
                'bloodsplatter-decoration-medical': { centerX: 25, centerY: 35 },
                'bloodsplatter-decoration-gore': { centerX: 70, centerY: 60 },
                'bloodsplatter-decoration-cw': { centerX: 30, centerY: 45 },
                'bloodsplatter-decoration-classes': { centerX: 65, centerY: 25 }
            };
            
            const config = configs[splatterType] || { centerX: 50, centerY: 50 };
            const seed = window.BloodsplatterAnimations?.getSplatterSeed ? 
                window.BloodsplatterAnimations.getSplatterSeed(splatterType) : 
                Math.random() * 100;
            
            let hiddenPath = 'polygon(50% 50%)'; // Default fallback
            if (window.BloodsplatterAnimations?.createNoisyRevealPath) {
                hiddenPath = window.BloodsplatterAnimations.createNoisyRevealPath(0, config.centerX, config.centerY, seed);
            }
            
            gsap.set(img, {
                clipPath: hiddenPath
            });
            
            element.classList.remove('bloodsplatter-revealed');
        });
        
        console.log('🔄 Reset all bloodsplatter reveals');
    },
    
    // Trigger a specific splatter by type
    triggerSplatter: function(splatterType) {
        const element = document.querySelector(`.${splatterType}`);
        if (!element) {
            console.log(`❌ Splatter type "${splatterType}" not found`);
            return;
        }
        
        const img = element.querySelector('img');
        if (!img) return;
        
        const configs = {
            'bloodsplatter-decoration-left': { centerX: 80, centerY: 30, duration: 0.4 },
            'bloodsplatter-decoration-right': { centerX: 20, centerY: 70, duration: 0.3 },
            'bloodsplatter-decoration-ragdoll': { centerX: 75, centerY: 40, duration: 0.5 },
            'bloodsplatter-decoration-medical': { centerX: 25, centerY: 35, duration: 0.4 },
            'bloodsplatter-decoration-gore': { centerX: 70, centerY: 60, duration: 0.5 },
            'bloodsplatter-decoration-cw': { centerX: 30, centerY: 45, duration: 0.45 },
            'bloodsplatter-decoration-classes': { centerX: 65, centerY: 25, duration: 0.55 }
        };
        
        const config = configs[splatterType];
        if (!config) return;
        
        // Get unique seed for this splatter
        const seed = window.BloodsplatterAnimations?.getSplatterSeed ? 
            window.BloodsplatterAnimations.getSplatterSeed(splatterType) : 
            Math.random() * 100;
        
        gsap.to(img, {
            duration: config.duration,
            ease: "power3.out",
            onUpdate: function() {
                const progress = this.progress() * 150; // Match main animation
                // Use the noise function if available
                if (window.BloodsplatterAnimations?.createNoisyRevealPath) {
                    const noisyPath = window.BloodsplatterAnimations.createNoisyRevealPath(
                        progress, config.centerX, config.centerY, seed
                    );
                    img.style.clipPath = noisyPath;
                } else {
                    // Fallback to simple polygon
                    img.style.clipPath = `polygon(${config.centerX}% ${config.centerY}%)`;
                }
            }
        });
        
        // No additional effects - just the reveal
        
        element.classList.add('bloodsplatter-revealed');
        console.log(`🩸 Triggered ${splatterType} reveal`);
    },
    
    // Show available splatter types
    listSplatterTypes: function() {
        const types = [
            'bloodsplatter-decoration-left',
            'bloodsplatter-decoration-right',
            'bloodsplatter-decoration-ragdoll',
            'bloodsplatter-decoration-medical',
            'bloodsplatter-decoration-gore',
            'bloodsplatter-decoration-cw',
            'bloodsplatter-decoration-classes'
        ];
        
        console.log('Available splatter types:', types);
        return types;
    }
};

// Console helper messages
console.log(`
🩸 Bloodsplatter Animation Demo Loaded!

Available commands:
- BloodsplatterDemo.triggerAllSplatters() - Trigger all reveal animations
- BloodsplatterDemo.resetAllSplatters() - Reset all to hidden state
- BloodsplatterDemo.triggerSplatter('type') - Trigger specific splatter reveal
- BloodsplatterDemo.listSplatterTypes() - Show available types

Example: BloodsplatterDemo.triggerSplatter('bloodsplatter-decoration-gore')
Note: Clean noise-based reveals only - no particles or glow effects
`); 