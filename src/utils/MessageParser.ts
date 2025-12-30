export interface ParsedViolation {
    id: string; // generated unique id for key
    rule: string;
    description: string;
    helpUrl?: string;
    raw: string;
}

// Dictionary of friendly titles for common rules
const FRIENDLY_TITLES: Record<string, string> = {
    'aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty': 'Missing Label',
    'Element has insufficient color contrast': 'Low Color Contrast',
    'Link Name Rule': 'Missing Link Text',
    'Image Alt Rule': 'Missing Image Alt Text',
    'Form element does not have an implicit (wrapped) <label>': 'Missing Form Label',
    'Form element does not have an explicit <label>': 'Missing Form Label',
    'Element has no title attribute': 'Missing Title Attribute',
    'aria-label attribute does not exist or is empty': 'Missing ARIA Label',
    'Element does not have text that is visible to screen readers': 'No Screen Reader Text',
    'Frame Title Rule': 'Missing Frame Title',
    'Button Name Rule': 'Missing Button Name',
    'Link In Text Block Rule': 'Poor Link Distinction',
    'Select Name Rule': 'Missing Select Name',
    'Aria Roles Rule': 'Invalid ARIA Role',
    'Nested Interactive Rule': 'Nested Interactive Controls',
    "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"": 'Redundant Image',
    'Aria Hidden Focus Rule': 'Focusable Hidden Element',
    'Role Img Alt Rule': 'Missing Role=Img Alt Text',
    'Aria Required Children Rule': 'Missing Required ARIA Children'
};

export const parseMessages = (rawMessage: string): ParsedViolation[] => {
    if (!rawMessage) return [];

    // Split by " | " sequence
    const parts = rawMessage.split(' | ');

    return parts.map((part, index) => {
        let clean = part.trim();

        // Remove leading "violation: "
        if (clean.startsWith('violation: ')) {
            clean = clean.substring(11).trim();
        }

        // Remove extra quotes if present
        if (clean.startsWith('"') && clean.endsWith('"')) {
            clean = clean.substring(1, clean.length - 1);
            clean = clean.replace(/""/g, '"');
        }

        // Extract Help URL
        let helpUrl: string | undefined;
        const urlMatch = clean.match(/More information: (https?:\/\/[^\s]+)/);
        if (urlMatch) {
            helpUrl = urlMatch[1];
            clean = clean.replace(urlMatch[0], '').trim();
        }

        // Determine Rule Title
        let rule = 'General Violation';

        // 1. Extract bracketed tag if it exists (e.g. [empty-alt-tag])
        const bracketMatch = clean.match(/^\[([^\]]+)\]/);
        if (bracketMatch) {
            rule = bracketMatch[1];
            // Remove the bracketed tag from the description if it's there
            clean = clean.replace(bracketMatch[0], '').trim();
        } else {
            // 2. Exact match or prefix match in dictionary
            for (const [key, title] of Object.entries(FRIENDLY_TITLES)) {
                if (clean.includes(key)) {
                    rule = title;
                    break;
                }
            }

            // 3. Fallback heuristic if no dictionary match
            if (rule === 'General Violation') {
                const colonIndex = clean.indexOf(':');
                if (colonIndex > 0 && colonIndex < 50) {
                    const distinctName = clean.substring(0, colonIndex);
                    if (!distinctName.includes('\n') && distinctName.length > 3) {
                        rule = distinctName.trim();
                    }
                }
            }
        }

        let description = clean;
        // Clean up description if it blindly contains the key
        // Optional: we can shorten the description if it's identical to the key, 
        // but often the description has details (like contrast ratio).

        // Remove trailing periods
        if (description.endsWith('.')) {
            description = description.substring(0, description.length - 1);
        }

        return {
            id: `viol-${index}`,
            rule,
            description,
            helpUrl,
            raw: part
        };
    });
};

export const getGroupTitle = (messages: string): string => {
    const parsed = parseMessages(messages);
    const rules = Array.from(new Set(parsed.map(p => p.rule))).join(', ');
    return rules;
};
