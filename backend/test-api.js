const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing live stock data API...\n');
    
    // Test 1: Get current quote for AAPL
    console.log('1. Testing current quote for AAPL:');
    const quoteResponse = await axios.get('http://localhost:5000/api/stocks/AAPL/quote');
    console.log(JSON.stringify(quoteResponse.data, null, 2));
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Get historical data for AAPL
    console.log('2. Testing historical data for AAPL (1 week):');
    const historyResponse = await axios.get('http://localhost:5000/api/stocks/AAPL?timeRange=1w');
    console.log(`Received ${historyResponse.data.length} data points`);
    console.log('First few data points:');
    console.log(JSON.stringify(historyResponse.data.slice(0, 3), null, 2));
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Test comparison
    console.log('3. Testing stock comparison (AAPL vs MSFT):');
    const compareResponse = await axios.get('http://localhost:5000/api/stocks/compare?symbols=AAPL,MSFT&timeRange=1w');
    console.log('Comparison data structure:');
    console.log(Object.keys(compareResponse.data));
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testAPI();
