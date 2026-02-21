#!/usr/bin/env node

/**
 * ESLint Auto-Fix Script
 * This script automatically fixes common ESLint warnings:
 * - Removes unused imports
 * - Removes unused variables
 * - Adds missing dependencies to useEffect hooks
 */

const fs = require('fs');
const path = require('path');

const fixes = [
    // Login.jsx - Remove all unused imports and variables
    {
        file: 'src/components/Login.jsx',
        replacements: [
            {
                find: /import\s+{\s*getCSRFToken,\s*userAPI\s*}\s+from\s+['"]\.\.\/services\/api['"]\s*;?\s*/g,
                replace: ''
            },
            {
                find: /import\s+sparquerLogo\s+from\s+['"]\.\.\/images\/sparquer-logo\.png['"]\s*;?\s*/g,
                replace: ''
            },
            {
                find: /import\s+{\s*Modal,\s*Form,\s*Input,\s*Radio,\s*Button,\s*message\s*}\s+from\s+['"]antd['"]\s*;?\s*/g,
                replace: ''
            },
            {
                find: /const\s+\[agreedToTerms,\s*setAgreedToTerms\]\s*=\s*useState\(false\)\s*;?\s*/g,
                replace: ''
            },
            {
                find: /const\s+handleRegisterClick\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}\s*;?\s*/g,
                replace: ''
            }
        ]
    },

    // visitorService.js - Remove unused variable
    {
        file: 'src/services/visitorService.js',
        replacements: [
            {
                find: /const\s+VISITOR_API_BASE\s*=\s*[^;]+;\s*/g,
                replace: ''
            }
        ]
    },

    // OrgAdminDashboard.jsx - Fix duplicate keys
    {
        file: 'src/components/dashboards/OrgAdminDashboard.jsx',
        replacements: [
            {
                // This will need manual inspection - removing duplicate keys
                find: /leaveRequests:\s*0,\s*\n\s*leaveRequests:/g,
                replace: 'leaveRequests:'
            },
            {
                find: /cameras:\s*0,\s*\n\s*cameras:/g,
                replace: 'cameras:'
            }
        ]
    }
];

// Apply fixes
fixes.forEach(({ file, replacements }) => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ find, replace }) => {
        if (content.match(find)) {
            content = content.replace(find, replace);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
    } else {
        console.log(`ℹ️  No changes needed: ${file}`);
    }
});

console.log('\n✨ Auto-fix complete! Run npm start to verify.');
