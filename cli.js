#!/usr/bin/env node

import { AnalyzeRedirectsManager } from './src/index.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk'; // Import chalk for color

// CLI Usage information
const showUsage = () => {
    console.log(`
Usage: analyze-redirects [options]

Options:
  -f, --file <path>     Path to JSON file with URL mappings (Old_URL and New_URL).
  -o, --output <path>   Path to output the generated redirects file (default: ./dist/redirects.txt).
  -a, --analyze-only    Only analyze redirects without generating output file.
  -s, --silent          Suppress console output.
  -h, --help            Display this help message.

Examples:
  analyze-redirects --file ./__test__/demo-urls.json
  analyze-redirects -f ./__test__/demo-urls.json -o ./custom-output/redirects.txt
  analyze-redirects -f ./__test__/demo-urls.json --analyze-only
`);
    process.exit(0);
};

// Parse command-line arguments
const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) {
    showUsage();
}

const fileIndex = args.findIndex(arg => arg === '-f' || arg === '--file');
if (fileIndex === -1 || !args[fileIndex + 1]) {
    console.error('Error: Missing required argument: --file <path>');
    showUsage();
}

const analyzeOnly = args.includes('-a') || args.includes('--analyze-only');
const silent = args.includes('-s') || args.includes('--silent');

const outputIndex = args.findIndex(arg => arg === '-o' || arg === '--output');
const outputPath = outputIndex !== -1 && args[outputIndex + 1]
    ? path.resolve(args[outputIndex + 1])
    : path.resolve('./dist/redirects.txt');

const filePath = path.resolve(args[fileIndex + 1]);

if (!silent) {
    console.log(`Resolved file path: ${filePath}`);
}

// Load JSON file
const loadJsonFile = (filePath) => {
    try {
        if (!silent) console.log(`Loading file: ${filePath}`);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading JSON file at ${filePath}:`, error.message);
        process.exit(1);
    }
};

const writeRedirectsToFile = (redirects) => {
    const rules = redirects.map(({ Pattern }) => Pattern).join('\n');
    try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, rules);
        if (!silent) console.log(` `);
        if (!silent) console.log(`Generated redirects written to: ${outputPath}`);
    } catch (error) {
        console.error(`Failed to write redirects to file: ${error.message}`);
    }
};

// Load and analyze URLs
const urlData = loadJsonFile(filePath);
const manager = new AnalyzeRedirectsManager();
const analysis = manager.customAnalyze(urlData);

// Generate RedirectMatch rules
const redirectRules = analysis.processed;

// Display RedirectMatch rules
if (!silent && !analyzeOnly) {
    console.log(' ');
    console.log('Generated RedirectMatch Rules:');
    redirectRules.forEach(rule => console.log(rule.Pattern));
}

// Write rules to file if not analyze-only mode
if (!analyzeOnly) {
    writeRedirectsToFile(redirectRules);
}

// Display analysis results
if (!silent) {
    console.log(chalk.green('Generated redirects written to:'));
    console.log(chalk.cyan(outputPath));  // Colorize the file path

    console.log(chalk.yellow('\nAnalysis Results:'));

    // Display Duplicates
    if (analysis.duplicates && analysis.duplicates.length > 0) {
        console.log(chalk.bold('\nDuplicates:'));
        analysis.duplicates.forEach((duplicateUrl) => {
            console.log(chalk.green(`${duplicateUrl}`));
            const matchingRedirects = analysis.processed.filter(item => item.Old_URL === duplicateUrl);
            matchingRedirects.forEach(item => {
                console.log(chalk.magenta(`  - ${item.New_URL}`));
            });
        });
    }

    // Display Conflicts
    if (Object.keys(analysis.conflicts).length > 0) {
        console.log(chalk.bold('\nConflicts:'));
        Object.keys(analysis.conflicts).forEach(key => {
            console.log(chalk.red(`Conflict in URL: ${key}`));
            analysis.conflicts[key].forEach(conflictUrl => {
                console.log(chalk.magenta(`  - ${conflictUrl}`));
            });
        });
    }

    // Display Wildcard Suggestions
    if (analysis.wildcardSuggestions && analysis.wildcardSuggestions.length > 0) {
        console.log(chalk.bold('\nWildcard Pattern Suggestions:'));
        analysis.wildcardSuggestions.forEach((suggestion, index) => {
            console.log(chalk.green(`  ${index + 1}. ${suggestion}`));
        });
    }

}

const CLI_PATH = path.resolve('./cli.js');
const TEST_INPUT_FILE = path.resolve('./__test__/demo-urls.json');
const OUTPUT_FILE = path.resolve('./__test__/demo-redirects.txt');

// Utility to run the CLI command and return stdout
const runCLI = (args) => {
    try {
        return execSync(`node ${CLI_PATH} ${args}`, { encoding: 'utf8' });
    } catch (error) {
        return error.stdout || error.message;
    }
};
