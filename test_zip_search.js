// Simple test script to verify zip code filtering
import { searchChiropractors } from './app/lib/queries.js';

async function testZipSearch() {
  console.log('Testing zip code filtering...');

  try {
    // Test search with zip code 10001 (should match organizations in the seed data)
    const filters = { zipCode: '10001' };
    const results = await searchChiropractors(filters, 10);

    console.log(`Found ${results.length} chiropractors for zip code 10001:`);
    results.forEach((chiro, index) => {
      console.log(`${index + 1}. ${chiro.firstName} ${chiro.lastName} - ${chiro.city}, ${chiro.state} ${chiro.zipCode}`);
    });

    // Test search with different zip code
    const filters2 = { zipCode: '11201' };
    const results2 = await searchChiropractors(filters2, 10);

    console.log(`\nFound ${results2.length} chiropractors for zip code 11201:`);
    results2.forEach((chiro, index) => {
      console.log(`${index + 1}. ${chiro.firstName} ${chiro.lastName} - ${chiro.city}, ${chiro.state} ${chiro.zipCode}`);
    });

    // Test search without zip code filter
    const filters3 = {};
    const results3 = await searchChiropractors(filters3, 10);

    console.log(`\nFound ${results3.length} chiropractors with no zip filter:`);
    results3.forEach((chiro, index) => {
      console.log(`${index + 1}. ${chiro.firstName} ${chiro.lastName} - ${chiro.city}, ${chiro.state} ${chiro.zipCode}`);
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testZipSearch();