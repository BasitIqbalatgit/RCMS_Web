// debug.js - Run this to test your environment
const { exec } = require('child_process');
const { promises: fs } = require('fs');
const { join } = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

async function debugEnvironment() {
    console.log('=== Environment Debug Script ===\n');
    
    // 1. Check current working directory
    console.log('1. Current working directory:');
    console.log(process.cwd());
    console.log();
    
    // 2. Check if Python is available
    console.log('2. Checking Python installation:');
    try {
        const { stdout, stderr } = await execPromise('python --version');
        console.log('✓ Python version:', stdout.trim());
        if (stderr) console.log('stderr:', stderr);
    } catch (error) {
        console.log('✗ Python not found in PATH');
        console.log('Try using "py" instead of "python" on Windows');
        
        // Try py command on Windows
        try {
            const { stdout } = await execPromise('py --version');
            console.log('✓ Python (via py) version:', stdout.trim());
        } catch (pyError) {
            console.log('✗ Neither "python" nor "py" commands work');
        }
    }
    console.log();
    
    // 3. Check for required files
    console.log('3. Checking required files:');
    const requiredFiles = [
        'car.py',
        'car_classifier_model.h5'
    ];
    
    for (const file of requiredFiles) {
        try {
            const filePath = join(process.cwd(), file);
            const stats = await fs.stat(filePath);
            console.log(`✓ ${file} exists (${stats.size} bytes)`);
        } catch (error) {
            console.log(`✗ ${file} not found`);
        }
    }
    console.log();
    
    // 4. Test temp directory creation
    console.log('4. Testing temp directory:');
    try {
        const tempDir = join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        console.log('✓ Temp directory created/exists at:', tempDir);
        
        // Test file creation in temp directory
        const testFile = join(tempDir, 'test.txt');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        console.log('✓ Can write/delete files in temp directory');
    } catch (error) {
        console.log('✗ Temp directory issue:', error.message);
    }
    console.log();
    
    // 5. Test Python dependencies
    console.log('5. Testing Python dependencies:');
    const testScript = `
import sys
try:
    import tensorflow as tf
    print(f"✓ TensorFlow: {tf.__version__}")
except ImportError:
    print("✗ TensorFlow not installed")

try:
    import cv2
    print(f"✓ OpenCV: {cv2.__version__}")
except ImportError:
    print("✗ OpenCV not installed")

try:
    import numpy as np
    print(f"✓ NumPy: {np.__version__}")
except ImportError:
    print("✗ NumPy not installed")
`;
    
    try {
        const { stdout, stderr } = await execPromise(`python -c "${testScript}"`);
        console.log(stdout);
        if (stderr) console.log('stderr:', stderr);
    } catch (error) {
        console.log('✗ Failed to check Python dependencies');
        console.log('Error:', error.message);
        
        // Try with py command
        try {
            const { stdout } = await execPromise(`py -c "${testScript}"`);
            console.log('(Using py command):');
            console.log(stdout);
        } catch (pyError) {
            console.log('✗ Could not run Python dependency check');
        }
    }
    console.log();
    
    // 6. Directory listing
    console.log('6. Files in project root:');
    try {
        const files = await fs.readdir(process.cwd());
        files.forEach(file => {
            console.log(`   ${file}`);
        });
    } catch (error) {
        console.log('✗ Could not list directory contents');
    }
    
    console.log('\n=== Debug Complete ===');
    console.log('\nNext steps:');
    console.log('1. Make sure Python is installed and in PATH');
    console.log('2. Install required packages: pip install tensorflow opencv-python numpy');
    console.log('3. Ensure car.py and car_classifier_model.h5 are in the project root');
    console.log('4. Replace your API route with the improved version');
}

debugEnvironment().catch(console.error);