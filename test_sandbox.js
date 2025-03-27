// Simple test to verify the E2B sandbox is working
import { Sandbox } from '@e2b/code-interpreter'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// E2B API key
const E2B_API_KEY = process.env.E2B_API_KEY || "e2b_b1222b4303105f1e3560ecd7029c5845a9a194ff";

async function testRSandbox() {
  try {
    console.log('Creating E2B sandbox with API key:', E2B_API_KEY)
    const sandbox = await Sandbox.create({ apiKey: E2B_API_KEY })
    
    console.log('Running basic R code...')
    const execution = await sandbox.runCode('print("Hello, world from R!"); print(R.version.string)', { 
      language: 'r',
      timeoutMs: 30000,
      onStdout: (data) => console.log('[stdout]', data),
      onStderr: (data) => console.error('[stderr]', data)
    })
    
    console.log('Execution completed:', execution.error ? 'with errors' : 'successfully')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testRSandbox()