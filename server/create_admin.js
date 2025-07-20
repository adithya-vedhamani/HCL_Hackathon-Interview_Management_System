const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Function to create admin account
async function createAdmin(username, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/create`, {
      username,
      password
    });
    
    console.log('✅ Admin created successfully!');
    console.log(`👤 Username: ${response.data.admin.username}`);
    console.log(`🆔 ID: ${response.data.admin.id}`);
    console.log(`🔑 Password: ${password}`);
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 500 && error.response?.data?.error?.includes('UNIQUE constraint failed')) {
      console.log('❌ Admin with this username already exists');
    } else {
      console.error('❌ Error creating admin:', error.response?.data?.error || error.message);
    }
    return null;
  }
}

// Function to test admin login
async function testLogin(username, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/login`, {
      username,
      password
    });
    
    console.log('✅ Login successful!');
    console.log(`🎫 Token: ${response.data.token.substring(0, 50)}...`);
    
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);
    return null;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('📝 Usage: node create_admin.js <username> <password>');
    console.log('📝 Example: node create_admin.js admin admin123');
    return;
  }
  
  const [username, password] = args;
  
  console.log('🚀 Creating admin account...\n');
  
  // Create admin
  const admin = await createAdmin(username, password);
  
  if (admin) {
    console.log('\n🔐 Testing login...\n');
    
    // Test login
    const token = await testLogin(username, password);
    
    if (token) {
      console.log('\n🎉 Admin account is ready to use!');
      console.log('\n📋 Login Credentials:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log('\n🌐 Access the application at: http://localhost:3000');
    }
  }
}

// Run the script
main().catch(console.error); 