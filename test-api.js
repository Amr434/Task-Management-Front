const axios = require('axios');
const https = require('https');

async function testApi() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });

    // 1. Login
    const loginRes = await axios.post('https://localhost:7249/api/Auth/login', {
      email: 'amr@example.com',
      password: 'ChangeMe123!'
    }, { httpsAgent: agent });
    
    console.log("Login Success");
    const token = loginRes.data.accessToken;

    // 2. Fetch Pending
    const pendingRes = await axios.get('https://localhost:7249/api/Invitations/pending', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      httpsAgent: agent
    });

    console.log("Pending Invitations:", pendingRes.data);

  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
  }
}

testApi();
