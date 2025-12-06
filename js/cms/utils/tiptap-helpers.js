/**
 * TipTap Helper Extensions and Configurations
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Extension to exit link mark when pressing space at the end of a link
 */
export const ExitLinkOnSpace = Extension.create({
    name: 'exitLinkOnSpace',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('exitLinkOnSpace'),
                props: {
                    handleKeyDown: (view, event) => {
                        // Check if space key was pressed
                        if (event.key !== ' ') return false;

                        const { state } = view;
                        const { selection } = state;
                        const { $from } = selection;

                        // Check if we're at the end of a link
                        const link = state.schema.marks.link;
                        if (!link) return false;

                        const hasLink = $from.marks().some(mark => mark.type === link);
                        
                        if (hasLink) {
                            // Get the position at the end of the link
                            const { tr } = state;
                            const linkMark = $from.marks().find(mark => mark.type === link);
                            
                            if (linkMark) {
                                // Remove link mark from the space being inserted
                                tr.removeStoredMark(linkMark);
                                view.dispatch(tr);
                            }
                        }

                        return false;
                    },
                },
            }),
        ];
    },
});

