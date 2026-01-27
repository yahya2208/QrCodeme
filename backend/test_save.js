// Using native fetch in Node 18+

async function testSave() {
    console.log('🚀 Testing NEXUS ID Cloud Save...');
    try {
        const response = await fetch('http://localhost:3001/api/nexus/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                displayName: "Proof of Achievement",
                bio: "Database record created via Backend API"
            })
        });
        const result = await response.json();
        console.log('📡 Server Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ SUCCESS: Data saved in Supabase via Backend.');
            console.log('ID Created:', result.data.identityId);
        } else {
            console.log('❌ FAILED:', result.error);
        }
    } catch (e) {
        console.error('💀 Connection error:', e.message);
    }
}

testSave();
