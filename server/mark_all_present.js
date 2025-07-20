const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// Function to get all candidates
async function getAllCandidates() {
  try {
    const response = await axios.get(`${API_BASE_URL}/candidates`);
    return response.data;
  } catch (error) {
    console.error('Error fetching candidates:', error.message);
    return [];
  }
}

// Function to mark a candidate as present
async function markCandidatePresent(qrCode) {
  try {
    const response = await axios.post(`${API_BASE_URL}/attendance/scan`, {
      qrCode: qrCode
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
}

// Main function to mark all candidates as present
async function markAllCandidatesPresent() {
  console.log('🚀 Starting to mark all candidates as present...\n');
  
  // Get all candidates
  const candidates = await getAllCandidates();
  
  if (candidates.length === 0) {
    console.log('❌ No candidates found in the database');
    return;
  }
  
  console.log(`📋 Found ${candidates.length} candidates to mark as present\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each candidate
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    
    if (!candidate.qr_code) {
      console.log(`⚠️  Skipping ${candidate.name} - No QR code found`);
      continue;
    }
    
    console.log(`[${i + 1}/${candidates.length}] Marking ${candidate.name} as present...`);
    
    const result = await markCandidatePresent(candidate.qr_code);
    
    if (result.success) {
      console.log(`✅ ${candidate.name} marked as present successfully`);
      successCount++;
    } else {
      console.log(`❌ Failed to mark ${candidate.name} as present: ${result.error}`);
      errorCount++;
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully marked: ${successCount} candidates`);
  console.log(`❌ Failed to mark: ${errorCount} candidates`);
  console.log(`📋 Total processed: ${candidates.length} candidates`);
  
  if (successCount > 0) {
    console.log('\n🎉 Squad formation should now work with present candidates!');
    console.log('💡 You can now test AI squad formation in the frontend.');
  }
}

// Run the script
markAllCandidatesPresent().catch(console.error); 