// Custom TipTap Extensions for ZGRAD Guide Elements
import { Node, mergeAttributes } from '@tiptap/core';

// Step Card Extension with editable title
// Uses a wrapper structure with all content editable
export const StepCard = Node.create({
    name: 'stepCard',
    
    group: 'block',
    
    content: 'block+',
    
    defining: true,
    
    parseHTML() {
        return [
            {
                tag: 'div[data-type="step-card"]',
            },
            {
                tag: 'div.step-card',
                priority: 51,
            },
        ];
    },
    
    renderHTML() {
        return [
            'div',
            {
                'data-type': 'step-card',
                'class': 'step-card',
            },
            0, // All content goes here
        ];
    },
    
    addCommands() {
        return {
            setStepCard: (attributes) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    content: [
                        {
                            type: 'heading',
                            attrs: { level: 3, class: 'step-card-title' },
                            content: [
                                {
                                    type: 'text',
                                    text: attributes?.title || 'Step Title',
                                },
                            ],
                        },
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Add step description here...',
                                },
                            ],
                        },
                    ],
                });
            },
        };
    },
});

// Info Box Extension
export const InfoBox = Node.create({
    name: 'infoBox',
    
    group: 'block',
    
    content: 'block+',
    
    parseHTML() {
        return [
            {
                tag: 'div[data-type="info-box"]',
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-type': 'info-box',
                'class': 'info-box',
            }),
            0,
        ];
    },
    
    addCommands() {
        return {
            setInfoBox: () => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Add important information here...',
                                },
                            ],
                        },
                    ],
                });
            },
        };
    },
});

// Guide Image Extension (enhanced image with styling)
export const GuideImage = Node.create({
    name: 'guideImage',
    
    group: 'block',
    
    atom: true,
    
    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            title: {
                default: null,
            },
            width: {
                default: '600px',
            },
            align: {
                default: 'center', // left, center, right
            },
        };
    },
    
    parseHTML() {
        return [
            {
                tag: 'div[data-type="guide-image"]',
                getAttrs: (dom) => {
                    const img = dom.querySelector('img');
                    return {
                        src: img?.getAttribute('src'),
                        alt: img?.getAttribute('alt'),
                        title: img?.getAttribute('title'),
                        width: dom.getAttribute('data-width') || '600px',
                        align: dom.getAttribute('data-align') || 'center',
                    };
                },
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        const align = HTMLAttributes.align || 'center';
        const alignStyle = {
            left: 'margin-right: auto;',
            center: 'margin-left: auto; margin-right: auto;',
            right: 'margin-left: auto;',
        }[align] || 'margin-left: auto; margin-right: auto;';
        
        return [
            'div',
            mergeAttributes({
                'data-type': 'guide-image',
                'data-width': HTMLAttributes.width,
                'data-align': align,
                'class': 'guide-image',
                'style': `text-align: ${align};`,
            }),
            [
                'img',
                {
                    src: HTMLAttributes.src,
                    alt: HTMLAttributes.alt || '',
                    title: HTMLAttributes.title || '',
                    style: `width: 100%; max-width: ${HTMLAttributes.width || '600px'}; border-radius: 8px; margin: 16px 0; ${alignStyle} display: block;`,
                },
            ],
        ];
    },
    
    addCommands() {
        return {
            setGuideImage: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
            updateGuideImage: (options) => ({ commands, state }) => {
                const { selection } = state;
                const node = state.doc.nodeAt(selection.from);
                
                if (node && node.type.name === 'guideImage') {
                    return commands.updateAttributes('guideImage', options);
                }
                return false;
            },
        };
    },
});

// Code inline extension
export const InlineCode = Node.create({
    name: 'inlineCode',
    
    inline: true,
    
    group: 'inline',
    
    content: 'text*',
    
    parseHTML() {
        return [
            {
                tag: 'code',
            },
        ];
    },
    
    renderHTML({ HTMLAttributes }) {
        return [
            'code',
            mergeAttributes(HTMLAttributes),
            0,
        ];
    },
    
    addCommands() {
        return {
            setInlineCode: () => ({ commands }) => {
                return commands.toggleMark('code');
            },
        };
    },
});

// Icon Extension - for inline SVG icons from Iconify
export const Icon = Node.create({
    name: 'icon',
    
    inline: true,
    
    group: 'inline',
    
    atom: true,
    
    addAttributes() {
        return {
            iconName: {
                default: null,
            },
            iconData: {
                default: null, // SVG data
            },
            color: {
                default: 'currentColor',
            },
            size: {
                default: '1em',
            },
        };
    },
    
    parseHTML() {
        return [
            {
                tag: 'span[data-type="icon"]',
                getAttrs: (dom) => ({
                    iconName: dom.getAttribute('data-icon-name'),
                    iconData: dom.getAttribute('data-icon-data'),
                    color: dom.getAttribute('data-color') || 'currentColor',
                    size: dom.getAttribute('data-size') || '1em',
                }),
            },
        ];
    },
    
    renderHTML({ HTMLAttributes, node }) {
        // Create a wrapper span
        const wrapper = document.createElement('span');
        Object.assign(wrapper, mergeAttributes({
            'data-type': 'icon',
            'data-icon-name': HTMLAttributes.iconName,
            'data-icon-data': HTMLAttributes.iconData,
            'data-color': HTMLAttributes.color,
            'data-size': HTMLAttributes.size,
            'class': 'guide-icon',
            'style': `display: inline-flex; align-items: center; color: ${HTMLAttributes.color}; width: ${HTMLAttributes.size}; height: ${HTMLAttributes.size};`,
        }));
        
        // Insert SVG as innerHTML
        wrapper.innerHTML = HTMLAttributes.iconData;
        
        return {
            dom: wrapper,
        };
    },
    
    addCommands() {
        return {
            insertIcon: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});

